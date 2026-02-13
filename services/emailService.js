const nodemailer = require("nodemailer");

/* =========================================================
   TRANSPORT CONFIG
========================================================= */

let transporter = null;

if (
  process.env.EMAIL_HOST &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD
) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log("📧 Email transporter initialized");
} else {
  console.warn("⚠ Email transporter NOT configured");
}

/* =========================================================
   PASSWORD GENERATOR
========================================================= */

function generateTemporaryPassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let password = "";

  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

/* =========================================================
   BASE EMAIL TEMPLATE
========================================================= */

function buildEmailTemplate(title, bodyContent) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;
                background:#f6f9fc;
                padding:40px 20px;">
      <div style="max-width:600px;
                  margin:auto;
                  background:#ffffff;
                  border-radius:16px;
                  padding:32px;
                  box-shadow:0 20px 40px rgba(0,0,0,0.08);">

        <h2 style="margin-bottom:20px;color:#111827;">
          ${title}
        </h2>

        <div style="font-size:14px;line-height:1.6;color:#374151;">
          ${bodyContent}
        </div>

        <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb;">

        <p style="font-size:12px;color:#9ca3af;">
          AXO Networks — EV B2B Marketplace
        </p>
      </div>
    </div>
  `;
}

/* =========================================================
   NEW USER CREDENTIALS EMAIL
========================================================= */

async function sendCredentialsEmail(email, username, password, role) {

  if (!transporter) return;

  const loginUrl =
    process.env.FRONTEND_URL || "https://axonetworks.com/login";

  const body = `
    <p>Your account has been approved on <strong>AXO Networks</strong>.</p>

    <p><strong>Username:</strong> ${username}</p>
    <p><strong>Temporary Password:</strong> ${password}</p>
    <p><strong>Role:</strong> ${role}</p>

    <p style="margin-top:20px;color:#dc2626;">
      Please change your password immediately after first login.
    </p>

    <p style="margin-top:20px;">
      <a href="${loginUrl}"
         style="display:inline-block;
                padding:10px 18px;
                background:#2563eb;
                color:white;
                text-decoration:none;
                border-radius:8px;">
        Login to AXO
      </a>
    </p>
  `;

  await transporter.sendMail({
    from: `"AXO Networks" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your AXO Networks Account Has Been Approved",
    html: buildEmailTemplate("Welcome to AXO Networks", body),
    text: `Your account has been approved.
Username: ${username}
Temporary Password: ${password}
Login: ${loginUrl}`
  });

  console.log("📧 Credentials email sent to:", email);
}

/* =========================================================
   APPROVAL NOTIFICATION (Existing User)
========================================================= */

async function sendApprovalNotification(email) {

  if (!transporter) return;

  const loginUrl =
    process.env.FRONTEND_URL || "https://axonetworks.com/login";

  const body = `
    <p>Your network access request has been approved.</p>

    <p>You can now log in and access the AXO Networks platform.</p>

    <p style="margin-top:20px;">
      <a href="${loginUrl}"
         style="display:inline-block;
                padding:10px 18px;
                background:#16a34a;
                color:white;
                text-decoration:none;
                border-radius:8px;">
        Access Dashboard
      </a>
    </p>
  `;

  await transporter.sendMail({
    from: `"AXO Networks" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "AXO Networks Access Approved",
    html: buildEmailTemplate("Access Approved", body),
    text: `Your access has been approved.
Login here: ${loginUrl}`
  });

  console.log("📧 Approval notification sent to:", email);
}

/* =========================================================
   QUOTE SUBMISSION NOTIFICATION (Buyer Alert)
========================================================= */

async function sendQuoteNotificationToBuyer(
  buyerEmail,
  rfqId,
  supplierEmail
) {

  if (!transporter) return;

  const rfqUrl =
    `${process.env.FRONTEND_URL}/frontend/rfq-detail.html?id=${rfqId}`;

  const body = `
    <p>A supplier has submitted a quote for your RFQ.</p>

    <p><strong>RFQ ID:</strong> ${rfqId}</p>
    <p><strong>Supplier:</strong> ${supplierEmail}</p>

    <p style="margin-top:20px;">
      <a href="${rfqUrl}"
         style="display:inline-block;
                padding:10px 18px;
                background:#2563eb;
                color:white;
                text-decoration:none;
                border-radius:8px;">
        Review Quote
      </a>
    </p>
  `;

  await transporter.sendMail({
    from: `"AXO Networks" <${process.env.EMAIL_USER}>`,
    to: buyerEmail,
    subject: `New Quote Submitted for RFQ #${rfqId}`,
    html: buildEmailTemplate("New Quote Received", body),
    text: `A supplier submitted a quote for RFQ #${rfqId}.
Supplier: ${supplierEmail}
View RFQ: ${rfqUrl}`
  });

  console.log("📧 Quote notification sent to:", buyerEmail);
}

/* =========================================================
   EXPORTS (FIXED)
========================================================= */

module.exports = {
  generateTemporaryPassword,
  sendCredentialsEmail,
  sendApprovalNotification,
  sendQuoteNotificationToBuyer
};