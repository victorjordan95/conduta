require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const authMiddleware = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const adminKnowledgeRoutes = require('./routes/admin-knowledge');
const sessionsRoutes = require('./routes/sessions');
const analyzeRoutes = require('./routes/analyze');
const feedbackRoutes = require('./routes/feedback');

const app = express();

app.set('trust proxy', 1);

const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

console.log(`[CORS] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);

const corsOptions = {
  origin: (origin, callback) => {
    const normalized = (origin || '').replace(/\/$/, '');
    if (!origin || ALLOWED_ORIGINS.includes(normalized)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: "${origin}" | allowed: ${ALLOWED_ORIGINS.join(', ')}`);
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());

// Rate limiting: login — 10 tentativas / 15 min por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

// Rate limiting: analyze — 10 req / min por usuário (userId populado pelo authMiddleware antes)
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.userId || ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde antes de enviar outro caso.' },
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth/login', loginLimiter);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/knowledge', adminKnowledgeRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/analyze', authMiddleware, analyzeLimiter, analyzeRoutes);
app.use('/feedback', feedbackRoutes);

module.exports = app;
