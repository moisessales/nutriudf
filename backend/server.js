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
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./src/config/logger');
const { sanitizeBody, limitBodySize } = require('./src/middleware/validate');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const authRoutes = require('./src/routes/authRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const planRoutes = require('./src/routes/planRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const foodRoutes = require('./src/routes/foodRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const consultationRoutes = require('./src/routes/consultationRoutes');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// HTTPS redirect em produção
if (isProd) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

const path = require('path');

// Servir arquivos estáticos com cache
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '7d' : '0',
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Segurança: headers HTTP
app.use(helmet({
  contentSecurityPolicy: false, // desabilitar CSP para não bloquear o frontend
}));

// Rate limiting geral: 100 requests / 15 min por IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting auth: 10 tentativas / 15 min por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Logging HTTP requests
app.use(morgan(isProd ? 'combined' : 'dev', { stream: logger.stream }));

// CORS
app.use(cors({
  origin: function(origin, callback) {
    // Em produção, exigir origin e validar contra lista
    if (isProd) {
      const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!origin || !allowed.includes(origin)) {
        return callback(new Error('CORS not allowed'));
      }
      return callback(null, true);
    }
    // Em dev, permitir localhost
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    callback(new Error('CORS not allowed'));
  },
  credentials: true
}));

// Body parsing + sanitização
app.use(limitBodySize(100 * 1024)); // 100KB max
app.use(bodyParser.json({ limit: '100kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100kb' }));
app.use(sanitizeBody);

// Rotas versionadas (v1)
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/foods', foodRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/consultations', consultationRoutes);

// Compatibilidade: /api/* redireciona para /api/v1/*
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/consultations', consultationRoutes);

// Documentação Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NutriUDF API Docs',
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API is running', environment: process.env.NODE_ENV });
});

// SPA fallback: qualquer rota não-API serve o frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler (apenas para rotas /api)
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler com logging
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Servidor rodando em http://localhost:${PORT}`);
  logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
