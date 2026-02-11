const nodemailer = require('nodemailer');

// Create transporter only if credentials are available
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // ✅ Verify connection ONCE at startup
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email transporter error:', error.message || error);
    } else {
      console.log('✅ Email transporter ready');
    }
  });
} else {
  console.warn('⚠️  Email credentials not configured. Email functionality will be disabled.');
  console.warn('   Please set EMAIL_USER and EMAIL_PASSWORD in your .env file');
}

// 🔐 Temporary password generator
const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// 📧 Send credentials email
const sendCredentialsEmail = async (email, username, temporaryPassword, role) => {
  // Guard: email service not configured
  if (!transporter) {
    console.warn('⚠️  Email credentials not configured. Skipping email send.');
    return {
      success: false,
      error: 'Email service not configured'
    };
  }

  // Use EMAIL_FROM if set, otherwise fallback to EMAIL_USER
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!fromEmail) {
    return {
      success: false,
      error: 'Email sender not configured. Please set EMAIL_FROM or EMAIL_USER in .env file'
    };
  }

  const mailOptions = {
    from: `"EV Platform" <${fromEmail}>`,
    to: email,
    subject: 'Welcome to EV Platform - Your Login Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Welcome to EV Platform</h2>
        <p>Your account has been created successfully.</p>

        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        <p><strong>Role:</strong> ${role}</p>

        <p style="color: red;">
          <strong>Please change your password on first login.</strong>
        </p>

        <p>
          Login here:
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">
            ${process.env.FRONTEND_URL || 'http://localhost:3000'}
          </a>
        </p>

        <p>— EV Platform Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendCredentialsEmail,
  generateTemporaryPassword
};
