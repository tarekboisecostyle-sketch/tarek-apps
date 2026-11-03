// @ts-nocheck
// Export DXF R12 (LINE + ARC) et SVG — copie du moteur BES Vectorizer, exécutée côté serveur
function polyLength(p, closed) {
    let L = 0;
    for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (closed && p.length > 1) L += Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]);
    return L;
}
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

  // Géométrie compacte pour la bibliothèque (mm, y vers le bas, non tournée)
function unpackGeometry(g) {
    return g.p.map(p => {
      const pts = [];
      for (let i = 0; i < p.d.length; i += 2) pts.push([p.d[i], p.d[i + 1]]);
      return { closed: !!p.c, pts, b: p.b ? p.b.slice() : new Array(pts.length).fill(0) };
    });
}

export { toMachine, toDXF, toSVG, unpackGeometry, bbox };
