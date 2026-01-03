const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendWelcomeEmail = async (email, username) => {
  const mailOptions = {
    from: `"MoodAI Wellness 🌿" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to MoodAI - Your Wellness Journey Starts Here',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #e0f7fa 0%, #80deea 100%); margin: 0; padding: 40px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 32px; }
          .content { padding: 40px; }
          .content h2 { color: #10b981; margin-top: 0; }
          .content p { color: #374151; line-height: 1.8; font-size: 16px; }
          .features { background: #f0fdfa; padding: 24px; border-radius: 16px; margin: 24px 0; }
          .features li { color: #047857; margin: 12px 0; }
          .cta { text-align: center; margin: 32px 0; }
          .cta a { background: #10b981; color: white; padding: 16px 48px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; }
          .footer { text-align: center; padding: 24px; background: #f9fafb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌿 Welcome to MoodAI</h1>
          </div>
          <div class="content">
            <h2>Hi ${username}, Welcome Aboard!</h2>
            <p>We're thrilled to have you join our wellness community. MoodAI is here to support your mental and emotional wellbeing with AI-powered insights and personalized recommendations.</p>
            
            <div class="features">
              <h3>What You Can Do:</h3>
              <ul>
                <li>💬 Chat with our AI wellness companion anytime</li>
                <li>📊 Track your mood journey with beautiful visualizations</li>
                <li>🎯 Get personalized recommendations based on your mood</li>
                <li>🧘 Book 1-on-1 sessions with certified consultants</li>
                <li>🌱 Access curated wellness content (games, articles, exercises)</li>
              </ul>
            </div>

            <p><strong>Your Account Details:</strong><br>
            Email: ${email}<br>
            Username: ${username}<br>
            Created: ${new Date().toLocaleDateString()}</p>

            <div class="cta">
              <a href="http://localhost:5173/login">Start Your Wellness Journey</a>
            </div>

            <p style="margin-top: 32px; font-size: 14px; color: #6b7280;">
              💡 <strong>Pro Tip:</strong> Start by having a conversation with our AI. It will detect your mood and provide personalized support!
            </p>
          </div>
          <div class="footer">
            <p>MoodAI - Corporate Wellness, Reimagined 🌿</p>
            <p>Need help? Reply to this email or visit our dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

const sendConsultationEmail = async (email, username, bookingDetails) => {
  const mailOptions = {
    from: `"MoodAI Consultations 🩺" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Consultation Booking Confirmed - MoodAI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); margin: 0; padding: 40px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px; }
          .booking-card { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 24px; border-radius: 12px; margin: 24px 0; }
          .booking-card p { margin: 8px 0; color: #92400e; }
          .booking-card strong { color: #78350f; }
          .footer { text-align: center; padding: 24px; background: #f9fafb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            <p>Your 1-on-1 wellness consultation has been successfully booked. Our certified consultant will reach out to you within 24 hours to schedule your session.</p>
            
            <div class="booking-card">
              <h3 style="margin-top: 0; color: #92400e;">📋 Booking Details</h3>
              <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
              <p><strong>Amount Paid:</strong> ₹${bookingDetails.amount}</p>
              <p><strong>Payment ID:</strong> ${bookingDetails.paymentId}</p>
              <p><strong>Date:</strong> ${new Date(bookingDetails.date).toLocaleString()}</p>
            </div>

            <p>Our consultant will contact you at <strong>${email}</strong> to confirm your preferred time slot.</p>

            <p style="margin-top: 32px; font-size: 14px; color: #6b7280;">
              💡 <strong>Before Your Session:</strong><br>
              - Prepare any topics or concerns you'd like to discuss<br>
              - Find a quiet, comfortable space for your call<br>
              - Have a notepad ready for key takeaways
            </p>
          </div>
          <div class="footer">
            <p>Sukoon AI - Your Partner in Wellness 🌿</p>
            <p>Questions? Reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Consultation email sent to ${email}`);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

module.exports = { sendWelcomeEmail, sendConsultationEmail };