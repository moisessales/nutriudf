const pool = require('../config/database');
const crypto = require('crypto');

exports.listPatients = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const nutritionistId = req.userId;

    const [rows] = await connection.query(
      `SELECT id, full_name AS name, email, birth_date, sex, weight_kg, height_cm, status, goal_summary AS goal, notes, created_at, updated_at
       FROM patient WHERE nutritionist_id = ? ORDER BY created_at DESC`,
      [nutritionistId]
    );

    connection.release();

    const patients = rows.map(p => {
      let age = 0;
      if (p.birth_date) {
        age = Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31557600000);
      }
      const weight = parseFloat(p.weight_kg) || 0;
      const heightM = parseFloat(p.height_cm) || 0;
      const imc = (weight > 0 && heightM > 0) ? (weight / (heightM * heightM)).toFixed(2) : '0.00';
      return { ...p, age, weight: weight, height: heightM, imc };
    });

    res.json(patients);
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    res.status(500).json({ error: 'Erro ao listar pacientes' });
  }
};

exports.getPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const nutritionistId = req.userId;

    const [rows] = await connection.query(
      `SELECT id, full_name AS name, email, birth_date, sex, weight_kg, height_cm, status, goal_summary AS goal, notes, created_at, updated_at
       FROM patient WHERE id = ? AND nutritionist_id = ?`,
      [id, nutritionistId]
    );

    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const p = rows[0];
    let age = 0;
    if (p.birth_date) {
      age = Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31557600000);
    }
    const weight = parseFloat(p.weight_kg) || 0;
    const heightM = parseFloat(p.height_cm) || 0;
    const imc = (weight > 0 && heightM > 0) ? (weight / (heightM * heightM)).toFixed(2) : '0.00';

    connection.release();
    res.json({ ...p, age, weight, height: heightM, imc });
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

    const connection = await pool.getConnection();

    try {
      const patientId = crypto.randomUUID();
      const [result] = await connection.query(
        'INSERT INTO patient (id, nutritionist_id, full_name, email, birth_date, sex, weight_kg, height_cm, goal_summary, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [patientId, nutritionistId, name, email, birth_date, sex || null, weightVal, heightVal, goal || 'Sem objetivo', notes || '', 'ACTIVE']
      );

      connection.release();

      const imc = (weightVal && heightVal) ? (weightVal / (heightVal * heightVal)).toFixed(2) : '0.00';

      res.status(201).json({
        id: patientId,
        name,
        email,
        age: age_int,
        weight: weightVal || 0,
        height: heightVal || 0,
        sex: sex || null,
        imc,
        goal: goal || 'Sem objetivo',
        notes: notes || '',
        nutritionist_id: nutritionistId
      });
    } catch (dbError) {
      connection.release();
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
    const { name, email, age, weight, height, goal, sex } = req.body;
    const nutritionistId = req.userId;

    const connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT id FROM patient WHERE id = ? AND nutritionist_id = ?',
      [id, nutritionistId]
    );

    if (rows.length === 0) {
      connection.release();
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

    if (updates.length === 0) {
      connection.release();
      return res.json({ message: 'Nenhum campo para atualizar' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await connection.query(
      `UPDATE patient SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    connection.release();
    res.json({ message: 'Paciente atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
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
