import express from 'express';
import mongoose from 'mongoose';
import URL from '../models/URL.js';
import Category from '../models/Category.js';
import { authenticate } from '../middleware/auth.js';
import { getLinkPreview } from '../utils/linkPreview.js';

const router = express.Router();
const DEFAULT_CATEGORY = 'uncategorized';

const normalizeCategoryName = (value) => {
  const normalized = (value || '').trim();
  return normalized || DEFAULT_CATEGORY;
};

// Create URL
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, url, description, category, tags } = req.body;
    const preview = await getLinkPreview(url);
    const normalizedCategory = normalizeCategoryName(category);

    const newUrl = new URL({
      userId: req.userId,
      title,
      url: preview.normalizedUrl || url,
      description,
      category: normalizedCategory,
      tags: tags || [],
      thumbnail: preview.thumbnail || undefined,
      domain: preview.domain,
    });

    await newUrl.save();
    if (normalizedCategory !== DEFAULT_CATEGORY) {
      await Category.findOneAndUpdate(
        { userId: req.userId, name: normalizedCategory },
        { $setOnInsert: { userId: req.userId, name: normalizedCategory } },
        { upsert: true, new: true }
      );
    }
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

    const urls = await URL.find(query).sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 });

    const enrichedUrls = await Promise.all(
      urls.map(async (item) => {
        if (item.thumbnail) {
          return item;
        }

        const preview = await getLinkPreview(item.url);
        if (!preview.thumbnail) {
          return item;
        }

        item.thumbnail = preview.thumbnail;
        if (item.domain === 'unknown' || !item.domain) {
          item.domain = preview.domain;
        }
        await item.save();
        return item;
      })
    );

    res.json(enrichedUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category stats for user
router.get('/categories', authenticate, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    const categoriesFromUrls = await URL.aggregate([
      {
        $match: {
          userId: userObjectId,
        },
      },
      {
        $project: {
          category: {
            $trim: {
              input: {
                $ifNull: ['$category', 'uncategorized'],
              },
            },
          },
        },
      },
      {
        $project: {
          category: {
            $cond: [{ $eq: ['$category', ''] }, 'uncategorized', '$category'],
          },
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          count: 1,
        },
      },
      {
        $sort: {
          count: -1,
          name: 1,
        },
      },
    ]);

    const storedCategories = await Category.find({ userId: req.userId }).select('name -_id').lean();
    const categoryMap = new Map();

    for (const category of storedCategories) {
      categoryMap.set(normalizeCategoryName(category.name), 0);
    }
    for (const category of categoriesFromUrls) {
      categoryMap.set(normalizeCategoryName(category.name), category.count);
    }
    if (!categoryMap.has(DEFAULT_CATEGORY)) {
      categoryMap.set(DEFAULT_CATEGORY, 0);
    }

    const categories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (a.name === DEFAULT_CATEGORY) return -1;
        if (b.name === DEFAULT_CATEGORY) return 1;
        return b.count - a.count || a.name.localeCompare(b.name);
      });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category
router.post('/categories', authenticate, async (req, res) => {
  try {
    const normalizedName = normalizeCategoryName(req.body?.name);
    if (normalizedName === DEFAULT_CATEGORY) {
      return res.status(200).json({ name: DEFAULT_CATEGORY, count: 0 });
    }

    await Category.findOneAndUpdate(
      { userId: req.userId, name: normalizedName },
      { $setOnInsert: { userId: req.userId, name: normalizedName } },
      { upsert: true, new: true }
    );

    res.status(201).json({ name: normalizedName, count: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rename category
router.patch('/categories/:name', authenticate, async (req, res) => {
  try {
    const currentName = normalizeCategoryName(req.params.name);
    const nextName = normalizeCategoryName(req.body?.name);

    if (currentName === DEFAULT_CATEGORY) {
      return res.status(400).json({ error: 'Default category cannot be renamed' });
    }

    if (nextName === DEFAULT_CATEGORY) {
      return res.status(400).json({ error: 'Cannot rename a category to uncategorized' });
    }

    if (currentName === nextName) {
      return res.json({ name: currentName });
    }

    const existingTarget = await Category.findOne({ userId: req.userId, name: nextName });
    if (existingTarget) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    const category = await Category.findOneAndUpdate(
      { userId: req.userId, name: currentName },
      { name: nextName },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await URL.updateMany({ userId: req.userId, category: currentName }, { category: nextName });

    res.json({ name: category.name });
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
    const { title, description, category, tags, isFavorite, url: incomingUrl } = req.body;
    const normalizedCategory = normalizeCategoryName(category);

    let previewUpdate = {};
    if (incomingUrl) {
      const preview = await getLinkPreview(incomingUrl);
      previewUpdate = {
        url: preview.normalizedUrl || incomingUrl,
        thumbnail: preview.thumbnail || undefined,
        domain: preview.domain,
      };
    }

    const updatedUrl = await URL.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title, description, category: normalizedCategory, tags, isFavorite, ...previewUpdate },
      { new: true }
    );

    if (!updatedUrl) {
      return res.status(404).json({ error: 'URL not found' });
    }

    if (normalizedCategory !== DEFAULT_CATEGORY) {
      await Category.findOneAndUpdate(
        { userId: req.userId, name: normalizedCategory },
        { $setOnInsert: { userId: req.userId, name: normalizedCategory } },
        { upsert: true, new: true }
      );
    }

    res.json(updatedUrl);
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

// Toggle pin
router.patch('/:id/pin', authenticate, async (req, res) => {
  try {
    const url = await URL.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    url.isPinned = !url.isPinned;
    url.pinnedAt = url.isPinned ? new Date() : null;
    await url.save();

    res.json(url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
