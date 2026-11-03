// @ts-nocheck
// Zwaq Deco Vectorizer — export DXF R12 / SVG côté serveur, avec quota du plan gratuit
import { createClient } from 'npm:@supabase/supabase-js@2';
import { toMachine, toDXF, toSVG, unpackGeometry } from './export.js';
import { verifierGumroad } from './gumroad.js';
import { cors, json } from './cors.js';

const URL = Deno.env.get('SUPABASE_URL');
const ANON = Deno.env.get('SUPABASE_ANON_KEY');
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

function valide(it) {
  const g = it && it.geometrie;
  if (!g || !Array.isArray(g.p) || g.p.length === 0 || g.p.length > 30000) return 'Géométrie vide ou trop grande';
  const L = +it.largeur_mm;
  if (!(L >= 1 && L <= 10000)) return 'Largeur hors limites (1 à 10 000 mm)';
  for (const p of g.p) if (!Array.isArray(p.d) || p.d.length < 4 || p.d.length > 200000) return 'Chemin invalide';
  return null;
}

function fabriquer(it, format) {
  const mach = toMachine(unpackGeometry(it.geometrie), +it.largeur_mm, it.longY !== false);
  const fichier = format === 'svg' ? toSVG(mach, it.mode) : toDXF(mach, it.mode === 'vcarve' ? 'VCARVE' : 'CONTOUR');
  return { fichier, w: mach.w, h: mach.h, nom: it.nom || 'motif', mode: it.mode };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'METHODE' }, 405);

  const userClient = createClient(URL, ANON, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'NON_CONNECTE', message: 'Connecte-toi pour exporter.' }, 401);
  const admin = createClient(URL, SERVICE);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'JSON' }, 400); }
  const format = body.format === 'svg' ? 'svg' : 'dxf';
  const items = Array.isArray(body.items) ? body.items : [body];
  if (items.length > 100) return json({ error: 'TROP', message: '100 motifs maximum par pack.' }, 400);
  for (const it of items) { const e = valide(it); if (e) return json({ error: 'INVALIDE', message: e }, 400); }

  const { data: cfgRows } = await admin.from('zv_config').select('cle,valeur');
  const cfg = Object.fromEntries((cfgRows || []).map(r => [r.cle, r.valeur]));
  const quota = +(cfg.quota_gratuit || 3);

  let { data: compte } = await admin.from('zv_comptes').select('*').eq('user_id', user.id).maybeSingle();
  if (!compte) {
    await admin.from('zv_comptes').insert({ user_id: user.id, email: user.email });
    compte = { plan: 'gratuit' };
  }
  let pro = compte.plan === 'pro';

  // re-vérifie l'abonnement Gumroad de temps en temps
  if (pro && compte.licence && cfg.gumroad_product_id) {
    const age = (Date.now() - new Date(compte.licence_verifiee_at || 0).getTime()) / 3.6e6;
    if (age > +(cfg.reverif_heures || 24)) {
      const v = await verifierGumroad(cfg.gumroad_product_id, compte.licence);
      if (v.ok === true) await admin.from('zv_comptes').update({ licence_verifiee_at: new Date().toISOString() }).eq('user_id', user.id);
      else if (v.ok === false) { await admin.from('zv_comptes').update({ plan: 'gratuit' }).eq('user_id', user.id); pro = false; }
    }
  }

  if (items.length > 1 && !pro) return json({ error: 'PRO', message: 'Le pack ZIP est réservé au plan Pro.' }, 402);

  let restants = null;
  if (!pro) {
    const debut = new Date(); debut.setUTCDate(1); debut.setUTCHours(0, 0, 0, 0);
    const { count } = await admin.from('zv_exports').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', debut.toISOString());
    if ((count || 0) >= quota) return json({ error: 'QUOTA', quota, utilises: count,
      message: `Tu as utilisé tes ${quota} exports gratuits de ce mois. Passe au plan Pro pour des exports illimités.` }, 402);
    restants = quota - (count || 0) - 1;
  }

  const sorties = [];
  for (const it of items) {
    try { sorties.push(fabriquer(it, format)); }
    catch (e) { return json({ error: 'GENERATION', message: 'Erreur pendant la création du fichier.' }, 500); }
  }
  await admin.from('zv_exports').insert(sorties.map(s => ({
    user_id: user.id, format, mode: s.mode, largeur_mm: +s.w.toFixed(2), hauteur_mm: +s.h.toFixed(2)
  })));
  return json({ fichiers: sorties, plan: pro ? 'pro' : 'gratuit', restants });
});
