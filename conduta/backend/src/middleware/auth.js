const jwt = require('jsonwebtoken');
const Sentry = require('@sentry/node');
const pool = require('../db/pg');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    if (payload.sv === undefined) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    const result = await pool.query(
      'SELECT session_version, plan, active, email_verified, email, role FROM users WHERE id = $1',
      [payload.sub]
    );

    if (!result.rows.length || result.rows[0].session_version !== payload.sv) {
      return res.status(401).json({
        error: 'Sua sessão foi encerrada pois outro acesso foi iniciado.',
        code: 'SESSION_KICKED',
      });
    }

    if (!result.rows[0].active) {
      return res.status(401).json({ error: 'Conta desativada.' });
    }

    if (!result.rows[0].email_verified) {
      return res.status(403).json({
        error: 'Email não verificado. Verifique sua caixa de entrada.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    req.userId = payload.sub;
    req.userRole = result.rows[0].role || 'user';
    req.userPlan = result.rows[0].plan || 'free';

    Sentry.setUser({ id: payload.sub, email: result.rows[0].email });

    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

module.exports = authMiddleware;
