const nodemailer = require('nodemailer');

// Configuração do transportador de email
// Em produção, use um serviço real (Gmail, SendGrid, AWS SES, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const FROM_NAME = process.env.EMAIL_FROM_NAME || 'NutriApp';
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@nutriapp.com';
const APP_URL = process.env.APP_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:5500');

function getEmailTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#F5F3EF;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#4A9B5F;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🌿 NutriApp</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Plataforma de gestão nutricional</p>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="padding:20px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9CA3AF;">Este email foi enviado automaticamente. Não responda.</p>
      <p style="margin:4px 0 0;font-size:11px;color:#9CA3AF;">© ${new Date().getFullYear()} NutriApp</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendVerificationEmail(toEmail, toName, token) {
  const verifyUrl = `${APP_URL}/?action=verify&token=${token}`;

  const html = getEmailTemplate(`
    <h2 style="margin:0 0 8px;color:#1F2937;font-size:18px;">Confirme seu email</h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Olá <strong>${toName}</strong>,<br/>
      Obrigado por se cadastrar no NutriApp! Clique no botão abaixo para ativar sua conta:
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:#4A9B5F;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
        ✅ Confirmar meu email
      </a>
    </div>
    <p style="color:#9CA3AF;font-size:12px;">Este link expira em <strong>24 horas</strong>.</p>
    <p style="color:#9CA3AF;font-size:12px;">Se você não criou esta conta, ignore este email.</p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;"/>
    <p style="color:#9CA3AF;font-size:11px;">Caso o botão não funcione, copie e cole este link:<br/>
    <span style="color:#4A9B5F;word-break:break-all;">${verifyUrl}</span></p>
  `);

  return sendEmail(toEmail, 'Confirme seu email — NutriApp', html);
}

async function sendPasswordResetEmail(toEmail, toName, token) {
  const resetUrl = `${APP_URL}/?action=reset&token=${token}`;

  const html = getEmailTemplate(`
    <h2 style="margin:0 0 8px;color:#1F2937;font-size:18px;">Redefinir sua senha</h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Olá <strong>${toName}</strong>,<br/>
      Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo:
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#F59E0B;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
        🔑 Redefinir senha
      </a>
    </div>
    <p style="color:#9CA3AF;font-size:12px;">Este link expira em <strong>1 hora</strong>.</p>
    <p style="color:#9CA3AF;font-size:12px;">Se você não solicitou a redefinição, ignore este email. Sua senha permanecerá inalterada.</p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;"/>
    <p style="color:#9CA3AF;font-size:11px;">Caso o botão não funcione, copie e cole este link:<br/>
    <span style="color:#F59E0B;word-break:break-all;">${resetUrl}</span></p>
  `);

  return sendEmail(toEmail, 'Redefinir senha — NutriApp', html);
}

async function sendEmail(to, subject, html) {
  // Em desenvolvimento sem SMTP configurado, loga no console
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('═══════════════════════════════════════════════');
    console.log('📧 EMAIL (dev mode - SMTP não configurado)');
    console.log('Para:', to);
    console.log('Assunto:', subject);
    // Extrair link do HTML
    const linkMatch = html.match(/href="([^"]*action=[^"]*)"/);
    if (linkMatch) {
      console.log('🔗 Link:', linkMatch[1]);
    }
    console.log('═══════════════════════════════════════════════');
    return { messageId: 'dev-' + Date.now(), devMode: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html
    });
    console.log('✅ Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmail
};
