const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

function generateTemporaryPassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendCredentialsEmail(email, username, password, role) {
  if (!transporter) {
    console.warn("Email not configured.");
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to AXO Networks",
    html: `
      <h2>Welcome to AXO Networks</h2>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Temporary Password:</strong> ${password}</p>
      <p><strong>Role:</strong> ${role}</p>
      <p style="color:red;">
        Please change your password after first login.
      </p>
      <p>Login: ${process.env.FRONTEND_URL}</p>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  sendCredentialsEmail,
  generateTemporaryPassword
};
