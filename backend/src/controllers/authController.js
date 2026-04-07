const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/database');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

// Gera token seguro de 32 bytes (64 hex chars)
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

exports.register = async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Validação de senha forte
    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'A senha deve conter pelo menos uma letra maiúscula' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'A senha deve conter pelo menos um número' });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ error: 'A senha deve conter pelo menos um caractere especial (!@#$%...)' });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const connection = await pool.getConnection();
    
    // Verificar se usuário já existe
    const [rows] = await connection.query('SELECT id, email_verified FROM app_user WHERE email = ?', [email]);
    if (rows.length > 0) {
      // Se existe mas não verificou, permitir reenvio
      if (!rows[0].email_verified) {
        const token = generateSecureToken();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        await connection.query(
          'UPDATE app_user SET verification_token = ?, verification_expires = ? WHERE email = ?',
          [token, expires, email]
        );
        connection.release();

        try {
          await sendVerificationEmail(email, full_name, token);
        } catch (emailErr) {
          console.warn('⚠️ Erro ao enviar email de verificação:', emailErr.message);
        }

        return res.status(200).json({ 
          message: 'Email de verificação reenviado. Verifique sua caixa de entrada.',
          requiresVerification: true
        });
      }
      connection.release();
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Gerar token de verificação
    const verificationToken = generateSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Inserir usuário como não verificado
    const userId = crypto.randomUUID();
    await connection.query(
      'INSERT INTO app_user (id, email, password_hash, full_name, role, email_verified, verification_token, verification_expires) VALUES (?, ?, ?, ?, ?, FALSE, ?, ?)',
      [userId, email, hashedPassword, full_name, role || 'NUTRITIONIST', verificationToken, verificationExpires]
    );

    connection.release();

    // Enviar email de verificação
    try {
      await sendVerificationEmail(email, full_name, verificationToken);
    } catch (emailErr) {
      console.warn('⚠️ Erro ao enviar email de verificação:', emailErr.message);
    }

    res.status(201).json({ 
      message: 'Cadastro realizado! Verifique seu email para ativar sua conta.',
      requiresVerification: true
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de verificação não fornecido' });
    }

    const connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT id, full_name, email, verification_expires FROM app_user WHERE verification_token = ? AND email_verified = FALSE',
      [token]
    );

    if (rows.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Token inválido ou já utilizado' });
    }

    const user = rows[0];

    // Verificar expiração
    if (new Date() > new Date(user.verification_expires)) {
      connection.release();
      return res.status(400).json({ error: 'Token expirado. Faça o cadastro novamente.' });
    }

    // Ativar conta
    await connection.query(
      'UPDATE app_user SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL WHERE id = ?',
      [user.id]
    );

    connection.release();

    res.json({ 
      message: 'Email verificado com sucesso! Você já pode fazer login.',
      verified: true
    });
  } catch (error) {
    console.error('Erro na verificação:', error);
    res.status(500).json({ error: 'Erro ao verificar email' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const connection = await pool.getConnection();
    
    // Buscar usuário
    const [rows] = await connection.query(
      'SELECT id, email, password_hash, full_name, role, email_verified FROM app_user WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const user = rows[0];

    // Verificar se conta está ativa
    if (!user.email_verified) {
      connection.release();
      return res.status(403).json({ 
        error: 'Conta não verificada. Verifique seu email para ativar.',
        needsVerification: true
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      connection.release();
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    connection.release();

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro no login:', error.message);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT id, full_name, email FROM app_user WHERE email = ? AND email_verified = TRUE',
      [email]
    );

    // Sempre retorna sucesso (segurança: não revelar se email existe)
    if (rows.length === 0) {
      connection.release();
      return res.json({ message: 'Se o email estiver cadastrado, você receberá um link de redefinição.' });
    }

    const user = rows[0];

    // Invalidar tokens anteriores
    await connection.query(
      'UPDATE password_reset_token SET used = TRUE WHERE user_id = ? AND used = FALSE',
      [user.id]
    );

    // Gerar novo token
    const resetToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await connection.query(
      'INSERT INTO password_reset_token (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    connection.release();

    // Enviar email
    try {
      await sendPasswordResetEmail(email, user.full_name, resetToken);
    } catch (emailErr) {
      console.warn('⚠️ Erro ao enviar email de reset:', emailErr.message);
    }

    res.json({ message: 'Se o email estiver cadastrado, você receberá um link de redefinição.' });
  } catch (error) {
    console.error('Erro no forgot password:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    const connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT prt.id, prt.user_id, prt.expires_at, u.full_name FROM password_reset_token prt JOIN app_user u ON u.id = prt.user_id WHERE prt.token = ? AND prt.used = FALSE',
      [token]
    );

    if (rows.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Token inválido ou já utilizado' });
    }

    const resetRecord = rows[0];

    // Verificar expiração
    if (new Date() > new Date(resetRecord.expires_at)) {
      await connection.query('UPDATE password_reset_token SET used = TRUE WHERE id = ?', [resetRecord.id]);
      connection.release();
      return res.status(400).json({ error: 'Token expirado. Solicite um novo link.' });
    }

    // Atualizar senha
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.query(
      'UPDATE app_user SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, resetRecord.user_id]
    );

    // Marcar token como usado
    await connection.query(
      'UPDATE password_reset_token SET used = TRUE WHERE id = ?',
      [resetRecord.id]
    );

    connection.release();

    res.json({ message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' });
  } catch (error) {
    console.error('Erro no reset password:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT id, full_name, email_verified FROM app_user WHERE email = ?',
      [email]
    );

    if (rows.length === 0 || rows[0].email_verified) {
      connection.release();
      return res.json({ message: 'Se o email precisar de verificação, um novo link será enviado.' });
    }

    const user = rows[0];
    const token = generateSecureToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await connection.query(
      'UPDATE app_user SET verification_token = ?, verification_expires = ? WHERE id = ?',
      [token, expires, user.id]
    );

    connection.release();

    try {
      await sendVerificationEmail(email, user.full_name, token);
    } catch (emailErr) {
      console.warn('⚠️ Erro ao reenviar verificação:', emailErr.message);
    }

    res.json({ message: 'Email de verificação reenviado. Verifique sua caixa de entrada.' });
  } catch (error) {
    console.error('Erro ao reenviar verificação:', error);
    res.status(500).json({ error: 'Erro ao reenviar verificação' });
  }
};
