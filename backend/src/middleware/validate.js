// Input validation & sanitization middleware

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/<[^>]*>/g, '');
}

function validateEmail(email) {
  return typeof email === 'string' && emailRegex.test(email.trim()) && email.length <= 254;
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6 && password.length <= 128;
}

function validateUUID(id) {
  return typeof id === 'string' && uuidRegex.test(id);
}

function validateDate(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

function validateNumber(val, { min, max } = {}) {
  const n = parseFloat(val);
  if (isNaN(n)) return false;
  if (min !== undefined && n < min) return false;
  if (max !== undefined && n > max) return false;
  return true;
}

function validateString(val, { minLen = 1, maxLen = 500 } = {}) {
  return typeof val === 'string' && val.trim().length >= minLen && val.trim().length <= maxLen;
}

// Middleware: sanitize all string fields in req.body
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitize(req.body[key]);
      }
    }
  }
  next();
}

// Middleware: validate patient create/update
function validatePatient(req, res, next) {
  const { name, email, age, weight, height, sex, notes } = req.body;
  const errors = [];

  if (req.method === 'POST') {
    if (!validateString(name, { maxLen: 200 })) errors.push('Nome é obrigatório (máx 200 caracteres)');
    if (!validateEmail(email)) errors.push('Email inválido');
    if (age !== undefined && !validateNumber(age, { min: 0, max: 150 })) errors.push('Idade deve ser entre 0 e 150');
  } else {
    if (name !== undefined && !validateString(name, { maxLen: 200 })) errors.push('Nome inválido');
    if (email !== undefined && !validateEmail(email)) errors.push('Email inválido');
    if (age !== undefined && !validateNumber(age, { min: 0, max: 150 })) errors.push('Idade inválida');
  }

  if (weight !== undefined && !validateNumber(weight, { min: 0.1, max: 500 })) errors.push('Peso deve ser entre 0.1 e 500 kg');
  if (height !== undefined && !validateNumber(height, { min: 0.3, max: 3 })) errors.push('Altura deve ser entre 0.3 e 3.0 m');
  if (sex !== undefined && sex !== null && sex !== '' && !['F', 'M', 'Masculino', 'Feminino'].includes(sex)) errors.push('Sexo inválido');
  if (notes !== undefined && !validateString(notes, { minLen: 0, maxLen: 5000 })) errors.push('Observações muito longas');

  if (errors.length > 0) return res.status(400).json({ error: errors.join('. ') });
  next();
}

// Middleware: validate consultation create/update
function validateConsultation(req, res, next) {
  const { patient_id, starts_at, ends_at, status } = req.body;
  const errors = [];

  if (req.method === 'POST') {
    if (!patient_id) errors.push('patient_id é obrigatório');
    if (!starts_at || !validateDate(starts_at)) errors.push('starts_at deve ser uma data válida');
  }

  if (patient_id && !validateUUID(patient_id)) errors.push('patient_id inválido');
  if (starts_at && !validateDate(starts_at)) errors.push('starts_at deve ser uma data válida');
  if (ends_at && !validateDate(ends_at)) errors.push('ends_at deve ser uma data válida');
  if (status && !['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
    errors.push('status deve ser SCHEDULED, COMPLETED, CANCELLED ou NO_SHOW');
  }

  if (errors.length > 0) return res.status(400).json({ error: errors.join('. ') });
  next();
}

// Middleware: validate UUID param
function validateIdParam(req, res, next) {
  const id = req.params.id || req.params.patientId;
  if (id && !validateUUID(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  next();
}

// Middleware: limit body size (extra protection)
function limitBodySize(maxBytes = 100 * 1024) {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxBytes) {
      return res.status(413).json({ error: 'Payload muito grande' });
    }
    next();
  };
}

module.exports = {
  sanitizeBody,
  validatePatient,
  validateConsultation,
  validateIdParam,
  validateEmail,
  validatePassword,
  validateUUID,
  validateDate,
  validateNumber,
  validateString,
  limitBodySize
};
