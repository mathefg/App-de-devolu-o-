const crypto = require('node:crypto');

const COOKIE_NAME = 'devolucoes_auth';

function sign(value, secret) {
  const hmac = crypto.createHmac('sha256', secret).update(value).digest('hex');
  return `${value}.${hmac}`;
}

function verify(signed, secret) {
  if (typeof signed !== 'string') return false;
  const idx = signed.lastIndexOf('.');
  if (idx === -1) return false;
  const value = signed.slice(0, idx);
  const expected = sign(value, secret);
  return crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(expected)) && value === 'ok';
}

function requireAuth(appPassword) {
  const secret = crypto.createHash('sha256').update(appPassword).digest('hex');

  return function (req, res, next) {
    if (req.path === '/login' || req.path === '/api/health') return next();

    const token = req.cookies && req.cookies[COOKIE_NAME];
    if (token && verify(token, secret)) return next();

    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }
    return res.redirect('/login');
  };
}

function login(req, res, appPassword) {
  const secret = crypto.createHash('sha256').update(appPassword).digest('hex');
  const { password } = req.body || {};
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Informe a senha.' });
  }
  const providedHash = crypto.createHash('sha256').update(password).digest();
  const expectedHash = crypto.createHash('sha256').update(appPassword).digest();
  const providedOk = crypto.timingSafeEqual(providedHash, expectedHash);

  if (!providedOk) {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }
  const token = sign('ok', secret);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return res.json({ ok: true });
}

module.exports = { requireAuth, login, COOKIE_NAME };
