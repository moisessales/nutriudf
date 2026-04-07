const jwt = require('jsonwebtoken');

// Cache de tokens verificados — evita crypto ops repetidas (~10-50ms cada)
const tokenCache = new Map();
const CACHE_TTL = 60_000; // 1 minuto
const CACHE_MAX = 500;

function getFromCache(token) {
  const entry = tokenCache.get(token);
  if (!entry) return null;
  if (Date.now() - entry.t > CACHE_TTL) {
    tokenCache.delete(token);
    return null;
  }
  return entry.d;
}

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    let decoded = getFromCache(token);
    if (!decoded) {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      // LRU simples: limpa o mais antigo se exceder limite
      if (tokenCache.size >= CACHE_MAX) {
        tokenCache.delete(tokenCache.keys().next().value);
      }
      tokenCache.set(token, { d: decoded, t: Date.now() });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;
