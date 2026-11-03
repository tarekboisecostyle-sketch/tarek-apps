/* BES — connexion commune à toutes les applications BES (un seul compte, liste d'accès dans Supabase).
   À charger en PREMIER dans <head>. Sans session, la page s'arrête et affiche la connexion :
   l'application ne démarre jamais sans compte, donc rien ne peut être lu vide ni écrasé. */
(function () {
  'use strict';
  var REF = 'ypvjnermbksjxlebeoyr';
  var URL = 'https://' + REF + '.supabase.co';
  var KEY = 'sb_publishable_IlWas1CWdwQLHNj1NTLSUw_D97PW-wL';
  var SK = 'sb-' + REF + '-auth-token'; // même clé que supabase-js : la session sert à toutes les apps
  var LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';

  function stored() {
    try { var s = JSON.parse(localStorage.getItem(SK) || 'null'); return s && s.refresh_token ? s : null; }
    catch (e) { return null; }
  }
  var client = null;
  function lib() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = LIB; s.onload = res;
      s.onerror = function () { rej(new Error('Connexion Internet impossible')); };
      document.head.appendChild(s);
    });
  }
  function getClient() {
    return lib().then(function () { if (!client) client = window.supabase.createClient(URL, KEY); return client; });
  }

  window.BESAuth = {
    // jeton à mettre dans "Authorization: Bearer ..." pour les appels directs à Supabase
    token: function () {
      return getClient().then(function (c) { return c.auth.getSession(); })
        .then(function (r) { return r.data.session ? r.data.session.access_token : KEY; })
        .catch(function () { var s = stored(); return s ? s.access_token : KEY; });
    },
    logout: function () {
      return getClient().then(function (c) { return c.auth.signOut(); })
        .catch(function () {}).then(function () { try { localStorage.removeItem(SK); } catch (e) {} location.reload(); });
    }
  };

  if (stored()) {
    // session présente : on vérifie en arrière-plan qu'elle est toujours valable
    window.addEventListener('load', function () {
      if (!navigator.onLine) return;
      getClient().then(function (c) { return c.auth.getUser(); }).then(function (r) {
        if (r.error && /session|jwt|token|not found/i.test(r.error.message || '')) {
          try { localStorage.removeItem(SK); } catch (e) {}
          location.reload();
        }
      }).catch(function () {});
      addChip();
    });
    return;
  }

  // ---- pas de session : on arrête l'application et on affiche la connexion ----
  try { window.stop(); } catch (e) {}
  var NOMS = { 'bes-facturepro': 'FacturePro', 'bes-caisse': 'Caisse', 'releve': 'Relevé de chantier', 'zwaq': 'Zwaq Deco', 'bes-fiches-atelier': 'Fiches atelier', 'bes-vectorizer': 'BES Vectorizer' };
  var parts = location.pathname.split('/').filter(Boolean), titre = 'BES';
  for (var i = parts.length - 1; i >= 0; i--) if (NOMS[parts[i]]) { titre = NOMS[parts[i]]; break; }
  document.documentElement.innerHTML =
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Connexion · ' + titre.replace(/</g, '') + '</title><style>' +
    ':root{--bg:#E7ECE6;--tile:#F7F8F4;--ink:#1D2621;--muted:#5B6A61;--line:#CBD4CC;--bench:#2F4A3C;--brass:#B07D2B;--bad:#b42318}' +
    '@media (prefers-color-scheme:dark){:root{--bg:#131916;--tile:#1D2520;--ink:#E9EEE8;--muted:#9DAEA3;--line:#2E3A33;--bench:#7FAF92;--brass:#D9A54A;--bad:#F2877D}}' +
    '*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif;padding:16px}' +
    'form{background:var(--tile);border:1px solid var(--line);border-radius:4px 14px 14px 4px;padding:26px 24px;width:100%;max-width:360px;display:grid;gap:12px;position:relative}' +
    'form:before{content:"";position:absolute;left:0;top:0;bottom:0;width:8px;border-radius:4px 0 0 4px;background:repeating-linear-gradient(90deg,#E6D3A9 0 2px,#B8925E 2px 3px)}' +
    'h1{font-size:20px;margin:0}p{margin:0;color:var(--muted);font-size:14px}label{font-size:13px;color:var(--muted);display:grid;gap:4px}' +
    'input{font:inherit;color:inherit;padding:10px 12px;border:1.5px solid var(--line);border-radius:8px;background:var(--bg)}input:focus{outline:none;border-color:var(--brass)}' +
    'button{font:inherit;font-weight:700;padding:11px;border:0;border-radius:8px;background:var(--bench);color:var(--tile);cursor:pointer}button:disabled{opacity:.6}' +
    '.err{color:var(--bad);font-size:13px;min-height:18px}.lien{background:none;color:var(--brass);padding:0;font-weight:400;font-size:13px;text-decoration:underline;justify-self:start}' +
    '</style></head><body><form id="f" autocomplete="on">' +
    '<h1>Bois Eco-Style</h1><p>Connecte-toi pour ouvrir « ' + titre.replace(/</g, '') + ' ».</p>' +
    '<label>Email<input id="e" type="email" required autocomplete="username"></label>' +
    '<label>Mot de passe<input id="p" type="password" required autocomplete="current-password"></label>' +
    '<div class="err" id="m" role="status"></div><button id="b">Se connecter</button>' +
    '<button type="button" class="lien" id="o">Mot de passe oublié</button></form></body>';
  var $ = function (id) { return document.getElementById(id); };
  try { var last = localStorage.getItem('bes_auth_email'); if (last) $('e').value = last; } catch (e) {}
  ($('e').value ? $('p') : $('e')).focus();
  $('f').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var email = $('e').value.trim(), pass = $('p').value;
    $('b').disabled = true; $('m').textContent = '';
    getClient().then(function (c) { return c.auth.signInWithPassword({ email: email, password: pass }); })
      .then(function (r) {
        if (r.error) throw r.error;
        try { localStorage.setItem('bes_auth_email', email); } catch (e) {}
        location.reload();
      })
      .catch(function (err) {
        $('b').disabled = false;
        var m = (err && err.message) || '';
        $('m').textContent = /Invalid login/i.test(m) ? 'Email ou mot de passe incorrect.' : m || 'Connexion impossible.';
      });
  });
  $('o').addEventListener('click', function () {
    var email = $('e').value.trim();
    if (!email) { $('m').textContent = 'Écris ton email puis clique sur « Mot de passe oublié ».'; return; }
    getClient().then(function (c) { return c.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] }); })
      .then(function (r) { $('m').textContent = r.error ? r.error.message : 'Email envoyé : suis le lien pour choisir un nouveau mot de passe.'; });
  });

  function addChip() {
    if (document.getElementById('besAuthChip')) return;
    var b = document.createElement('button');
    b.id = 'besAuthChip'; b.type = 'button'; b.textContent = 'Déconnexion'; b.title = 'Se déconnecter de toutes les apps BES';
    b.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;font:12px system-ui,sans-serif;padding:4px 9px;border-radius:999px;border:1px solid rgba(0,0,0,.2);background:rgba(255,255,255,.85);color:#333;cursor:pointer;opacity:.55';
    b.onmouseenter = function () { b.style.opacity = 1; }; b.onmouseleave = function () { b.style.opacity = .55; };
    b.onclick = function () { if (confirm('Se déconnecter de toutes les applications BES ?')) window.BESAuth.logout(); };
    document.body.appendChild(b);
  }
})();
