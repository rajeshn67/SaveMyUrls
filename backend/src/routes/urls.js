import express from 'express';
import URL from '../models/URL.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create URL
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, url, description, category, tags } = req.body;

    const newUrl = new URL({
      userId: req.userId,
      title,
      url,
      description,
      category: category || 'uncategorized',
      tags: tags || [],
    });

    await newUrl.save();
    res.status(201).json(newUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all URLs for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, search, isFavorite } = req.query;
    let query = { userId: req.userId };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (isFavorite === 'true') {
      query.isFavorite = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
      ];
    }

    const urls = await URL.find(query).sort({ createdAt: -1 });
    res.json(urls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single URL
router.get('/:id', authenticate, async (req, res) => {
  try {
    const url = await URL.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json(url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update URL
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, category, tags, isFavorite } = req.body;

    const url = await URL.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title, description, category, tags, isFavorite },
      { new: true }
    );

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json(url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete URL
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const url = await URL.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle favorite
router.patch('/:id/favorite', authenticate, async (req, res) => {
  try {
    const url = await URL.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    url.isFavorite = !url.isFavorite;
    await url.save();

    res.json(url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
