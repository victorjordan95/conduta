const { Resend } = require('resend');

let _resend = null;
function getClient() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

async function sendVerificationEmail(to, nome, token) {
  const FROM = process.env.EMAIL_FROM || 'Conduta <onboarding@resend.dev>';
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await getClient().emails.send({
    from: FROM,
    to: [to],
    subject: 'Confirme seu email — Conduta',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#1a6b73;margin-bottom:8px">Olá, ${nome}</h2>
        <p style="color:#333;line-height:1.6">
          Clique no botão abaixo para confirmar seu email e acessar o Conduta:
        </p>
        <a href="${url}"
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:#1a6b73;
                  color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px">
          Confirmar email
        </a>
        <p style="color:#888;font-size:13px">
          O link expira em 24 horas.<br>
          Se você não criou uma conta no Conduta, ignore este email.<br><br>
          Dúvidas? Fale com a gente: <a href="mailto:app.conduta@gmail.com" style="color:#1a6b73">app.conduta@gmail.com</a>
        </p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(to, nome, token) {
  const FROM = process.env.EMAIL_FROM || 'Conduta <onboarding@resend.dev>';
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await getClient().emails.send({
    from: FROM,
    to: [to],
    subject: 'Redefinição de senha — Conduta',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#1a6b73;margin-bottom:8px">Olá, ${nome}</h2>
        <p style="color:#333;line-height:1.6">
          Recebemos uma solicitação para redefinir a senha da sua conta no Conduta.
          Clique no botão abaixo para continuar:
        </p>
        <a href="${url}"
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:#1a6b73;
                  color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px">
          Redefinir senha
        </a>
        <p style="color:#888;font-size:13px">
          O link expira em 1 hora.<br>
          Se você não solicitou a redefinição, ignore este email.<br><br>
          Dúvidas? Fale com a gente: <a href="mailto:app.conduta@gmail.com" style="color:#1a6b73">app.conduta@gmail.com</a>
        </p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
