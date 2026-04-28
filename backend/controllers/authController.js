const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { analyzeLawyer } = require('../utils/fraudDetector');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, specializations, barCouncilId, experience, consultationFee, bio, location } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Create user
    const userData = { name, email, password, role: role || 'client', phone };

    // Add lawyer-specific fields
    if (role === 'lawyer') {
      userData.specializations = specializations || [];
      userData.barCouncilId = barCouncilId || '';
      userData.experience = experience || 0;
      userData.consultationFee = consultationFee || 0;
      userData.bio = bio || '';
      userData.location = location || '';
      userData.isVerified = false; // Lawyers need admin verification

      // Fraud Detection for lawyers
      const fraudAnalysis = analyzeLawyer(userData);
      if (fraudAnalysis.isFlagged) {
        userData.isFlagged = true;
        userData.flagReason = fraudAnalysis.reason;
      }
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    console.log(`Password match for ${email}: ${isMatch}`);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        specializations: user.specializations,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, location, specializations, experience, consultationFee } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (bio) updateData.bio = bio;
    if (location) updateData.location = location;
    if (specializations) updateData.specializations = specializations;
    if (experience !== undefined) updateData.experience = experience;
    if (consultationFee !== undefined) updateData.consultationFee = consultationFee;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true
    });

    // Re-run fraud detection on update if they are a lawyer
    if (user.role === 'lawyer') {
      const fraudAnalysis = analyzeLawyer(user);
      if (fraudAnalysis.isFlagged) {
        user.isFlagged = true;
        user.flagReason = fraudAnalysis.reason;
        await user.save();
      } else if (user.isFlagged) {
        // If they fixed the issue, we don't auto-unflag, but we could update the reason
      }
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user by ID (basic info)
// @route   GET /api/auth/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email role isVerified specializations');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

