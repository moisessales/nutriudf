require('dotenv').config();

// Validação de variáveis de ambiente obrigatórias
const requiredEnvs = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const prodRequiredEnvs = ['CORS_ORIGIN', 'SMTP_USER', 'SMTP_PASS'];
const missing = requiredEnvs.filter(e => !process.env[e]);
if (process.env.NODE_ENV === 'production') {
  missing.push(...prodRequiredEnvs.filter(e => !process.env[e]));
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET deve ter pelo menos 32 caracteres em produção');
    process.exit(1);
  }
}
if (missing.length > 0) {
  console.error(`❌ Variáveis de ambiente faltando: ${missing.join(', ')}`);
  process.exit(1);
}

const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./src/config/logger');
const { sanitizeBody, limitBodySize } = require('./src/middleware/validate');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./src/routes/authRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const planRoutes = require('./src/routes/planRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const foodRoutes = require('./src/routes/foodRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const consultationRoutes = require('./src/routes/consultationRoutes');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Trust proxy (Render usa reverse proxy)
app.set('trust proxy', 1);

// HTTPS redirect em produção
if (isProd) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Health check — ANTES de qualquer middleware pesado (resposta < 1ms)
const foodController = require('./src/controllers/foodController');
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    catalog: foodController.isReady() ? 'loaded' : 'loading',
    uptime: Math.floor(process.uptime())
  });
});

// Compressão gzip — ANTES de tudo
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Servir arquivos estáticos com cache agressivo
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '30d' : '0',
  etag: true,
  lastModified: true,
  immutable: isProd,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Link', [
        '<https://fonts.googleapis.com>; rel=preconnect',
        '<https://fonts.gstatic.com>; rel=preconnect; crossorigin'
      ].join(', '));
    }
  }
}));

// Segurança: headers HTTP
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting — sem keyGenerator customizado (default já trata IPv6)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de cadastro. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Logging HTTP (apenas em prod: combined; dev: dev)
app.use(morgan(isProd ? 'combined' : 'dev', { stream: logger.stream }));

// CORS
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (isProd) {
      const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!allowed.includes(origin)) return callback(new Error('CORS not allowed'));
      return callback(null, true);
    }
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    callback(new Error('CORS not allowed'));
  },
  credentials: true
}));

// Body parsing — express.json() já inclui o que body-parser faz
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(sanitizeBody);

// ── Rotas API ─────────────────────────────────────────────────
// Rate limiters específicos
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/auth/register', registerLimiter);
app.use('/api/v1/auth/resend-verification', registerLimiter);

// Rotas v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/foods', foodRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/consultations', consultationRoutes);

// Compatibilidade: /api/* ➜ mesmas rotas (sem duplicar middleware chain)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/resend-verification', registerLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/consultations', consultationRoutes);

// Swagger — lazy load (módulo pesado, ~2MB)
app.use('/api/docs', (req, res, next) => {
  if (!app._swagger) {
    const swaggerUi = require('swagger-ui-express');
    const swaggerDoc = require('./swagger.json');
    app._swagger = [swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'NutriUDF API Docs',
    })];
  }
  app._swagger[0](req, res, () => app._swagger[1](req, res, next));
});

// SPA fallback — HTML pré-carregado em memória
const indexPath = path.join(__dirname, 'public', 'index.html');
let cachedIndex = null;
let cachedIndexTime = 0;

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (isProd) {
    const now = Date.now();
    if (!cachedIndex || now - cachedIndexTime > 3600000) {
      try { cachedIndex = fs.readFileSync(indexPath); cachedIndexTime = now; } catch (e) { return res.sendFile(indexPath); }
    }
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-cache');
    return res.send(cachedIndex);
  }
  res.sendFile(indexPath);
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: isProd ? undefined : err.stack,
    method: req.method,
    url: req.originalUrl,
  });
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ── Iniciar servidor ──────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Servidor rodando em http://localhost:${PORT}`);
  logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);

  if (isProd) {
    const https = require('https');
    const APP_URL = process.env.APP_URL;
    if (APP_URL) {
      // Self-ping a cada 14min + keep DB warm
      setInterval(() => {
        https.get(`${APP_URL}/health`, () => {}).on('error', () => {});
        // Manter pool MySQL ativo
        require('./src/config/database').query('SELECT 1').catch(() => {});
      }, 14 * 60 * 1000);
      logger.info('Self-ping + DB keep-alive ativados (14min)');
    }
  }
});
