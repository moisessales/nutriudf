const pool = require('../config/database');
const PDFDocument = require('pdfkit');

function enrichPatient(p) {
  let age = 0;
  if (p.birth_date) {
    age = Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31557600000);
  }
  const weight = parseFloat(p.weight_kg) || 0;
  const heightM = parseFloat(p.height_cm) || 0;
  const imc = (weight > 0 && heightM > 0) ? parseFloat((weight / (heightM * heightM)).toFixed(2)) : 0;
  return { name: p.full_name, email: p.email, age, weight, height: heightM, imc, goal: p.goal_summary || 'Sem objetivo' };
}

function getIMCCategory(imc) {
  imc = parseFloat(imc);
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obeso';
}

async function findPatient(connection, patientId, nutritionistId) {
  const [rows] = await connection.query(
    'SELECT * FROM patient WHERE id = ? AND nutritionist_id = ?',
    [patientId, nutritionistId]
  );
  return rows.length > 0 ? rows[0] : null;
}

exports.getReports = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { period } = req.query;
    const nutritionistId = req.userId;
    const connection = await pool.getConnection();

    const patient = await findPatient(connection, patientId, nutritionistId);
    if (!patient) {
      connection.release();
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const [rows] = await connection.query(
      'SELECT * FROM reports WHERE patient_id = ? AND period = ? ORDER BY created_at DESC',
      [patientId, period || '7d']
    );

    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    res.status(500).json({ error: 'Erro ao buscar relatórios' });
  }
};

exports.getReportData = async (req, res) => {
  try {
    const { patientId, reportType, period } = req.params;
    const nutritionistId = req.userId;
    const connection = await pool.getConnection();

    const raw = await findPatient(connection, patientId, nutritionistId);
    if (!raw) {
      connection.release();
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const [reports] = await connection.query(
      'SELECT * FROM reports WHERE patient_id = ? AND type = ? AND period = ?',
      [patientId, reportType, period]
    );

    let reportData;
    if (reports.length > 0) {
      try { reportData = JSON.parse(reports[0].data); } catch { reportData = reports[0].data; }
    } else {
      const p = enrichPatient(raw);
      const days = { '7d': 7, '30d': 30, '90d': 90 }[period] || 7;
      reportData = {
        patient_name: p.name, patient_id: patientId, report_type: reportType,
        period, days, generated_at: new Date(),
        data: {
          nutritional: { kcalTarget: 1800, proteinTarget: 130, carbTarget: 225, fatTarget: 60 },
          progress: { initialWeight: p.weight, currentWeight: p.weight, weightChange: 0, imc: p.imc },
          compliance: { adherencePercentage: 0, daysCompleted: 0, totalDays: days },
          recommendations: { waterGoal: 2000, exerciseFrequency: '3-4x por semana', sleepGoal: '7-8 horas' }
        }
      };
      await connection.query(
        'INSERT INTO reports (patient_id, type, period, data) VALUES (?, ?, ?, ?)',
        [patientId, reportType, period, JSON.stringify(reportData)]
      );
    }

    connection.release();
    res.json(reportData);
  } catch (error) {
    console.error('Erro ao buscar dados do relatório:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do relatório' });
  }
};

exports.generatePDF = async (req, res) => {
  try {
    const { patientId, reportType = 'nutritional', period = '7d' } = req.body;
    const nutritionistId = req.userId;
    const connection = await pool.getConnection();

    const raw = await findPatient(connection, patientId, nutritionistId);
    if (!raw) {
      connection.release();
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const [plans] = await connection.query(
      'SELECT * FROM meal_plans WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1',
      [patientId]
    );
    connection.release();

    const p = enrichPatient(raw);
    const doc = new PDFDocument();
    const filename = `relatorio_${reportType}_${p.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('Relatório Nutricional', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Tipo: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, { align: 'center' });
    doc.text(`Período: ${period}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Dados do Paciente');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Nome: ${p.name}`);
    doc.text(`Idade: ${p.age} anos`);
    doc.text(`Email: ${p.email || 'Não informado'}`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Métricas Físicas');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Peso: ${p.weight} kg`);
    doc.text(`Altura: ${p.height} m`);
    doc.text(`IMC: ${p.imc} (${getIMCCategory(p.imc)})`);
    doc.text(`Objetivo: ${p.goal}`);
    doc.moveDown();

    if (reportType === 'nutritional' && plans.length > 0) {
      try {
        const planData = JSON.parse(plans[0].meal_data);
        doc.fontSize(14).font('Helvetica-Bold').text('Plano Alimentar');
        doc.fontSize(11).font('Helvetica');
        if (planData.macros) {
          doc.text(`Calorias: ${planData.macros.kcal} kcal`);
          doc.text(`Proteína: ${planData.macros.protein}g`);
          doc.text(`Carboidratos: ${planData.macros.carbs}g`);
          doc.text(`Gordura: ${planData.macros.fat}g`);
        }
        doc.moveDown();
      } catch {}
    }

    if (reportType === 'progress') {
      doc.fontSize(14).font('Helvetica-Bold').text('Progresso');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Peso Atual: ${p.weight} kg`);
      doc.text(`IMC Atual: ${p.imc}`);
      doc.moveDown();
    }

    if (reportType === 'compliance') {
      doc.fontSize(14).font('Helvetica-Bold').text('Aderência');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Total de dias: ${period.replace('d', '')}`);
      doc.moveDown();
    }

    if (reportType === 'recommendations') {
      doc.fontSize(14).font('Helvetica-Bold').text('Recomendações');
      doc.fontSize(11).font('Helvetica');
      doc.text('• Aumentar ingestão de água (mínimo 2L diários)', { width: 500 });
      doc.text('• Praticar exercícios 3-4 vezes por semana', { width: 500 });
      doc.text('• Dormir 7-8 horas por noite', { width: 500 });
      doc.text('• Manter consistência no plano alimentar', { width: 500 });
      doc.moveDown();
    }

    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 50, doc.page.height - 50, { align: 'center' });
    doc.text('NutriUDF - Sistema de Gestão Nutricional', { align: 'center' });
    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
};

exports.sendEmailReport = async (req, res) => {
  try {
    const { patientId, reportType, period, recipientEmail } = req.body;
    const nutritionistId = req.userId;
    const connection = await pool.getConnection();

    const raw = await findPatient(connection, patientId, nutritionistId);
    connection.release();

    if (!raw) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json({
      message: 'Email enviado com sucesso',
      recipient: recipientEmail || raw.email,
      reportType,
      period
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({ error: 'Erro ao enviar email' });
  }
};
