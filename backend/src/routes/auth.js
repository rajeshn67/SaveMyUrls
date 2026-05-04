import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const formatUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  location: user.location,
  bio: user.bio,
  role: user.role,
  website: user.website,
  phone: user.phone,
  timezone: user.timezone,
  socialHandle: user.socialHandle,
  avatar: user.avatar,
  subscription: user.subscription,
  categories: user.categories,
  createdAt: user.createdAt,
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      fullName,
      email,
      password,
    });

    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { fullName, location, bio, role, website, phone, timezone, socialHandle } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { fullName, location, bio, role, website, phone, timezone, socialHandle },
      { new: true }
    );
    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user?.password) {
      return res.status(400).json({ error: 'Password login is not enabled for this account' });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await User.findOne({ email });
    res.json({ message: 'If an account exists, a password reset link will be sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload avatar
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({ error: 'Cloudinary is not configured on server' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'savemyurls/avatars', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar: uploadResult.secure_url },
      { new: true }
    );

    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
