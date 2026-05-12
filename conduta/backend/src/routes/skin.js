const express = require('express');
const multer = require('multer');
const { classificar } = require('../services/skin-classifier');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/classificar', upload.single('imagem'), async (req, res) => {
  if (req.userPlan !== 'pro' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Disponível apenas no plano Pro.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Imagem obrigatória.' });
  }

  if (!['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Formato não suportado. Use JPEG ou PNG.' });
  }

  try {
    const classificacao = await classificar(req.file.buffer, req.file.mimetype);
    return res.json({ classificacao });
  } catch (err) {
    const status = err.status || 502;
    return res.status(status).json({ error: 'Erro ao processar imagem. Tente novamente.' });
  }
});

// Handler para LIMIT_FILE_SIZE do Multer
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'A imagem deve ter no máximo 5MB.' });
  }
  next(err);
});

module.exports = router;
