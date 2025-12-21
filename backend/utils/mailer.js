// backend/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASS,
  },
});

const sendWelcomeEmail = (to, username) => {
  transporter.sendMail({
    from: '"MoodAI" <no-reply@moodai.app>',
    to,
    subject: "Welcome to MoodAI!",
    html: `
      <h2>Hello ${username}!</h2>
      <p>We're so glad you're here. MoodAI is your personal wellness companion.</p>
      <p>Start chatting anytime — we're always listening.</p>
      <br>
      <p>With care,<br>The MoodAI Team</p>
    `,
  });
};

const sendSessionSummary = (to, username, mood, response) => {
  transporter.sendMail({
    from: '"MoodAI" <no-reply@moodai.app>',
    to,
    subject: "Your MoodAI Session Summary",
    html: `
      <h2>Hi ${username},</h2>
      <p>Here's a quick recap of your session:</p>
      <blockquote><strong>Detected mood:</strong> ${mood}</blockquote>
      <p><strong>MoodAI said:</strong><br>${response}</p>
      <p>Take care of yourself — you're doing great!</p>
      <br>
      <p>Warmly,<br>MoodAI</p>
    `,
  });
};

module.exports = { sendWelcomeEmail, sendSessionSummary };