// backend/src/controllers/passwordController.js
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log("Forgot password request for:", req.body.email);
  const user = await User.findOne({ email });
  console.log("User found:", user ? "Yes" : "No");
  if (!user) {
    return res.json({ message: "If account exists, reset link sent" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 min
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/updatepassword?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  try {
    await transporter.sendMail({
      to: user.email,
      subject: "Reset your password",
      html: `<p>Click to reset password:</p>
           <a href="${resetUrl}">${resetUrl}</a>`,
    });
    console.log("Email sent successfully");
  } catch (err) {
    console.error("Error sending email:", err);
    return res.status(500).json({ message: "Failed to send email" });
  }

  res.json({ message: "Reset link sent" });
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password = await bcrypt.hash(password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.json({ message: "Password updated successfully" });
};
