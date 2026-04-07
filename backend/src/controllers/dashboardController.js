// Dashboard Controller - Estatísticas e gráficos
const pool = require('../config/database');

function enrichPatient(p) {
  let age = 0;
  if (p.birth_date) {
    age = Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31557600000);
  }
  const weight = parseFloat(p.weight_kg) || 0;
  const heightM = parseFloat(p.height_cm) || 0;
  const imc = (weight > 0 && heightM > 0) ? parseFloat((weight / (heightM * heightM)).toFixed(2)) : 0;
  return {
    id: p.id,
    name: p.full_name,
    age,
    weight,
    height: heightM,
    imc,
    goal: p.goal_summary || 'Sem objetivo',
    created_at: p.created_at
  };
}

exports.getDashboardStats = async (req, res) => {
  try {
    const nutritionistId = req.userId;

    // Todas as queries em paralelo (sem N+1)
    const [patientRows, [plansRow], [todayRow], upcomingRows] = await Promise.all([
      pool.query(
        'SELECT id, full_name, birth_date, weight_kg, height_cm, goal_summary, created_at FROM patient WHERE nutritionist_id = ? ORDER BY created_at DESC',
        [nutritionistId]
      ).then(([r]) => r),
      pool.query(
        `SELECT COUNT(*) as total FROM meal_plans mp
         JOIN patient p ON p.id = mp.patient_id
         WHERE p.nutritionist_id = ? AND mp.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [nutritionistId]
      ).then(([r]) => r),
      pool.query(
        'SELECT COUNT(*) as total FROM consultation WHERE nutritionist_id = ? AND DATE(starts_at) = CURDATE() AND status != ?',
        [nutritionistId, 'CANCELLED']
      ).then(([r]) => r),
      pool.query(
        `SELECT c.id, c.starts_at, c.title, c.status, p.full_name as patient_name
         FROM consultation c JOIN patient p ON p.id = c.patient_id
         WHERE c.nutritionist_id = ? AND c.starts_at >= NOW() AND c.status != ?
         ORDER BY c.starts_at ASC LIMIT 5`,
        [nutritionistId, 'CANCELLED']
      ).then(([r]) => r)
    ]);

    const activePlans = plansRow.total;
    const consultationsToday = todayRow.total;
    const upcomingConsultations = upcomingRows;

    const patientData = patientRows.map(enrichPatient);

    const stats = {
      summary: {
        totalPatients: patientData.length,
        activePlans,
        consultationsToday,
      },
      charts: {
        goalDistribution: calculateGoalDistribution(patientData),
        imcDistribution: calculateIMCDistribution(patientData),
        ageDistribution: calculateAgeDistribution(patientData),
        patientsByMonth: calculatePatientGrowth(patientData)
      },
      recentPatients: patientData.slice(0, 5),
      upcomingConsultations
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

function calculateGoalDistribution(patients) {
  const goals = {};
  patients.forEach(p => {
    const goal = p.goal || 'Sem objetivo';
    goals[goal] = (goals[goal] || 0) + 1;
  });
  return Object.entries(goals).map(([label, count]) => ({ label, count }));
}

function calculateIMCDistribution(patients) {
  const distribution = { 'Abaixo do peso': 0, 'Normal': 0, 'Sobrepeso': 0, 'Obeso': 0 };
  patients.forEach(p => {
    const imc = p.imc;
    if (imc <= 0) return;
    if (imc < 18.5) distribution['Abaixo do peso']++;
    else if (imc < 25) distribution['Normal']++;
    else if (imc < 30) distribution['Sobrepeso']++;
    else distribution['Obeso']++;
  });
  return distribution;
}

function calculateAgeDistribution(patients) {
  const distribution = { '18-25': 0, '26-35': 0, '36-45': 0, '46-60': 0, '60+': 0 };
  patients.forEach(p => {
    const age = p.age;
    if (age < 26) distribution['18-25']++;
    else if (age < 36) distribution['26-35']++;
    else if (age < 46) distribution['36-45']++;
    else if (age <= 60) distribution['46-60']++;
    else distribution['60+']++;
  });
  return distribution;
}

function calculatePatientGrowth(patients) {
  const months = {};
  patients.forEach(p => {
    const date = new Date(p.created_at);
    const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
    months[monthKey] = (months[monthKey] || 0) + 1;
  });
  return Object.entries(months)
    .sort((a, b) => new Date(`01/${a[0]}`) - new Date(`01/${b[0]}`))
    .map(([month, count]) => ({ month, count }));
}

exports.getPatientAdvancedStats = async (req, res) => {
  try {
    const { patientId } = req.params;
    const nutritionistId = req.userId;

    const [patientRows] = await pool.query(
      'SELECT id, full_name, birth_date, weight_kg, height_cm, goal_summary, created_at FROM patient WHERE id = ? AND nutritionist_id = ?',
      [patientId, nutritionistId]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    // Queries em paralelo
    const [plans, reports, consultations] = await Promise.all([
      pool.query(
        'SELECT id, patient_id, meal_data, created_at FROM meal_plans WHERE patient_id = ? ORDER BY created_at DESC LIMIT 5',
        [patientId]
      ).then(([r]) => r),
      pool.query(
        'SELECT id, patient_id, type, period, created_at FROM reports WHERE patient_id = ? ORDER BY created_at DESC LIMIT 10',
        [patientId]
      ).then(([r]) => r),
      pool.query(
        'SELECT id, patient_id, starts_at, ends_at, title, status, notes FROM consultation WHERE patient_id = ? ORDER BY starts_at DESC LIMIT 10',
        [patientId]
      ).then(([r]) => r)
    ]);

    res.json({
      patient: enrichPatient(patientRows[0]),
      recentPlans: plans,
      recentReports: reports,
      recentConsultations: consultations
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do paciente:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};
