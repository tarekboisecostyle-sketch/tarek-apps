/* BES Vectorizer — moteur de vectorisation (contour + centerline V-carve) et export DXF R12 / SVG.
   Aucune dépendance. Utilisable dans le navigateur (window.BESVec) et dans Node (module.exports). */
(function (root) {
  'use strict';

  /* ---------- 1. Image -> masque binaire ---------- */

  // rgba : Uint8ClampedArray (w*h*4). Retourne Float32 luminance 0..255 (transparent = blanc)
  function toGray(rgba, w, h) {
    const g = new Float32Array(w * h);
    for (let i = 0, j = 0; i < g.length; i++, j += 4) {
      const a = rgba[j + 3] / 255;
      const l = 0.299 * rgba[j] + 0.587 * rgba[j + 1] + 0.114 * rgba[j + 2];
      g[i] = l * a + 255 * (1 - a);
    }
    return g;
  }

  function otsu(gray) {
    const hist = new Float64Array(256);
    for (let i = 0; i < gray.length; i++) hist[gray[i] | 0]++;
    const total = gray.length;
    let sum = 0;
    for (let t = 0; t < 256; t++) sum += t * hist[t];
    let sumB = 0, wB = 0, best = 0, thr = 128;
    for (let t = 0; t < 256; t++) {
      wB += hist[t]; if (!wB) continue;
      const wF = total - wB; if (!wF) break;
      sumB += t * hist[t];
      const mB = sumB / wB, mF = (sum - sumB) / wF;
      const v = wB * wF * (mB - mF) * (mB - mF);
      if (v > best) { best = v; thr = t; }
    }
    return thr + 0.5;
  }

  // masque : 1 = matière (sombre par défaut)
  function threshold(gray, thr, invert) {
    const m = new Uint8Array(gray.length);
    for (let i = 0; i < gray.length; i++) {
      const dark = gray[i] < thr;
      m[i] = (invert ? !dark : dark) ? 1 : 0;
    }
    return m;
  }

  // Supprime les composantes (4-connexes) de valeur `val` plus petites que minArea px
  function removeSmall(m, w, h, val, minArea) {
    if (minArea <= 0) return;
    const lab = new Int32Array(w * h).fill(-1);
    const stack = new Int32Array(w * h);
    const comp = new Int32Array(w * h);
    for (let s = 0; s < m.length; s++) {
      if (m[s] !== val || lab[s] !== -1) continue;
      let sp = 0, n = 0, touchesBorder = false;
      stack[sp++] = s; lab[s] = s;
      while (sp) {
        const p = stack[--sp]; comp[n++] = p;
        const x = p % w, y = (p / w) | 0;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touchesBorder = true;
        if (x > 0 && m[p - 1] === val && lab[p - 1] === -1) { lab[p - 1] = s; stack[sp++] = p - 1; }
        if (x < w - 1 && m[p + 1] === val && lab[p + 1] === -1) { lab[p + 1] = s; stack[sp++] = p + 1; }
        if (y > 0 && m[p - w] === val && lab[p - w] === -1) { lab[p - w] = s; stack[sp++] = p - w; }
        if (y < h - 1 && m[p + w] === val && lab[p + w] === -1) { lab[p + w] = s; stack[sp++] = p + w; }
      }
      // un "trou" blanc qui touche le bord est le fond : on ne le remplit jamais
      if (n < minArea && !(val === 0 && touchesBorder)) {
        for (let k = 0; k < n; k++) m[comp[k]] = 1 - val;
      }
    }
  }

  /* ---------- 2. Géométrie de base ---------- */

  function rdp(pts, tol, closed) {
    // pts : [[x,y],...]
    if (pts.length < 3 || tol <= 0) return pts.slice();
    if (closed) {
      // découpe au point le plus éloigné du premier pour garder une forme stable
      let far = 0, fd = -1;
      for (let i = 1; i < pts.length; i++) {
        const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2;
        if (d > fd) { fd = d; far = i; }
      }
      const a = rdp(pts.slice(0, far + 1), tol, false);
      const b = rdp(pts.slice(far).concat([pts[0]]), tol, false);
      return a.slice(0, -1).concat(b.slice(0, -1));
    }
    const keep = new Uint8Array(pts.length);
    keep[0] = keep[pts.length - 1] = 1;
    const st = [[0, pts.length - 1]];
    const t2 = tol * tol;
    while (st.length) {
      const [a, b] = st.pop();
      const ax = pts[a][0], ay = pts[a][1], bx = pts[b][0], by = pts[b][1];
      const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
      let md = -1, mi = -1;
      for (let i = a + 1; i < b; i++) {
        let d;
        if (L2 === 0) d = (pts[i][0] - ax) ** 2 + (pts[i][1] - ay) ** 2;
        else { const c = dx * (pts[i][1] - ay) - dy * (pts[i][0] - ax); d = c * c / L2; }
        if (d > md) { md = d; mi = i; }
      }
      if (md > t2) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
    }
    const out = [];
    for (let i = 0; i < pts.length; i++) if (keep[i]) out.push(pts[i]);
    return out;
  }

  function turnAngle(p0, p1, p2) {
    const a1 = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const a2 = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    let d = Math.abs(a2 - a1);
    if (d > Math.PI) d = 2 * Math.PI - d;
    return d * 180 / Math.PI;
  }

  // Lissage de Chaikin qui garde les angles vifs (> cornerDeg)
  function smooth(pts, iters, closed, cornerDeg) {
    let p = pts;
    for (let it = 0; it < iters; it++) {
      const n = p.length;
      if (n < 3) return p;
      const out = [];
      for (let i = 0; i < n; i++) {
        const isEnd = !closed && (i === 0 || i === n - 1);
        const prev = p[(i - 1 + n) % n], cur = p[i], next = p[(i + 1) % n];
        if (isEnd || turnAngle(prev, cur, next) > cornerDeg) { out.push(cur); continue; }
        out.push([0.25 * prev[0] + 0.75 * cur[0], 0.25 * prev[1] + 0.75 * cur[1]]);
        out.push([0.75 * cur[0] + 0.25 * next[0], 0.75 * cur[1] + 0.25 * next[1]]);
      }
      p = out;
    }
    return p;
  }

  function polyArea(p) {
    let a = 0;
    for (let i = 0, n = p.length; i < n; i++) {
      const q = p[(i + 1) % n];
      a += p[i][0] * q[1] - q[0] * p[i][1];
    }
    return a / 2;
  }

  function polyLength(p, closed) {
    let L = 0;
    for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (closed && p.length > 1) L += Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]);
    return L;
  }

  /* ---------- 3. Tracé des contours (suivi des arêtes de pixels) ---------- */

  // Retourne [{closed:true, pts:[[x,y]...]}] en coordonnées pixel (y vers le bas)
  function traceOutlines(m, w, h, opt) {
    const W1 = w + 1;
    const out = new Uint8Array(W1 * (h + 1)); // bits : 1=E 2=S 4=W 8=N (arêtes sortantes)
    const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) ? m[y * w + x] : 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      if (!at(x, y - 1)) out[y * W1 + x] |= 1;            // haut : (x,y)->(x+1,y)  E
      if (!at(x + 1, y)) out[y * W1 + x + 1] |= 2;        // droite : (x+1,y)->(x+1,y+1) S
      if (!at(x, y + 1)) out[(y + 1) * W1 + x + 1] |= 4;  // bas : (x+1,y+1)->(x,y+1) W
      if (!at(x - 1, y)) out[(y + 1) * W1 + x] |= 8;      // gauche : (x,y+1)->(x,y) N
    }
    const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
    const loops = [];
    for (let v = 0; v < out.length; v++) {
      while (out[v]) {
        let d = out[v] & 1 ? 0 : out[v] & 2 ? 1 : out[v] & 4 ? 2 : 3;
        let x = v % W1, y = (v / W1) | 0;
        const sx = x, sy = y;
        const pts = [];
        let lastDir = -1;
        for (;;) {
          const vi = y * W1 + x;
          out[vi] &= ~(1 << d);
          if (d !== lastDir) { pts.push([x, y]); lastDir = d; }
          x += DX[d]; y += DY[d];
          if (x === sx && y === sy) break;
          const bits = out[y * W1 + x];
          if (!bits) break; // sécurité
          // virage à droite d'abord (sépare les pixels en diagonale), puis tout droit, puis gauche
          const r = (d + 1) & 3, s = d, l = (d + 3) & 3;
          d = bits & (1 << r) ? r : bits & (1 << s) ? s : l;
        }
        if (pts.length >= 3) loops.push(pts);
      }
    }
    const res = [];
    const minArea = opt.minArea || 0;
    for (const raw of loops) {
      if (Math.abs(polyArea(raw)) < Math.max(minArea, 2)) continue;
      // enlève l'escalier : milieu des petits segments, coins gardés sur les longs
      const n = raw.length, pts = [];
      for (let i = 0; i < n; i++) {
        const a = raw[i], b = raw[(i + 1) % n];
        const L = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        if (L > 2.5) { pts.push(a, b); } else pts.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
      }
      const p = dedupe(pts, true);
      if (p.length >= 3) res.push(...refinePath(p, true, opt));
    }
    return res;
  }

  function dedupe(p, closed) {
    const o = [];
    for (const q of p) {
      const l = o[o.length - 1];
      if (!l || Math.abs(l[0] - q[0]) > 1e-9 || Math.abs(l[1] - q[1]) > 1e-9) o.push(q);
    }
    if (closed && o.length > 1) {
      const a = o[0], b = o[o.length - 1];
      if (Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9) o.pop();
    }
    return o;
  }

  /* ---------- 4. Centerline (V-carve) : squelette Zhang-Suen + graphe ---------- */

  function thin(m, w, h) {
    // copie avec bord de 1 px
    const W = w + 2, H = h + 2;
    const s = new Uint8Array(W * H);
    let list = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) {
      const i = (y + 1) * W + x + 1; s[i] = 1; list.push(i);
    }
    const del = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (let pass = 0; pass < 2; pass++) {
        del.length = 0;
        for (let k = 0; k < list.length; k++) {
          const i = list[k];
          const p2 = s[i - W], p3 = s[i - W + 1], p4 = s[i + 1], p5 = s[i + W + 1],
            p6 = s[i + W], p7 = s[i + W - 1], p8 = s[i - 1], p9 = s[i - W - 1];
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;
          const A = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) +
            (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2);
          if (A !== 1) continue;
          if (pass === 0) { if (p2 * p4 * p6 || p4 * p6 * p8) continue; }
          else { if (p2 * p4 * p8 || p2 * p6 * p8) continue; }
          del.push(i);
        }
        if (del.length) {
          changed = true;
          for (const i of del) s[i] = 0;
          list = list.filter(i => s[i]);
        }
      }
    }
    // nettoyage des escaliers : enlève le pixel du coin quand ses deux voisins
    // se touchent déjà en diagonale (squelette strictement 8-connexe, 1 px)
    const Nn = -W, Ee = 1, Ss = W, Ww = -1;
    const pats = [[Nn, Ee, Ss, Ww], [Ee, Ss, Ww, Nn], [Ss, Ww, Nn, Ee], [Ww, Nn, Ee, Ss]];
    for (let pass = 0; pass < 2; pass++) for (const i of list) {
      if (!s[i]) continue;
      for (const [a, b, c, d] of pats) {
        if (s[i + a] && s[i + b] && !s[i + c] && !s[i + d] && !s[i + a + b] && !s[i + c + d]) { s[i] = 0; break; }
      }
    }
    return { s, W, H };
  }

  // Distance au fond (chanfrein 3-4, résultat en pixels)
  function distanceMap(m, w, h) {
    const INF = 1e9, d = new Float32Array(w * h);
    for (let i = 0; i < d.length; i++) d[i] = m[i] ? INF : 0;
    const g = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!d[i]) continue;
      d[i] = Math.min(d[i], g(x - 1, y) + 3, g(x, y - 1) + 3, g(x - 1, y - 1) + 4, g(x + 1, y - 1) + 4);
    }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x; if (!d[i]) continue;
      d[i] = Math.min(d[i], g(x + 1, y) + 3, g(x, y + 1) + 3, g(x + 1, y + 1) + 4, g(x - 1, y + 1) + 4);
    }
    for (let i = 0; i < d.length; i++) d[i] /= 3;
    return d;
  }

  function traceCenterlines(m, w, h, opt) {
    const { s, W } = thin(m, w, h);
    const N8 = [-W, -W + 1, 1, W + 1, W, W - 1, -1, -W - 1];
    const deg = i => { let c = 0; for (const o of N8) c += s[i + o]; return c; };
    const isNode = i => deg(i) !== 2;
    const visited = new Uint8Array(s.length);
    const pairDone = new Set();
    const paths = [];
    const idx = [];
    for (let i = 0; i < s.length; i++) if (s[i]) idx.push(i);

    function walk(start, first) {
      const path = [start, first];
      if (isNode(first)) return path;
      visited[first] = 1;
      let prev = start, cur = first;
      for (;;) {
        let next = -1;
        // voisins 4 d'abord pour ne pas couper les coins
        for (const o of [N8[0], N8[2], N8[4], N8[6], N8[1], N8[3], N8[5], N8[7]]) {
          const j = cur + o;
          if (!s[j] || j === prev) continue;
          if (isNode(j)) { if (j !== start || path.length > 2) { next = j; break; } continue; }
          if (!visited[j]) { next = j; break; }
        }
        if (next < 0) return path;
        path.push(next);
        if (isNode(next)) return path;
        visited[next] = 1; prev = cur; cur = next;
      }
    }

    for (const i of idx) {
      if (!isNode(i) || deg(i) === 0) continue;
      for (const o of N8) {
        const j = i + o;
        if (!s[j]) continue;
        if (isNode(j)) {
          const key = i < j ? i + ',' + j : j + ',' + i;
          if (pairDone.has(key)) continue;
          pairDone.add(key); paths.push({ closed: false, ids: [i, j] }); continue;
        }
        if (visited[j]) continue;
        paths.push({ closed: false, ids: walk(i, j) });
      }
    }
    // boucles fermées sans nœud (ex. un "o")
    for (const i of idx) {
      if (visited[i] || isNode(i)) continue;
      visited[i] = 1;
      const ids = [i];
      let prev = -1, cur = i;
      for (;;) {
        let next = -1;
        for (const o of [N8[0], N8[2], N8[4], N8[6], N8[1], N8[3], N8[5], N8[7]]) {
          const j = cur + o;
          if (s[j] && j !== prev && !visited[j]) { next = j; break; }
        }
        if (next < 0) break;
        visited[next] = 1; ids.push(next); prev = cur; cur = next;
      }
      if (ids.length > 3) paths.push({ closed: true, ids });
    }

    // élagage des petites branches (barbules) qui finissent dans le vide
    const spur = opt.spur || 0;
    const toXY = i => [(i % W) - 1 + 0.5, ((i / W) | 0) - 1 + 0.5];
    const res = [];
    for (const p of paths) {
      let pts = p.ids.map(toXY);
      const L = polyLength(pts, p.closed);
      const endFree = !p.closed && (deg(p.ids[0]) === 1 || deg(p.ids[p.ids.length - 1]) === 1);
      const isolated = !p.closed && deg(p.ids[0]) === 1 && deg(p.ids[p.ids.length - 1]) === 1;
      if (endFree && !isolated && L < spur) continue;
      if (isolated && L < Math.max(2, spur / 2)) continue;
      if (pts.length >= 2) res.push({ closed: p.closed, pts });
    }

    // largeur du trait (pour la profondeur de la fraise V)
    const dm = distanceMap(m, w, h);
    const widths = [];
    for (const i of idx) {
      const x = (i % W) - 1, y = ((i / W) | 0) - 1;
      widths.push(2 * dm[y * w + x]);
    }
    widths.sort((a, b) => a - b);
    const med = widths.length ? widths[widths.length >> 1] : 0;
    const p95 = widths.length ? widths[Math.min(widths.length - 1, Math.floor(widths.length * 0.95))] : 0;
    const joined = joinPaths(res);
    const out = [];
    for (const p of joined) out.push(...refinePath(p.pts, p.closed, opt));
    return { paths: out, strokePx: { median: med, max: p95 } };
  }

  // Relie bout à bout les traits ouverts qui se touchent à deux seulement
  // (moins de levées de fraise). Les extrémités venant du même pixel ont les mêmes coordonnées.
  function joinPaths(paths) {
    const closed = paths.filter(p => p.closed);
    let open = paths.filter(p => !p.closed).map(p => ({ pts: p.pts, alive: true }));
    const key = q => q[0].toFixed(2) + ',' + q[1].toFixed(2);
    let again = true;
    while (again) {
      again = false;
      const ends = new Map();
      open.forEach((p, i) => {
        if (!p.alive) return;
        for (const e of [0, 1]) {
          const k = key(e ? p.pts[p.pts.length - 1] : p.pts[0]);
          if (!ends.has(k)) ends.set(k, []);
          ends.get(k).push([i, e]);
        }
      });
      for (const [, list] of ends) {
        if (list.length !== 2) continue;
        const [[i, ei], [j, ej]] = list;
        const A = open[i], B = open[j];
        if (!A.alive || !B.alive) continue;
        if (i === j) { // les deux bouts du même trait se rejoignent : boucle fermée
          if (A.pts.length > 3) { A.pts.pop(); closed.push({ closed: true, pts: A.pts }); A.alive = false; }
          continue;
        }
        const a = ei ? A.pts : A.pts.slice().reverse();   // A se termine au point commun
        const b = ej ? B.pts.slice().reverse() : B.pts;   // B commence au point commun
        A.pts = a.concat(b.slice(1)); B.alive = false;
        again = true;
        break; // les indices d'extrémités ont changé : on recalcule
      }
      open = open.filter(p => p.alive);
    }
    return closed.concat(open.map(p => ({ closed: false, pts: p.pts })));
  }

  /* ---------- 5. Finition : analyse des courbes (droites + arcs) ---------- */

  // Un chemin = { closed, pts:[[x,y]...], b:[bulge...] } ; b[i] = courbure du segment pts[i] -> pts[i+1]
  // (bulge = tan(angle/4), signe dans le repère courant ; 0 = segment droit)

  function refinePath(pts, closed, opt) {
    if (opt.method === 'free') {
      let p = rdp(pts, opt.tol, closed);
      p = smooth(p, opt.smooth, closed, opt.cornerDeg);
      if (p.length < (closed ? 3 : 2)) return [];
      return [{ closed, pts: p, b: new Array(p.length).fill(0) }];
    }
    const r = fitPrimitives(pts, closed, opt);
    return r ? [r] : [];
  }

  function resample(pts, closed, step) {
    const out = [pts[0].slice()];
    const n = pts.length, segs = closed ? n : n - 1;
    let carry = 0;
    for (let i = 0; i < segs; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let t = step - carry;
      while (t <= L) { out.push([a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L]); t += step; }
      carry = L - (t - step);
    }
    if (!closed) {
      const e = pts[n - 1], l = out[out.length - 1];
      if (Math.hypot(e[0] - l[0], e[1] - l[1]) > step * 0.3) out.push(e.slice()); else out[out.length - 1] = e.slice();
    } else if (out.length > 2) {
      const l = out[out.length - 1];
      if (Math.hypot(l[0] - out[0][0], l[1] - out[0][1]) < step * 0.5) out.pop();
    }
    return out;
  }

  function blur(pts, closed, passes) {
    let p = pts;
    const n = p.length;
    for (let k = 0; k < passes; k++) {
      const q = new Array(n);
      for (let i = 0; i < n; i++) {
        if (!closed && (i === 0 || i === n - 1)) { q[i] = p[i]; continue; }
        const a = p[(i - 1 + n) % n], c = p[(i + 1) % n];
        q[i] = [(a[0] + 2 * p[i][0] + c[0]) / 4, (a[1] + 2 * p[i][1] + c[1]) / 4];
      }
      p = q;
    }
    return p;
  }

  function fitLine(P) {
    const n = P.length;
    let mx = 0, my = 0;
    for (const p of P) { mx += p[0]; my += p[1]; }
    mx /= n; my /= n;
    let sxx = 0, syy = 0, sxy = 0;
    for (const p of P) { const dx = p[0] - mx, dy = p[1] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    let ux = Math.cos(ang), uy = Math.sin(ang);
    // sens = sens de parcours
    if ((P[n - 1][0] - P[0][0]) * ux + (P[n - 1][1] - P[0][1]) * uy < 0) { ux = -ux; uy = -uy; }
    let dev = 0;
    for (const p of P) dev = Math.max(dev, Math.abs(-(p[0] - mx) * uy + (p[1] - my) * ux));
    return { type: 'L', mx, my, ux, uy, dev };
  }

  function fitCircle(P) {
    // Kåsa : x² + y² + D x + E y + F = 0, centré pour la stabilité
    const n = P.length;
    let ox = 0, oy = 0;
    for (const p of P) { ox += p[0]; oy += p[1]; }
    ox /= n; oy /= n;
    let Sxx = 0, Sxy = 0, Syy = 0, Sx = 0, Sy = 0, Sxz = 0, Syz = 0, Sz = 0;
    for (const p of P) {
      const x = p[0] - ox, y = p[1] - oy, z = x * x + y * y;
      Sxx += x * x; Sxy += x * y; Syy += y * y; Sx += x; Sy += y; Sxz += x * z; Syz += y * z; Sz += z;
    }
    // résout [Sxx Sxy Sx; Sxy Syy Sy; Sx Sy n] [D E F]ᵀ = -[Sxz Syz Sz]ᵀ
    const A = [[Sxx, Sxy, Sx, -Sxz], [Sxy, Syy, Sy, -Syz], [Sx, Sy, n, -Sz]];
    for (let c = 0; c < 3; c++) {
      let piv = c;
      for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      if (Math.abs(A[piv][c]) < 1e-12) return null;
      [A[c], A[piv]] = [A[piv], A[c]];
      for (let r = 0; r < 3; r++) if (r !== c) {
        const f = A[r][c] / A[c][c];
        for (let k = c; k < 4; k++) A[r][k] -= f * A[c][k];
      }
    }
    const D = A[0][3] / A[0][0], E = A[1][3] / A[1][1], F = A[2][3] / A[2][2];
    const cx = -D / 2, cy = -E / 2, r2 = cx * cx + cy * cy - F;
    if (!(r2 > 0)) return null;
    const r = Math.sqrt(r2);
    let dev = 0;
    for (const p of P) dev = Math.max(dev, Math.abs(Math.hypot(p[0] - ox - cx, p[1] - oy - cy) - r));
    return { type: 'A', cx: cx + ox, cy: cy + oy, r, dev };
  }

  function chordLen(P) { return Math.hypot(P[P.length - 1][0] - P[0][0], P[P.length - 1][1] - P[0][1]); }

  function fitRun(P, tol, depth) {
    const n = P.length;
    if (n < 3) return [{ ...fitLine(P), P }];
    const L = fitLine(P);
    if (L.dev <= tol) return [{ ...L, P }];
    if (n >= 6) {
      const C = fitCircle(P);
      const span = C ? polyLength(P, false) / C.r : 0;
      if (C && C.dev <= tol && C.r < 4000 && span > 0.12) return [{ ...C, P }];
    }
    if (depth > 40 || n < 6) return [{ ...L, P }];
    // coupe au point le plus éloigné de la corde
    const a = P[0], b = P[n - 1], dx = b[0] - a[0], dy = b[1] - a[1], cl = Math.hypot(dx, dy) || 1;
    let md = -1, mi = n >> 1;
    for (let i = 2; i < n - 2; i++) {
      const d = Math.abs(dx * (P[i][1] - a[1]) - dy * (P[i][0] - a[0])) / cl;
      if (d > md) { md = d; mi = i; }
    }
    return fitRun(P.slice(0, mi + 1), tol, depth + 1).concat(fitRun(P.slice(mi), tol, depth + 1));
  }

  function refit(P, tol) {
    const L = fitLine(P);
    if (L.dev <= tol) return { ...L, P };
    if (P.length >= 6) {
      const C = fitCircle(P);
      if (C && C.dev <= tol && C.r < 4000) return { ...C, P };
    }
    return null;
  }

  function sameKind(a, b) {
    if (a.type !== b.type) return false;
    if (a.type === 'L') {
      const c = Math.abs(a.ux * b.ux + a.uy * b.uy);
      return c > Math.cos(5 * Math.PI / 180);
    }
    return Math.hypot(a.cx - b.cx, a.cy - b.cy) < Math.max(a.r, b.r) * 0.25 && Math.abs(a.r - b.r) < Math.max(a.r, b.r) * 0.2;
  }

  function mergePrims(prims, closed, tol) {
    let changed = true;
    while (changed && prims.length > 1) {
      changed = false;
      const n = prims.length, lim = closed ? n : n - 1;
      for (let i = 0; i < lim; i++) {
        const j = (i + 1) % n;
        if (!sameKind(prims[i], prims[j])) continue;
        const P = prims[i].P.concat(prims[j].P.slice(1));
        const m = refit(P, tol);
        if (!m || m.type !== prims[i].type) continue;
        if (j === 0) { prims[i] = m; prims.shift(); } else prims.splice(i, 2, m);
        changed = true; break;
      }
    }
    return prims;
  }

  function snapLine(L, snapDeg) {
    if (L.type !== 'L' || !snapDeg) return;
    const a = Math.atan2(L.uy, L.ux), q = Math.PI / 4;
    const t = Math.round(a / q) * q;
    if (Math.abs(a - t) <= snapDeg * Math.PI / 180) {
      L.ux = Math.cos(t); L.uy = Math.sin(t);
      if (Math.abs(L.ux) < 1e-12) L.ux = 0; if (Math.abs(L.uy) < 1e-12) L.uy = 0;
    }
  }

  function project(pr, p) {
    if (pr.type === 'L') {
      const t = (p[0] - pr.mx) * pr.ux + (p[1] - pr.my) * pr.uy;
      return [pr.mx + t * pr.ux, pr.my + t * pr.uy];
    }
    const dx = p[0] - pr.cx, dy = p[1] - pr.cy, d = Math.hypot(dx, dy) || 1;
    return [pr.cx + dx / d * pr.r, pr.cy + dy / d * pr.r];
  }

  function intersect(a, b, near) {
    const cands = [];
    if (a.type === 'L' && b.type === 'L') {
      const den = a.ux * b.uy - a.uy * b.ux;
      if (Math.abs(den) < Math.sin(2 * Math.PI / 180)) return null;
      const t = ((b.mx - a.mx) * b.uy - (b.my - a.my) * b.ux) / den;
      return [a.mx + t * a.ux, a.my + t * a.uy];
    }
    if (a.type === 'A' && b.type === 'A') {
      const dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.hypot(dx, dy);
      if (d < 1e-9 || d > a.r + b.r || d < Math.abs(a.r - b.r)) return null;
      const t = (a.r * a.r - b.r * b.r + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a.r * a.r - t * t));
      const mx = a.cx + dx * t / d, my = a.cy + dy * t / d;
      cands.push([mx - dy * h / d, my + dx * h / d], [mx + dy * h / d, my - dx * h / d]);
    } else {
      const L = a.type === 'L' ? a : b, C = a.type === 'L' ? b : a;
      const fx = L.mx - C.cx, fy = L.my - C.cy;
      const B = fx * L.ux + fy * L.uy, Cc = fx * fx + fy * fy - C.r * C.r, disc = B * B - Cc;
      if (disc < 0) return null;
      const s = Math.sqrt(disc);
      for (const t of [-B - s, -B + s]) cands.push([L.mx + t * L.ux, L.my + t * L.uy]);
    }
    let best = null, bd = Infinity;
    for (const c of cands) { const d = Math.hypot(c[0] - near[0], c[1] - near[1]); if (d < bd) { bd = d; best = c; } }
    return best;
  }

  function bulgeFor(pr, S, E, M) {
    if (pr.type !== 'A') return 0;
    const a0 = Math.atan2(S[1] - pr.cy, S[0] - pr.cx), a1 = Math.atan2(E[1] - pr.cy, E[0] - pr.cx);
    const am = Math.atan2(M[1] - pr.cy, M[0] - pr.cx);
    const TAU = 2 * Math.PI, norm = v => ((v % TAU) + TAU) % TAU;
    const dPos = norm(a1 - a0);
    const sweep = norm(am - a0) < dPos ? dPos : dPos - TAU;
    if (Math.abs(sweep) < 0.02) return 0;
    return Math.tan(sweep / 4);
  }

  function fitPrimitives(raw, closed, opt) {
    const tol = Math.max(0.3, opt.tol);
    let P = resample(raw, closed, 1);
    if (P.length < (closed ? 6 : 2)) return null;
    P = blur(P, closed, 2);
    const n = P.length;

    // 1. coins : fort changement de direction (maximum local)
    const k = Math.max(3, Math.round(tol * 2 + 2));
    const turn = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      if (!closed && (i < k || i >= n - k)) continue;
      const a = P[(i - k + n) % n], c = P[(i + k) % n], p = P[i];
      turn[i] = turnAngle(a, p, c);
    }
    const corners = [];
    for (let i = 0; i < n; i++) {
      if (turn[i] < opt.cornerDeg) continue;
      let isMax = true;
      for (let j = -k; j <= k && isMax; j++) {
        if (!j) continue;
        const q = closed ? (i + j + n) % n : i + j;
        if (q < 0 || q >= n) continue;
        if (turn[q] > turn[i] || (turn[q] === turn[i] && j < 0)) isMax = false;
      }
      if (isMax) corners.push(i);
    }

    // 2. tronçons entre les coins
    const runs = [];
    if (closed) {
      const cs = corners.length ? corners : [0, n >> 1];
      if (cs.length === 1) cs.push((cs[0] + (n >> 1)) % n);
      for (let c = 0; c < cs.length; c++) {
        const a = cs[c], b = cs[(c + 1) % cs.length], run = [];
        for (let i = a; ; i = (i + 1) % n) { run.push(P[i]); if (i === b) break; }
        runs.push(run);
      }
    } else {
      const cs = [0, ...corners, n - 1];
      for (let c = 0; c < cs.length - 1; c++) runs.push(P.slice(cs[c], cs[c + 1] + 1));
    }

    // 3. droite ou arc pour chaque tronçon, puis fusion des morceaux semblables
    let prims = [];
    for (const r of runs) if (r.length >= 2) prims.push(...fitRun(r, tol, 0));
    prims = prims.filter(p => p.P && p.P.length >= 2);
    if (!prims.length) return null;
    prims = mergePrims(prims, closed && corners.length === 0 ? true : closed, tol);
    // petit arc coincé entre deux droites = coin arrondi par le flou de l'image -> coin net
    const tiny = opt.sharp === false ? 0 : Math.max(12, tol * 14);
    const arcLen = pr => {
      const S0 = pr.P[0], E0 = pr.P[pr.P.length - 1];
      let d = Math.abs(Math.atan2(E0[1] - pr.cy, E0[0] - pr.cx) - Math.atan2(S0[1] - pr.cy, S0[0] - pr.cx));
      if (d > Math.PI) d = 2 * Math.PI - d;
      return pr.r * d;
    };
    const isSmall = pr => pr.type === 'A' && arcLen(pr) <= tiny;
    // boucle fermée : on commence sur une pièce normale pour ne pas couper une suite d'arcs
    if (tiny && closed) { let r = 0; while (r < prims.length && isSmall(prims[0])) { prims.push(prims.shift()); r++; } }
    for (let i = 0; tiny && prims.length > 2 && i < prims.length; i++) {
      if (!isSmall(prims[i])) continue;
      // suite d'arcs minuscules entre deux droites
      let k = i, tot = 0;
      while (k < prims.length && isSmall(prims[k]) && k - i < 4) { tot += arcLen(prims[k]); k++; }
      const cnt = k - i;
      if (!closed && (i === 0 || k >= prims.length)) { i = k - 1; continue; }
      const a = prims[(i - 1 + prims.length) % prims.length], b = prims[k % prims.length];
      if (a === b || a.type !== 'L' || b.type !== 'L' || prims.length - cnt < 2 ||
        Math.abs(a.ux * b.uy - a.uy * b.ux) < Math.sin(10 * Math.PI / 180)) { i = k - 1; continue; }
      b.extra = (b.extra || 0) + tot * 3 + 6;
      prims.splice(i, cnt); i--;
    }
    if (opt.snap) prims.forEach(pr => snapLine(pr, opt.snapDeg || 3));

    // 4. sommets aux jonctions (intersections nettes)
    // cercle complet : deux demi-cercles (bulge ±1)
    if (closed && prims.length === 1) {
      const pr = prims[0];
      if (pr.type !== 'A') return null;
      const S = project(pr, P[0]), E = [2 * pr.cx - S[0], 2 * pr.cy - S[1]];
      const s = Math.sign(bulgeFor(pr, S, E, P[Math.floor(n / 4)])) || 1;
      return { closed: true, pts: [S, E], b: [s, s] };
    }
    const m = prims.length, J = [];
    const maxMove = tol * 4 + 3;
    for (let i = 0; i < m; i++) {
      const a = prims[i], b = prims[(i + 1) % m];
      if (!closed && i === m - 1) break;
      const orig = a.P[a.P.length - 1];
      let pt = intersect(a, b, orig);
      if (!pt || Math.hypot(pt[0] - orig[0], pt[1] - orig[1]) > maxMove + (b.extra || 0)) {
        const pa = project(a, orig), pb = project(b, orig);
        pt = a.type === 'A' && b.type !== 'A' ? pa : b.type === 'A' && a.type !== 'A' ? pb : [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
      }
      J.push(pt);
    }
    const pts = [], bs = [];
    if (closed) {
      for (let i = 0; i < m; i++) {
        const S = J[(i - 1 + m) % m], E = J[i], pr = prims[i];
        pts.push(S); bs.push(m === 1 ? 0 : bulgeFor(pr, S, E, pr.P[pr.P.length >> 1]));
      }
      if (m === 1) return null;
    } else {
      const first = project(prims[0], prims[0].P[0]);
      const last = project(prims[m - 1], prims[m - 1].P[prims[m - 1].P.length - 1]);
      const V = [first, ...J, last];
      for (let i = 0; i < m; i++) {
        pts.push(V[i]); bs.push(bulgeFor(prims[i], V[i], V[i + 1], prims[i].P[prims[i].P.length >> 1]));
      }
      pts.push(V[m]); bs.push(0);
    }
    // nettoyage : sommets confondus
    const op = [], ob = [];
    for (let i = 0; i < pts.length; i++) {
      const l = op[op.length - 1];
      if (l && Math.hypot(l[0] - pts[i][0], l[1] - pts[i][1]) < 1e-6) { ob[ob.length - 1] = bs[i] || ob[ob.length - 1]; continue; }
      op.push(pts[i]); ob.push(bs[i]);
    }
    if (op.length < (closed ? 2 : 2)) return null;
    if (closed && op.length === 2 && !ob[0] && !ob[1]) return null;
    return { closed, pts: op, b: ob };
  }

  /* ---------- 6. Symétrie (miroir, quadrants, rosaces) sur le masque ---------- */

  // type : 'v' (gauche/droite), 'h' (haut/bas), 'q' (4 quadrants), 'r6' 'r8' 'r12' (rosaces)
  function symParts(type) {
    if (type === 'v' || type === 'h') return 2;
    if (type === 'q') return 4;
    const N = +type.slice(1); return 2 * N;
  }

  // Donne, pour un point (x,y) du repère image, sa position canonique et la fonction qui
  // renvoie l'image de cette position dans la partie j.
  function symMapper(type, cx, cy, rot) {
    if (type === 'v') return {
      part: (x, y) => x < cx ? 0 : 1,
      canon: (x, y) => [Math.abs(x - cx), y],
      img: (c, j) => [cx + (j ? c[0] : -c[0]), c[1]]
    };
    if (type === 'h') return {
      part: (x, y) => y < cy ? 0 : 1,
      canon: (x, y) => [x, Math.abs(y - cy)],
      img: (c, j) => [c[0], cy + (j ? c[1] : -c[1])]
    };
    if (type === 'q') return {
      part: (x, y) => (x < cx ? 0 : 1) + (y < cy ? 0 : 2),
      canon: (x, y) => [Math.abs(x - cx), Math.abs(y - cy)],
      img: (c, j) => [cx + (j & 1 ? c[0] : -c[0]), cy + (j & 2 ? c[1] : -c[1])]
    };
    const N = +type.slice(1), wedge = Math.PI / N, TAU = 2 * Math.PI;
    const rel = (x, y) => (((Math.atan2(y - cy, x - cx) - rot) % TAU) + TAU) % TAU;
    return {
      part: (x, y) => Math.min(2 * N - 1, Math.floor(rel(x, y) / wedge)),
      canon: (x, y) => {
        const a = rel(x, y), j = Math.min(2 * N - 1, Math.floor(a / wedge));
        let w = a - j * wedge; if (j & 1) w = wedge - w;
        return [Math.hypot(x - cx, y - cy), w];
      },
      img: (c, j) => {
        const a = rot + j * wedge + (j & 1 ? wedge - c[1] : c[1]);
        return [cx + c[0] * Math.cos(a), cy + c[0] * Math.sin(a)];
      }
    };
  }

  // Mesure d'asymétrie (plus bas = plus symétrique), sur un masque réduit
  function symScore(m, w, h, type, cx, cy, rot, step) {
    const M = symMapper(type, cx, cy, rot), parts = symParts(type);
    let bad = 0, tot = 0;
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
      const px = x + 0.5, py = y + 0.5, v = m[y * w + x];
      const c = M.canon(px, py), j0 = M.part(px, py);
      // compare avec la partie voisine (miroir) et, pour les rosaces, la rotation
      for (const j of parts > 2 ? [j0 ^ 1, (j0 + 2) % parts] : [j0 ^ 1]) {
        const q = M.img(c, j), qx = Math.floor(q[0]), qy = Math.floor(q[1]);
        if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue;
        tot++; if (m[qy * w + qx] !== v) bad++;
      }
    }
    return tot > 50 ? bad / tot : 1;
  }

  function downsample(m, w, h, maxDim) {
    const k = Math.max(1, Math.ceil(Math.max(w, h) / maxDim));
    const W = Math.ceil(w / k), H = Math.ceil(h / k), o = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0, c = 0;
      for (let yy = y * k; yy < Math.min(h, y * k + k); yy++) for (let xx = x * k; xx < Math.min(w, x * k + k); xx++) { s += m[yy * w + xx]; c++; }
      o[y * W + x] = s * 2 >= c ? 1 : 0;
    }
    return { m: o, w: W, h: H, k };
  }

  // Trouve le centre (et l'angle pour les rosaces) qui rend le dessin le plus symétrique
  function detectSymmetry(m, w, h, type) {
    const d = downsample(m, w, h, 220);
    const best1 = (axis) => {
      let bv = Infinity, bc = 0;
      const L = axis === 'v' ? d.w : d.h;
      for (let c = L * 0.25; c <= L * 0.75; c += 0.5) {
        const s = symScore(d.m, d.w, d.h, axis, axis === 'v' ? c : 0, axis === 'h' ? c : 0, 0, 2);
        if (s < bv) { bv = s; bc = c; }
      }
      return bc;
    };
    let cx = d.w / 2, cy = d.h / 2, rot = 0;
    if (type === 'v' || type === 'q' || type[0] === 'r') cx = best1('v');
    if (type === 'h' || type === 'q' || type[0] === 'r') cy = best1('h');
    if (type[0] === 'r') {
      const N = +type.slice(1);
      let bv = Infinity;
      for (let a = 0; a < 180 / N; a += 0.5) {
        const s = symScore(d.m, d.w, d.h, type, cx, cy, a * Math.PI / 180, 2);
        if (s < bv) { bv = s; rot = a; }
      }
      rot = rot * Math.PI / 180;
    }
    const score = symScore(d.m, d.w, d.h, type, cx, cy, rot, 1);
    return { cx: cx * d.k, cy: cy * d.k, rot, score };
  }

  // Construit le masque symétrique. source : numéro de partie, 'auto' (la plus propre) ou 'vote'
  function applySymmetry(m, w, h, sym) {
    const { type, cx, cy, rot } = sym;
    const M = symMapper(type, cx, cy, rot || 0), parts = symParts(type);
    const out = new Uint8Array(w * h);
    const sample = q => {
      const qx = Math.floor(q[0]), qy = Math.floor(q[1]);
      return (qx < 0 || qy < 0 || qx >= w || qy >= h) ? -1 : m[qy * w + qx];
    };
    // désaccord de chaque partie avec le vote général
    const dis = new Float64Array(parts), cnt = new Float64Array(parts);
    const vals = new Int8Array(parts);
    for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x += 3) {
      const c = M.canon(x + 0.5, y + 0.5);
      let s = 0, n = 0;
      for (let j = 0; j < parts; j++) { vals[j] = sample(M.img(c, j)); if (vals[j] >= 0) { s += vals[j]; n++; } }
      if (n < 2) continue;
      const maj = s * 2 > n ? 1 : 0;
      for (let j = 0; j < parts; j++) if (vals[j] >= 0) { cnt[j]++; if (vals[j] !== maj) dis[j]++; }
    }
    const quality = [];
    let best = 0, bestScore = Infinity;
    // une partie coupée par le bord de l'image est pénalisée
    let maxCnt = 0; for (let j = 0; j < parts; j++) maxCnt = Math.max(maxCnt, cnt[j]);
    for (let j = 0; j < parts; j++) {
      const cover = maxCnt ? cnt[j] / maxCnt : 0;
      const sc = (cnt[j] ? dis[j] / cnt[j] : 1) + (1 - cover) * 0.5;
      quality.push({ part: j, disagree: cnt[j] ? dis[j] / cnt[j] : 1, cover, score: sc });
      if (sc < bestScore) { bestScore = sc; best = j; }
    }
    const src = sym.source === 'auto' ? best : sym.source;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = M.canon(x + 0.5, y + 0.5);
      let v;
      if (src === 'vote') {
        let s = 0, n = 0;
        for (let j = 0; j < parts; j++) { const t = sample(M.img(c, j)); if (t >= 0) { s += t; n++; } }
        v = n ? (s * 2 > n ? 1 : s * 2 === n ? Math.max(0, sample(M.img(c, best))) : 0) : 0;
      } else v = Math.max(0, sample(M.img(c, src)));
      out[y * w + x] = v;
    }
    return { mask: out, best, quality };
  }

  /* ---------- 7. Géométrie des arcs, mise à l'échelle et export ---------- */

  function arcParams(S, E, b) {
    const sweep = 4 * Math.atan(b);
    const dx = E[0] - S[0], dy = E[1] - S[1], c = Math.hypot(dx, dy);
    const r = c / (2 * Math.abs(Math.sin(sweep / 2)));
    // centre : à gauche de la corde pour un angle positif (repère courant)
    const mx = (S[0] + E[0]) / 2, my = (S[1] + E[1]) / 2;
    const hgt = (c / 2) / Math.tan(sweep / 2);
    const cx = mx - dy / c * hgt, cy = my + dx / c * hgt;
    return { cx, cy, r, a0: Math.atan2(S[1] - cy, S[0] - cx), sweep };
  }

  // Points le long d'un chemin (arcs découpés) — pour l'aperçu et les dimensions
  function flatten(p, maxSeg) {
    const out = [], n = p.pts.length, segs = p.closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const S = p.pts[i], E = p.pts[(i + 1) % n], b = p.b ? p.b[i] : 0;
      out.push(S);
      if (b) {
        const A = arcParams(S, E, b);
        const k = Math.max(2, Math.ceil(Math.abs(A.sweep) * A.r / (maxSeg || 2)));
        for (let t = 1; t < k; t++) {
          const a = A.a0 + A.sweep * t / k;
          out.push([A.cx + A.r * Math.cos(a), A.cy + A.r * Math.sin(a)]);
        }
      }
    }
    if (!p.closed) out.push(p.pts[n - 1]);
    return out;
  }

  function bbox(paths) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of paths) for (const q of (p.b && p.b.some(v => v) ? flatten(p, 1) : p.pts)) {
      if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0];
      if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
    }
    if (!isFinite(x0)) return { x0: 0, y0: 0, w: 0, h: 0 };
    return { x0, y0, w: x1 - x0, h: y1 - y0 };
  }

  function bulges(p) { return p.b ? p.b.slice() : new Array(p.pts.length).fill(0); }

  // paths (y vers le bas) -> mm, y vers le haut, origine (0,0), grand côté sur Y en option.
  // Le retournement de Y inverse le sens des arcs ; la rotation de 90° le garde.
  function toMachine(paths, widthMm, longOnY) {
    const b = bbox(paths);
    const k = b.w > 0 ? widthMm / b.w : 1;
    let W = b.w * k, H = b.h * k;
    let out = paths.map(p => ({
      closed: p.closed,
      pts: p.pts.map(q => [(q[0] - b.x0) * k, H - (q[1] - b.y0) * k]),
      b: bulges(p).map(v => -v)
    }));
    let rotated = false;
    if (longOnY && W > H) {
      out = out.map(p => ({ closed: p.closed, pts: p.pts.map(q => [H - q[1], q[0]]), b: p.b }));
      const t = W; W = H; H = t; rotated = true;
    }
    return { paths: out, w: W, h: H, rotated };
  }

  function f(n) { return (Math.round(n * 1000) / 1000).toFixed(3); }

  // DXF R12 (AC1009) en LINE + ARC — ArtCAM 2008 et Aspire
  function toDXF(mach, layer) {
    layer = (layer || 'VECTEURS').toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
    const L = [];
    const g = (c, v) => { L.push(String(c), String(v)); };
    g(0, 'SECTION'); g(2, 'HEADER');
    g(9, '$ACADVER'); g(1, 'AC1009');
    g(9, '$INSBASE'); g(10, '0.0'); g(20, '0.0'); g(30, '0.0');
    g(9, '$EXTMIN'); g(10, '0.0'); g(20, '0.0'); g(30, '0.0');
    g(9, '$EXTMAX'); g(10, f(mach.w)); g(20, f(mach.h)); g(30, '0.0');
    g(9, '$LIMMIN'); g(10, '0.0'); g(20, '0.0');
    g(9, '$LIMMAX'); g(10, f(mach.w)); g(20, f(mach.h));
    g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'TABLES');
    g(0, 'TABLE'); g(2, 'LTYPE'); g(70, 1);
    g(0, 'LTYPE'); g(2, 'CONTINUOUS'); g(70, 0); g(3, 'Solid line'); g(72, 65); g(73, 0); g(40, '0.0');
    g(0, 'ENDTAB');
    g(0, 'TABLE'); g(2, 'LAYER'); g(70, 2);
    g(0, 'LAYER'); g(2, '0'); g(70, 0); g(62, 7); g(6, 'CONTINUOUS');
    g(0, 'LAYER'); g(2, layer); g(70, 0); g(62, 7); g(6, 'CONTINUOUS');
    g(0, 'ENDTAB');
    g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'ENTITIES');
    // ArtCAM 2008 lit mal les POLYLINE denses : on écrit des LINE et des ARC simples
    const deg = r => r * 180 / Math.PI;
    for (const p of mach.paths) {
      const n = p.pts.length, segs = p.closed ? n : n - 1;
      for (let i = 0; i < segs; i++) {
        const S = p.pts[i], E = p.pts[(i + 1) % n], bv = p.b ? p.b[i] : 0;
        if (Math.hypot(E[0] - S[0], E[1] - S[1]) < 1e-6) continue;
        if (!bv) {
          g(0, 'LINE'); g(8, layer); g(10, f(S[0])); g(20, f(S[1])); g(30, '0.0'); g(11, f(E[0])); g(21, f(E[1])); g(31, '0.0');
        } else {
          const A = arcParams(S, E, bv);
          const aS = deg(Math.atan2(S[1] - A.cy, S[0] - A.cx)), aE = deg(Math.atan2(E[1] - A.cy, E[0] - A.cx));
          const [a0, a1] = bv > 0 ? [aS, aE] : [aE, aS]; // ARC DXF : sens anti-horaire
          g(0, 'ARC'); g(8, layer); g(10, f(A.cx)); g(20, f(A.cy)); g(30, '0.0'); g(40, f(A.r));
          g(50, (Math.round(((a0 % 360) + 360) % 360 * 1e4) / 1e4).toFixed(4));
          g(51, (Math.round(((a1 % 360) + 360) % 360 * 1e4) / 1e4).toFixed(4));
        }
      }
    }
    g(0, 'ENDSEC'); g(0, 'EOF');
    return L.join('\r\n') + '\r\n';
  }

  // Chemin SVG (repère y vers le bas) avec de vrais arcs
  function pathD(p, prec) {
    const r = v => (Math.round(v * prec) / prec);
    const n = p.pts.length, segs = p.closed ? n : n - 1;
    let d = 'M' + r(p.pts[0][0]) + ' ' + r(p.pts[0][1]);
    for (let i = 0; i < segs; i++) {
      const E = p.pts[(i + 1) % n], b = p.b ? p.b[i] : 0;
      if (!b) { if (!(p.closed && i === segs - 1)) d += 'L' + r(E[0]) + ' ' + r(E[1]); continue; }
      const A = arcParams(p.pts[i], E, b);
      d += 'A' + r(A.r) + ' ' + r(A.r) + ' 0 ' + (Math.abs(A.sweep) > Math.PI ? 1 : 0) + ' ' + (A.sweep > 0 ? 1 : 0) + ' ' + r(E[0]) + ' ' + r(E[1]);
    }
    return p.closed ? d + 'Z' : d;
  }

  // SVG en millimètres (pour Aspire / Inkscape / vente)
  function toSVG(mach, mode) {
    const W = mach.w, H = mach.h;
    const fill = mode === 'contour';
    let d = '';
    for (const p of mach.paths) if (p.pts.length > 1) {
      d += pathD({ closed: p.closed, pts: p.pts.map(q => [q[0], H - q[1]]), b: (p.b || []).map(v => -v) }, 1000);
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + f(W) + 'mm" height="' + f(H) + 'mm" viewBox="0 0 ' + f(W) + ' ' + f(H) + '">\n' +
      '<path d="' + d + '" fill="' + (fill ? '#000' : 'none') + '" fill-rule="evenodd" stroke="#000" stroke-width="' + (fill ? 0 : Math.max(W, H) / 400).toFixed(3) + '" stroke-linecap="round" stroke-linejoin="round"/>\n</svg>\n';
  }

  // EPS (PostScript encapsulé) en millimètres : s'ouvre dans Illustrator, CorelDRAW, Inkscape
  function toEPS(mach, mode) {
    const k = 72 / 25.4, W = mach.w, H = mach.h;
    const n4 = v => (Math.round(v * 10000) / 10000).toString();
    const L = [];
    L.push('%!PS-Adobe-3.0 EPSF-3.0');
    L.push('%%BoundingBox: 0 0 ' + Math.ceil(W * k) + ' ' + Math.ceil(H * k));
    L.push('%%HiResBoundingBox: 0 0 ' + n4(W * k) + ' ' + n4(H * k));
    L.push('%%Creator: Zwaq Deco Vectorizer');
    L.push('%%Title: ' + Math.round(W) + 'x' + Math.round(H) + ' mm');
    L.push('%%Pages: 1');
    L.push('%%EndComments');
    L.push('%%Page: 1 1');
    L.push('gsave');
    L.push(n4(k) + ' ' + n4(k) + ' scale');
    L.push('1 setlinejoin 1 setlinecap');
    L.push('newpath');
    for (const p of mach.paths) {
      const n = p.pts.length; if (n < 2) continue;
      const segs = p.closed ? n : n - 1;
      L.push(n4(p.pts[0][0]) + ' ' + n4(p.pts[0][1]) + ' moveto');
      for (let i = 0; i < segs; i++) {
        const S = p.pts[i], E = p.pts[(i + 1) % n], bv = p.b ? p.b[i] : 0;
        if (!bv) { L.push(n4(E[0]) + ' ' + n4(E[1]) + ' lineto'); continue; }
        const A = arcParams(S, E, bv), d = r => r * 180 / Math.PI;
        const a0 = d(Math.atan2(S[1] - A.cy, S[0] - A.cx)), a1 = d(Math.atan2(E[1] - A.cy, E[0] - A.cx));
        // repère y vers le haut : bulge positif = sens anti-horaire = arc ; négatif = arcn
        L.push(n4(A.cx) + ' ' + n4(A.cy) + ' ' + n4(A.r) + ' ' + n4(a0) + ' ' + n4(a1) + (bv > 0 ? ' arc' : ' arcn'));
      }
      if (p.closed) L.push('closepath');
    }
    if (mode === 'contour') L.push('0 setgray eofill');
    else L.push(n4(Math.max(W, H) / 400) + ' setlinewidth 0 setgray stroke');
    L.push('grestore');
    L.push('showpage');
    L.push('%%Trailer');
    L.push('%%EOF');
    return L.join('\n') + '\n';
  }

  // Géométrie compacte pour la bibliothèque (mm, y vers le bas, non tournée)
  function packGeometry(paths, widthMm) {
    const b = bbox(paths);
    const k = b.w > 0 ? widthMm / b.w : 1;
    return {
      v: 2,
      w: +(b.w * k).toFixed(2), h: +(b.h * k).toFixed(2),
      p: paths.map(p => {
        const o = { c: p.closed ? 1 : 0, d: p.pts.flatMap(q => [+((q[0] - b.x0) * k).toFixed(3), +((q[1] - b.y0) * k).toFixed(3)]) };
        if (p.b && p.b.some(v => v)) o.b = p.b.map(v => +v.toFixed(6));
        return o;
      })
    };
  }
  function unpackGeometry(g) {
    return g.p.map(p => {
      const pts = [];
      for (let i = 0; i < p.d.length; i += 2) pts.push([p.d[i], p.d[i + 1]]);
      return { closed: !!p.c, pts, b: p.b ? p.b.slice() : new Array(pts.length).fill(0) };
    });
  }

  const api = {
    toGray, otsu, threshold, removeSmall, traceOutlines, traceCenterlines,
    rdp, smooth, bbox, toMachine, toDXF, toSVG, toEPS, packGeometry, unpackGeometry, polyLength,
    detectSymmetry, applySymmetry, symParts, symMapper, arcParams, flatten, refinePath
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BESVec = api;
})(typeof window !== 'undefined' ? window : globalThis);
