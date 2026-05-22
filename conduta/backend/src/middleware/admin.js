const jwt = require('jsonwebtoken');
const pool = require('../db/pg');

/**
 * Middleware que exige JWT válido + role = 'admin'.
 * Substitui o padrão x-admin-secret exposto no frontend.
 */
async function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  try {
    const result = await pool.query(
      'SELECT role, session_version, active FROM users WHERE id = $1',
      [payload.sub]
    );

    const user = result.rows[0];

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    if (user.session_version !== payload.sv) {
      return res.status(401).json({ error: 'Sessão encerrada.', code: 'SESSION_KICKED' });
    }

    if (!user.active) {
      return res.status(401).json({ error: 'Conta desativada.' });
    }

    req.userId = payload.sub;
    next();
  } catch (err) {
    console.error('Erro no adminMiddleware:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
}

module.exports = adminMiddleware;
