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
      let p = dedupe(pts, true);
      p = rdp(p, opt.tol, true);
      p = smooth(p, opt.smooth, true, opt.cornerDeg);
      if (p.length >= 3) res.push({ closed: true, pts: p });
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
      pts = rdp(pts, opt.tol, p.closed);
      pts = smooth(pts, opt.smooth, p.closed, opt.cornerDeg);
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
    return { paths: joinPaths(res), strokePx: { median: med, max: p95 } };
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

  /* ---------- 5. Mise à l'échelle et export ---------- */

  function bbox(paths) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of paths) for (const q of p.pts) {
      if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0];
      if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
    }
    if (!isFinite(x0)) return { x0: 0, y0: 0, w: 0, h: 0 };
    return { x0, y0, w: x1 - x0, h: y1 - y0 };
  }

  // paths (y vers le bas, unités quelconques) -> mm, y vers le haut, origine (0,0),
  // option : grand côté sur l'axe Y.
  function toMachine(paths, widthMm, longOnY) {
    const b = bbox(paths);
    const k = b.w > 0 ? widthMm / b.w : 1;
    let W = b.w * k, H = b.h * k;
    let out = paths.map(p => ({
      closed: p.closed,
      pts: p.pts.map(q => [(q[0] - b.x0) * k, H - (q[1] - b.y0) * k])
    }));
    let rotated = false;
    if (longOnY && W > H) {
      // rotation 90° sens anti-horaire puis recalage : (x,y) -> (H - y, x)
      out = out.map(p => ({ closed: p.closed, pts: p.pts.map(q => [H - q[1], q[0]]) }));
      const t = W; W = H; H = t; rotated = true;
    }
    return { paths: out, w: W, h: H, rotated };
  }

  function f(n) { return (Math.round(n * 1000) / 1000).toFixed(3); }

  // DXF R12 (AC1009) : POLYLINE/VERTEX/SEQEND — s'ouvre dans ArtCAM 2008 et Aspire
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
    for (const p of mach.paths) {
      if (p.pts.length < 2) continue;
      g(0, 'POLYLINE'); g(8, layer); g(66, 1); g(10, '0.0'); g(20, '0.0'); g(30, '0.0'); g(70, p.closed ? 1 : 0);
      for (const q of p.pts) { g(0, 'VERTEX'); g(8, layer); g(10, f(q[0])); g(20, f(q[1])); g(30, '0.0'); }
      g(0, 'SEQEND'); g(8, layer);
    }
    g(0, 'ENDSEC'); g(0, 'EOF');
    return L.join('\r\n') + '\r\n';
  }

  function pathD(pts, closed, H, prec) {
    const r = v => (Math.round(v * prec) / prec);
    let d = 'M' + r(pts[0][0]) + ' ' + r(H - pts[0][1]);
    for (let i = 1; i < pts.length; i++) d += 'L' + r(pts[i][0]) + ' ' + r(H - pts[i][1]);
    return closed ? d + 'Z' : d;
  }

  // SVG en millimètres (pour Aspire / Inkscape / vente)
  function toSVG(mach, mode) {
    const W = mach.w, H = mach.h;
    const fill = mode === 'contour';
    let d = '';
    for (const p of mach.paths) if (p.pts.length > 1) d += pathD(p.pts, p.closed, H, 1000);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + f(W) + 'mm" height="' + f(H) + 'mm" viewBox="0 0 ' + f(W) + ' ' + f(H) + '">\n' +
      '<path d="' + d + '" fill="' + (fill ? '#000' : 'none') + '" fill-rule="evenodd" stroke="#000" stroke-width="' + (fill ? 0 : Math.max(W, H) / 400).toFixed(3) + '" stroke-linecap="round" stroke-linejoin="round"/>\n</svg>\n';
  }

  // Géométrie compacte pour la bibliothèque (mm, y vers le bas, non tournée)
  function packGeometry(paths, widthMm) {
    const b = bbox(paths);
    const k = b.w > 0 ? widthMm / b.w : 1;
    return {
      v: 1,
      w: +(b.w * k).toFixed(2), h: +(b.h * k).toFixed(2),
      p: paths.map(p => ({
        c: p.closed ? 1 : 0,
        d: p.pts.flatMap(q => [+((q[0] - b.x0) * k).toFixed(2), +((q[1] - b.y0) * k).toFixed(2)])
      }))
    };
  }
  function unpackGeometry(g) {
    return g.p.map(p => {
      const pts = [];
      for (let i = 0; i < p.d.length; i += 2) pts.push([p.d[i], p.d[i + 1]]);
      return { closed: !!p.c, pts };
    });
  }

  const api = {
    toGray, otsu, threshold, removeSmall, traceOutlines, traceCenterlines,
    rdp, smooth, bbox, toMachine, toDXF, toSVG, packGeometry, unpackGeometry, polyLength
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BESVec = api;
})(typeof window !== 'undefined' ? window : globalThis);
