const pool = require('../config/database');

exports.getPlanByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { date } = req.query;
    const nutritionistId = req.userId;

    const connection = await pool.getConnection();

    // Verificar se paciente pertence ao usuário
    const [patient] = await connection.query(
      'SELECT id FROM patient WHERE id = ? AND nutritionist_id = ?',
      [patientId, nutritionistId]
    );

    if (patient.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    let rows;

    if (date) {
      [rows] = await connection.query(
        'SELECT * FROM meal_plans WHERE patient_id = ? AND DATE(date) = ? ORDER BY updated_at DESC LIMIT 1',
        [patientId, date]
      );
    } else {
      [rows] = await connection.query(
        'SELECT * FROM meal_plans WHERE patient_id = ? ORDER BY date DESC LIMIT 1',
        [patientId]
      );
    }

    connection.release();
    
    if (rows.length === 0) {
      return res.json(null);
    }

    let parsedMealData = rows[0].meal_data;
    try {
      parsedMealData = JSON.parse(rows[0].meal_data);
    } catch (error) {
      console.warn('meal_data salvo não é JSON válido, retornando valor bruto');
    }

    res.json({
      ...rows[0],
      mealData: parsedMealData
    });
  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    res.status(500).json({ error: 'Erro ao buscar plano' });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const patientId = req.body.patientId || req.body.patient_id;
    const planDate = req.body.planDate || req.body.date || new Date().toISOString().split('T')[0];
    let mealData = req.body.mealData || req.body.meal_data;
    const nutritionistId = req.userId;

    if (typeof mealData === 'string') {
      try {
        mealData = JSON.parse(mealData);
      } catch (error) {
        console.warn('mealData recebido como string inválida, mantendo valor original');
      }
    }

    if (!patientId || !mealData) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    const connection = await pool.getConnection();

    // Verificar se paciente pertence ao usuário
    const [patient] = await connection.query(
      'SELECT id FROM patient WHERE id = ? AND nutritionist_id = ?',
      [patientId, nutritionistId]
    );

    if (patient.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const [existingPlans] = await connection.query(
      'SELECT id FROM meal_plans WHERE patient_id = ? AND DATE(date) = ? ORDER BY updated_at DESC LIMIT 1',
      [patientId, planDate]
    );

    let planId;

    if (existingPlans.length > 0) {
      planId = existingPlans[0].id;
      await connection.query(
        'UPDATE meal_plans SET meal_data = ?, date = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(mealData), `${planDate} 00:00:00`, planId]
      );
    } else {
      const [result] = await connection.query(
        'INSERT INTO meal_plans (patient_id, meal_data, date) VALUES (?, ?, ?)',
        [patientId, JSON.stringify(mealData), `${planDate} 00:00:00`]
      );
      planId = result.insertId;
    }

    connection.release();

    res.status(existingPlans.length > 0 ? 200 : 201).json({
      id: planId,
      patientId,
      patient_id: patientId,
      planDate,
      mealData,
      meal_data: mealData,
      date: `${planDate} 00:00:00`
    });
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    res.status(500).json({ error: 'Erro ao criar plano' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    let mealData = req.body.mealData || req.body.meal_data;
    const nutritionistId = req.userId;

    if (typeof mealData === 'string') {
      try {
        mealData = JSON.parse(mealData);
      } catch (error) {
        console.warn('mealData recebido como string inválida, mantendo valor original');
      }
    }

    const connection = await pool.getConnection();

    // Verificar se plano pertence a paciente do usuário
    const [plan] = await connection.query(
      `SELECT p.id FROM meal_plans p 
       JOIN patient pat ON p.patient_id = pat.id 
       WHERE p.id = ? AND pat.nutritionist_id = ?`,
      [planId, nutritionistId]
    );

    if (plan.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    await connection.query(
      'UPDATE meal_plans SET meal_data = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(mealData), planId]
    );

    connection.release();
    res.json({ message: 'Plano atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
};
