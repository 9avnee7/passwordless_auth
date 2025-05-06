const nodemailer=require('nodemailer')
require('dotenv').config()

console.log(process.env.EMAIL_USER)
console.log(process.env.EMAIL_PASS)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,      // Your Gmail address
    pass: process.env.EMAIL_PASS,      // Your App Password
  },
});

const sendOTPEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"Authentication 🔐" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your One-Time Password (OTP)',
    html: `
      <div style="font-family:sans-serif;">
        <h2>Hello 👋,</h2>
        <p>Your OTP for backup authentication is:</p>
        <h1 style="color:#333;">${otp}</h1>
        <p>This OTP will expire in 5 minutes. If you didn’t request it, please ignore.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return false;
  }
};


module.exports={sendOTPEmail}