/* Récupération de mot de passe — commune à toutes les apps (Supabase).
   Utilisation : MdpRecovery.watch(clientSupabase)  → quand l'utilisateur arrive par le lien
   « Mot de passe oublié » reçu par email, un écran lui demande de choisir un nouveau mot de passe.
   MdpRecovery.send(client, email) → envoie l'email de réinitialisation (renvoie un message texte). */
(function () {
  'use strict';
  // Le lien de l'email arrive avec #...type=recovery : on le note avant que supabase-js nettoie l'adresse.
  var fromLink = /type=recovery/.test(location.hash) || /type=recovery/.test(location.search);
  var shown = false;

  function show(client) {
    if (shown) return; shown = true;
    var o = document.createElement('div');
    o.setAttribute('style', 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;font:16px/1.4 system-ui,sans-serif');
    o.innerHTML =
      '<form style="background:#fff;color:#1d2621;border-radius:12px;padding:24px;width:100%;max-width:360px;display:grid;gap:10px;box-shadow:0 12px 40px rgba(0,0,0,.35)">' +
      '<h2 style="margin:0;font-size:20px">Nouveau mot de passe</h2>' +
      '<p style="margin:0;font-size:14px;color:#555">Choisis ton nouveau mot de passe (8 caractères minimum).</p>' +
      '<input id="mr-p1" type="password" autocomplete="new-password" minlength="8" required placeholder="Nouveau mot de passe" style="font:inherit;padding:10px 12px;border:1.5px solid #ccd;border-radius:8px">' +
      '<input id="mr-p2" type="password" autocomplete="new-password" minlength="8" required placeholder="Confirmer" style="font:inherit;padding:10px 12px;border:1.5px solid #ccd;border-radius:8px">' +
      '<div id="mr-m" role="status" style="font-size:13px;min-height:18px;color:#b42318"></div>' +
      '<button id="mr-b" style="font:inherit;font-weight:700;padding:11px;border:0;border-radius:8px;background:#1f6f5c;color:#fff;cursor:pointer">Enregistrer</button>' +
      '</form>';
    document.body.appendChild(o);
    var $ = function (id) { return o.querySelector('#' + id); };
    $('mr-p1').focus();
    o.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var a = $('mr-p1').value, b = $('mr-p2').value;
      if (a.length < 8) { $('mr-m').textContent = '8 caractères minimum.'; return; }
      if (a !== b) { $('mr-m').textContent = 'Les deux mots de passe sont différents.'; return; }
      $('mr-b').disabled = true; $('mr-m').textContent = '';
      client.auth.updateUser({ password: a }).then(function (r) {
        if (r.error) { $('mr-b').disabled = false; $('mr-m').textContent = r.error.message; return; }
        $('mr-m').style.color = '#1f6f5c'; $('mr-m').textContent = 'Mot de passe changé ✅';
        try { history.replaceState(null, '', location.pathname); } catch (e) {}
        setTimeout(function () { location.reload(); }, 900);
      });
    });
  }

  window.MdpRecovery = {
    watch: function (client) {
      if (!client || !client.auth) return;
      var go = function () { if (document.body) show(client); else document.addEventListener('DOMContentLoaded', function () { show(client); }); };
      client.auth.onAuthStateChange(function (ev) { if (ev === 'PASSWORD_RECOVERY') setTimeout(go, 0); });
      if (fromLink) client.auth.getSession().then(function (r) { if (r && r.data && r.data.session) go(); });
    },
    send: function (client, email) {
      email = (email || '').trim();
      if (!email) return Promise.resolve('Écris ton email puis clique sur « Mot de passe oublié ».');
      return client.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0].split('?')[0] })
        .then(function (r) { return r.error ? r.error.message : 'Email envoyé à ' + email + ' : ouvre le lien pour choisir un nouveau mot de passe.'; });
    }
  };
})();
