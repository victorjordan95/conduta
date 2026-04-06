require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const adminKnowledgeRoutes = require('./routes/admin-knowledge');
const sessionsRoutes = require('./routes/sessions');
const analyzeRoutes = require('./routes/analyze');
const feedbackRoutes = require('./routes/feedback');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/knowledge', adminKnowledgeRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/analyze', analyzeRoutes);
app.use('/feedback', feedbackRoutes);

module.exports = app;
