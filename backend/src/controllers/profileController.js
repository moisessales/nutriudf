const pool = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const [users] = await pool.query(
      'SELECT id, full_name, email, role, created_at FROM app_user WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = users[0];

    const [profiles] = await pool.query(
      'SELECT crn, phone, bio, profession, experience_years, education, specialties, city, modality FROM nutritionist_profile WHERE user_id = ?',
      [userId]
    );

    const profile = profiles[0] || {};

    // Stats
    const [[patientCount]] = await pool.query(
      'SELECT COUNT(*) AS count FROM patient WHERE nutritionist_id = ?',
      [userId]
    );

    const [[planCount]] = await pool.query(
      'SELECT COUNT(*) AS count FROM meal_plan WHERE nutritionist_id = ?',
      [userId]
    );

    const [[consultationCount]] = await pool.query(
      'SELECT COUNT(*) AS count FROM consultation WHERE nutritionist_id = ?',
      [userId]
    );

    res.json({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      crn: profile.crn || null,
      phone: profile.phone || null,
      bio: profile.bio || null,
      profession: profile.profession || null,
      experience_years: profile.experience_years || null,
      education: profile.education || null,
      specialties: profile.specialties || null,
      city: profile.city || null,
      modality: profile.modality || null,
      stats: {
        patients: patientCount.count,
        plans: planCount.count,
        consultations: consultationCount.count
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error.message);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { profession, experience_years, crn, education, bio, specialties, phone, city, modality } = req.body;

    // Upsert: insert or update
    const [existing] = await pool.query(
      'SELECT user_id FROM nutritionist_profile WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO nutritionist_profile (user_id, crn, phone, bio, profession, experience_years, education, specialties, city, modality)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, crn || null, phone || null, bio || null, profession || null, experience_years || null, education || null, specialties || null, city || null, modality || null]
      );
    } else {
      await pool.query(
        `UPDATE nutritionist_profile SET crn = ?, phone = ?, bio = ?, profession = ?, experience_years = ?, education = ?, specialties = ?, city = ?, modality = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [crn || null, phone || null, bio || null, profession || null, experience_years || null, education || null, specialties || null, city || null, modality || null, userId]
      );
    }

    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

exports.changeEmail = async (req, res) => {
  try {
    const userId = req.userId;
    const { new_email, password } = req.body;

    if (!new_email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(new_email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const [users] = await pool.query(
      'SELECT password_hash FROM app_user WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const isValid = await bcrypt.compare(password, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM app_user WHERE email = ? AND id != ?',
      [new_email, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Este email já está em uso' });
    }

    await pool.query(
      'UPDATE app_user SET email = ?, updated_at = NOW() WHERE id = ?',
      [new_email, userId]
    );

    res.json({ message: 'Email alterado com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar email:', error.message);
    res.status(500).json({ error: 'Erro ao alterar email' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres' });
    }

    const [users] = await pool.query(
      'SELECT password_hash FROM app_user WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const isValid = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await pool.query(
      'UPDATE app_user SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error.message);
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória para confirmar exclusão' });
    }

    const [users] = await pool.query(
      'SELECT password_hash FROM app_user WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const isValid = await bcrypt.compare(password, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Soft delete: desativar a conta
    await pool.query(
      'UPDATE app_user SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Conta desativada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar conta:', error.message);
    res.status(500).json({ error: 'Erro ao deletar conta' });
  }
};
