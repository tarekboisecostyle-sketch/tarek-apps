// @ts-nocheck
// Zwaq Deco Vectorizer — activation du plan Pro avec une licence d'abonnement Gumroad
import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifierGumroad } from './gumroad.js';
import { cors, json } from './cors.js';

const URL = Deno.env.get('SUPABASE_URL');
const ANON = Deno.env.get('SUPABASE_ANON_KEY');
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const userClient = createClient(URL, ANON, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'NON_CONNECTE', message: 'Connecte-toi d\'abord.' }, 401);
  const admin = createClient(URL, SERVICE);

  let body = {};
  try { body = await req.json(); } catch { /* vide */ }
  const licence = String(body.licence || '').trim();
  if (!/^[A-Za-z0-9-]{8,80}$/.test(licence)) return json({ error: 'FORMAT', message: 'Clé de licence invalide.' }, 400);

  const { data: cfg } = await admin.from('zv_config').select('valeur').eq('cle', 'gumroad_product_id').maybeSingle();
  if (!cfg || !cfg.valeur) return json({ error: 'PAS_CONFIGURE', message: 'L\'abonnement n\'est pas encore ouvert. Réessaie bientôt.' }, 503);

  const { data: autre } = await admin.from('zv_comptes').select('user_id').eq('licence', licence).neq('user_id', user.id).maybeSingle();
  if (autre) return json({ error: 'DEJA_UTILISEE', message: 'Cette licence est déjà utilisée par un autre compte.' }, 409);

  const v = await verifierGumroad(cfg.valeur, licence);
  if (v.ok === null) return json({ error: 'GUMROAD', message: 'Gumroad ne répond pas, réessaie dans un moment.' }, 503);
  if (!v.ok) return json({ error: 'REFUSEE', message: v.raison }, 402);

  await admin.from('zv_comptes').upsert({ user_id: user.id, email: user.email, plan: 'pro', licence, licence_verifiee_at: new Date().toISOString() });
  return json({ ok: true, plan: 'pro' });
});
