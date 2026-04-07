const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.list = async (req, res) => {
  try {
    const nutritionistId = req.userId;
    const { startDate, endDate, patientId } = req.query;
    const connection = await pool.getConnection();

    let sql = `SELECT c.*, p.full_name AS patient_name
               FROM consultation c
               JOIN patient p ON p.id = c.patient_id
               WHERE c.nutritionist_id = ?`;
    const params = [nutritionistId];

    if (patientId) {
      sql += ' AND c.patient_id = ?';
      params.push(patientId);
    }
    if (startDate) {
      sql += ' AND c.starts_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND c.starts_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY c.starts_at ASC';

    const [rows] = await connection.query(sql, params);
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar consultas:', error);
    res.status(500).json({ error: 'Erro ao listar consultas' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const nutritionistId = req.userId;
    const connection = await pool.getConnection();

    const [rows] = await connection.query(
      `SELECT c.*, p.full_name AS patient_name
       FROM consultation c
       JOIN patient p ON p.id = c.patient_id
       WHERE c.id = ? AND c.nutritionist_id = ?`,
      [id, nutritionistId]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar consulta:', error);
    res.status(500).json({ error: 'Erro ao buscar consulta' });
  }
};

exports.create = async (req, res) => {
  try {
    const { patient_id, starts_at, ends_at, title, notes, status } = req.body;
    const nutritionistId = req.userId;

    if (!patient_id || !starts_at) {
      return res.status(400).json({ error: 'patient_id e starts_at são obrigatórios' });
    }

    const connection = await pool.getConnection();

    // Verify patient belongs to this nutritionist
    const [patient] = await connection.query(
      'SELECT id FROM patient WHERE id = ? AND nutritionist_id = ?',
      [patient_id, nutritionistId]
    );
    if (patient.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const id = uuidv4();
    await connection.query(
      `INSERT INTO consultation (id, nutritionist_id, patient_id, starts_at, ends_at, title, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nutritionistId, patient_id, starts_at, ends_at || null, title || null, notes || null, status || 'SCHEDULED']
    );

    const [created] = await connection.query(
      'SELECT id, nutritionist_id, patient_id, starts_at, ends_at, title, notes, status, created_at FROM consultation WHERE id = ?',
      [id]
    );
    connection.release();

    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Erro ao criar consulta:', error);
    res.status(500).json({ error: 'Erro ao criar consulta' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, starts_at, ends_at, title, notes, status } = req.body;
    const nutritionistId = req.userId;
    const connection = await pool.getConnection();

    const [existing] = await connection.query(
      'SELECT id FROM consultation WHERE id = ? AND nutritionist_id = ?',
      [id, nutritionistId]
    );
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    const fields = [];
    const values = [];
    if (patient_id !== undefined) { fields.push('patient_id = ?'); values.push(patient_id); }
    if (starts_at !== undefined) { fields.push('starts_at = ?'); values.push(starts_at); }
    if (ends_at !== undefined) { fields.push('ends_at = ?'); values.push(ends_at); }
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

    if (fields.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id);
    await connection.query(`UPDATE consultation SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await connection.query(
      'SELECT id, nutritionist_id, patient_id, starts_at, ends_at, title, notes, status, created_at FROM consultation WHERE id = ?',
      [id]
    );
    connection.release();

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar consulta:', error);
    res.status(500).json({ error: 'Erro ao atualizar consulta' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const nutritionistId = req.userId;
    const connection = await pool.getConnection();

    const [existing] = await connection.query(
      'SELECT id FROM consultation WHERE id = ? AND nutritionist_id = ?',
      [id, nutritionistId]
    );
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    await connection.query('DELETE FROM consultation WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Consulta removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover consulta:', error);
    res.status(500).json({ error: 'Erro ao remover consulta' });
  }
};
