// Vérification d'une licence d'abonnement Gumroad
export async function verifierGumroad(productId, licence) {
  try {
    const r = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      body: new URLSearchParams({ product_id: productId, license_key: licence, increment_uses_count: 'false' })
    });
    const j = await r.json().catch(() => ({}));
    if (r.status >= 500) return { ok: null, raison: 'Gumroad ne répond pas' };
    if (!j.success) return { ok: false, raison: j.message || 'Licence introuvable' };
    const p = j.purchase || {};
    if (p.refunded || p.chargebacked || p.disputed) return { ok: false, raison: 'Achat remboursé ou contesté' };
    if (p.subscription_ended_at || p.subscription_failed_at) return { ok: false, raison: 'Abonnement terminé ou paiement échoué' };
    return { ok: true, email: p.email || null };
  } catch (_e) {
    return { ok: null, raison: 'Gumroad injoignable' };
  }
}
