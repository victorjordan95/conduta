const express = require('express');
const multer = require('multer');
const { classificar } = require('../services/skin-classifier');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/classificar', upload.single('imagem'), async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Funcionalidade em fase de testes.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Imagem obrigatória.' });
  }

  if (!['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Formato não suportado. Use JPEG ou PNG.' });
  }

  console.log(`[skin] classificar — mimetype=${req.file.mimetype} size=${req.file.size}B user=${req.userId}`);

  try {
    const classificacao = await classificar(req.file.buffer, req.file.mimetype);
    console.log(`[skin] classificação concluída user=${req.userId}`);
    return res.json({ classificacao });
  } catch (err) {
    const status = err.status || 502;
    console.error(`[skin] erro na classificação status=${status} user=${req.userId} msg="${err.message}"`);
    const msg =
      status === 504
        ? 'O modelo de IA demorou para responder. Tente novamente em alguns instantes.'
        : 'Erro ao processar imagem. Tente novamente.';
    return res.status(status).json({ error: msg });
  }
});

module.exports = router;
