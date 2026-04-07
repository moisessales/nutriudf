const pool = require('../config/database');
const crypto = require('crypto');

function calculateAge(birthDate) {
  if (!birthDate) return 0;
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / 31557600000);
}

function serializePatient(row) {
  const age = calculateAge(row.birth_date);
  const weight = parseFloat(row.weight_kg) || 0;
  const height = parseFloat(row.height_cm) || 0;
  const imc = (weight > 0 && height > 0) ? (weight / (height * height)).toFixed(2) : '0.00';

  return {
    ...row,
    name: row.name || row.full_name,
    goal: row.goal || row.goal_summary || 'Sem objetivo',
    age,
    weight,
    height,
    imc
  };
}

async function fetchPatientRow(patientId, nutritionistId) {
  const [rows] = await pool.query(
    `SELECT id, full_name AS name, email, birth_date, sex, weight_kg, height_cm, status, goal_summary AS goal, notes, created_at, updated_at
     FROM patient WHERE id = ? AND nutritionist_id = ?`,
    [patientId, nutritionistId]
  );

  return rows[0] || null;
}

exports.listPatients = async (req, res) => {
  try {
    const nutritionistId = req.userId;

    const [rows] = await pool.query(
      `SELECT id, full_name AS name, email, birth_date, sex, weight_kg, height_cm, status, goal_summary AS goal, notes, created_at, updated_at
       FROM patient WHERE nutritionist_id = ? ORDER BY created_at DESC`,
      [nutritionistId]
    );

    res.json(rows.map(serializePatient));
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    res.status(500).json({ error: 'Erro ao listar pacientes' });
  }
};

exports.getPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const nutritionistId = req.userId;

    const patient = await fetchPatientRow(id, nutritionistId);

    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json(serializePatient(patient));
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    res.status(500).json({ error: 'Erro ao buscar paciente' });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const { name, email, age, weight, height, goal, notes, sex } = req.body;
    const nutritionistId = req.userId;

    if (!name || !email || typeof age === 'undefined') {
      return res.status(400).json({ error: 'Dados obrigatórios faltando: name, email, age' });
    }

    const age_int = parseInt(age);
    const birth_year = new Date().getFullYear() - age_int;
    const birth_date = `${birth_year}-01-01`;
    const weightVal = parseFloat(weight) || null;
    const heightVal = parseFloat(height) || null;

    try {
      const patientId = crypto.randomUUID();
      await pool.query(
        'INSERT INTO patient (id, nutritionist_id, full_name, email, birth_date, sex, weight_kg, height_cm, goal_summary, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [patientId, nutritionistId, name, email, birth_date, sex || null, weightVal, heightVal, goal || 'Sem objetivo', notes || '', 'ACTIVE']
      );

      const createdPatient = await fetchPatientRow(patientId, nutritionistId);
      res.status(201).json(serializePatient(createdPatient));
    } catch (dbError) {
      console.error('❌ Erro no banco:', dbError.message);
      
      if (dbError.message.includes('Duplicate entry') || dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('❌ Erro ao criar paciente:', error.message);
    res.status(500).json({ error: 'Erro ao criar paciente: ' + error.message });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age, weight, height, goal, sex, notes } = req.body;
    const nutritionistId = req.userId;

    const [rows] = await pool.query(
      'SELECT id FROM patient WHERE id = ? AND nutritionist_id = ?',
      [id, nutritionistId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('full_name = ?'); values.push(name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (sex !== undefined) { updates.push('sex = ?'); values.push(sex); }
    if (weight !== undefined) { updates.push('weight_kg = ?'); values.push(parseFloat(weight) || null); }
    if (height !== undefined) { updates.push('height_cm = ?'); values.push(parseFloat(height) || null); }
    if (age !== undefined) { 
      const birth_year = new Date().getFullYear() - parseInt(age);
      updates.push('birth_date = ?');
      values.push(`${birth_year}-01-01`);
    }
    if (goal !== undefined) { updates.push('goal_summary = ?'); values.push(goal); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

    if (updates.length === 0) {
      return res.json({ message: 'Nenhum campo para atualizar' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.query(
      `UPDATE patient SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedPatient = await fetchPatientRow(id, nutritionistId);
    res.json(serializePatient(updatedPatient));
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: 'Erro ao atualizar paciente' });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const nutritionistId = req.userId;

    const connection = await pool.getConnection();

    // Verificar se paciente pertence ao usuário
    const [rows] = await connection.query(
      'SELECT id FROM patient WHERE id = ? AND nutritionist_id = ?',
      [id, nutritionistId]
    );

    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    await connection.query('DELETE FROM patient WHERE id = ?', [id]);
    connection.release();

    res.json({ message: 'Paciente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar paciente:', error);
    res.status(500).json({ error: 'Erro ao deletar paciente' });
  }
};
