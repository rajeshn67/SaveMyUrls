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
  avatar: user.avatar,
  subscription: user.subscription,
  categories: user.categories,
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
    const { fullName, location } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { fullName, location },
      { new: true }
    );
    res.json(formatUserResponse(user));
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
