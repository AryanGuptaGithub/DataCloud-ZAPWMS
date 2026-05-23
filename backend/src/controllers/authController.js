const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// POST /auth/register
exports.register = async (req, res) => {
  const { email, password, name } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
  });

  res.status(201).json({
    token: signToken(user._id),
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  });
};

// POST /auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({
    token: signToken(user._id),
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, company, location } = req.body;
 
    const allowed = {};
    if (name     !== undefined) allowed.name     = name.trim();
    if (phone    !== undefined) allowed.phone    = phone.trim();
    if (company  !== undefined) allowed.company  = company.trim();
    if (location !== undefined) allowed.location = location.trim();
 
    if (Object.keys(allowed).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
 
    const user = await User.findByIdAndUpdate(
      req.user._id,
      allowed,
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires");
 
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
 
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
 
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both currentPassword and newPassword are required" });
    }
 
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
 
    // Fetch user WITH password (select: false in schema so must be explicit)
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
 
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
 
    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();
 
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};








