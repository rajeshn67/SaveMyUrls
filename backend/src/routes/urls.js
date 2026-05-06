import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import URL from '../models/URL.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { getLinkPreview } from '../utils/linkPreview.js';

const router = express.Router();
const DEFAULT_CATEGORY = 'uncategorized';

const normalizeCategoryName = (value) => {
  const normalized = (value || '').trim();
  return normalized || DEFAULT_CATEGORY;
};

const sanitizeUrl = (url) => {
  const sanitized = url.toObject ? url.toObject() : { ...url };
  delete sanitized.secretPassword;
  return sanitized;
};

const createCategoryIfNeeded = async (userId, category) => {
  if (category === DEFAULT_CATEGORY) return;

  await Category.findOneAndUpdate(
    { userId, name: category },
    { $setOnInsert: { userId, name: category } },
    { upsert: true, new: true }
  );
};

const ensureVaultAccess = async (userId, password) => {
  const user = await User.findById(userId).select('+vaultPassword');

  if (!user) {
    return false;
  }

  if (!user.vaultPassword) {
    user.vaultPassword = await bcrypt.hash(password, 12);
    await user.save();
    return true;
  }

  return bcrypt.compare(password, user.vaultPassword);
};

// Create URL
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, url, description, category } = req.body;
    const preview = await getLinkPreview(url);
    const normalizedCategory = normalizeCategoryName(category);

    const newUrl = new URL({
      userId: req.userId,
      title,
      url: preview.normalizedUrl || url,
      description,
      category: normalizedCategory,
      thumbnail: preview.thumbnail || undefined,
      domain: preview.domain,
    });

    await newUrl.save();
    await createCategoryIfNeeded(req.userId, normalizedCategory);
    res.status(201).json(newUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create secret URL
router.post('/secret', authenticate, async (req, res) => {
  try {
    const { title, url, category, password } = req.body;
    const trimmedPassword = (password || '').trim();

    if (!trimmedPassword) {
      return res.status(400).json({ error: 'Vault password is required' });
    }

    const preview = await getLinkPreview(url);
    const normalizedCategory = normalizeCategoryName(category);
    const hasVaultAccess = await ensureVaultAccess(req.userId, trimmedPassword);

    if (!hasVaultAccess) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const secretPassword = await bcrypt.hash(trimmedPassword, 12);

    const secretUrl = new URL({
      userId: req.userId,
      title,
      url: preview.normalizedUrl || url,
      category: normalizedCategory,
      isSecret: true,
      secretPassword,
      thumbnail: preview.thumbnail || undefined,
      domain: preview.domain,
    });

    await secretUrl.save();

    res.status(201).json(sanitizeUrl(secretUrl));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlock secret URLs for user
router.post('/secret/unlock', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    const trimmedPassword = (password || '').trim();

    if (!trimmedPassword) {
      return res.status(400).json({ error: 'Vault password is required' });
    }

    const isPasswordValid = await ensureVaultAccess(req.userId, trimmedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const secretUrls = await URL.find({ userId: req.userId, isSecret: true }).sort({ createdAt: -1 });

    res.json(secretUrls.map(sanitizeUrl));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all URLs for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, search, isFavorite } = req.query;
    let query = { userId: req.userId, isSecret: { $ne: true } };

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
          isSecret: { $ne: true },
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

// Get analytics for user
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);

    const [
      totalLinks,
      publicLinks,
      secretLinks,
      favoriteLinks,
      pinnedLinks,
      categoryBreakdown,
      domainBreakdown,
      recentLinks,
      linksOverTime,
    ] = await Promise.all([
      URL.countDocuments({ userId: req.userId }),
      URL.countDocuments({ userId: req.userId, isSecret: { $ne: true } }),
      URL.countDocuments({ userId: req.userId, isSecret: true }),
      URL.countDocuments({ userId: req.userId, isSecret: { $ne: true }, isFavorite: true }),
      URL.countDocuments({ userId: req.userId, isSecret: { $ne: true }, isPinned: true }),
      URL.aggregate([
        { $match: { userId: userObjectId, isSecret: { $ne: true } } },
        {
          $group: {
            _id: { $ifNull: ['$category', DEFAULT_CATEGORY] },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, name: '$_id', count: 1 } },
        { $sort: { count: -1, name: 1 } },
        { $limit: 8 },
      ]),
      URL.aggregate([
        { $match: { userId: userObjectId, isSecret: { $ne: true } } },
        {
          $group: {
            _id: { $ifNull: ['$domain', 'unknown'] },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, domain: '$_id', count: 1 } },
        { $sort: { count: -1, domain: 1 } },
        { $limit: 8 },
      ]),
      URL.find({ userId: req.userId, isSecret: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title url category domain createdAt isFavorite isPinned thumbnail'),
      URL.aggregate([
        {
          $match: {
            userId: userObjectId,
            isSecret: { $ne: true },
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, date: '$_id', count: 1 } },
        { $sort: { date: 1 } },
      ]),
    ]);

    const timeMap = new Map(linksOverTime.map((item) => [item.date, item.count]));
    const activity = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      return {
        date: key,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: timeMap.get(key) || 0,
      };
    });

    res.json({
      totals: {
        totalLinks,
        publicLinks,
        secretLinks,
        favoriteLinks,
        pinnedLinks,
        categoryCount: categoryBreakdown.length,
        domainCount: domainBreakdown.length,
      },
      categoryBreakdown,
      domainBreakdown,
      activity,
      recentLinks,
    });
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

    await createCategoryIfNeeded(req.userId, normalizedName);

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
      isSecret: { $ne: true },
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
    const { title, description, category, isFavorite, url: incomingUrl } = req.body;
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
      { _id: req.params.id, userId: req.userId, isSecret: { $ne: true } },
      { title, description, category: normalizedCategory, isFavorite, ...previewUpdate },
      { new: true }
    );

    if (!updatedUrl) {
      return res.status(404).json({ error: 'URL not found' });
    }

    await createCategoryIfNeeded(req.userId, normalizedCategory);

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

// Toggle secret mode
router.put('/:id/toggle-secret', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    const url = await URL.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).select('+secretPassword');

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const trimmedPassword = (password || '').trim();

    if (url.isSecret) {
      if (url.secretPassword) {
        const isPasswordValid = trimmedPassword
          ? await bcrypt.compare(trimmedPassword, url.secretPassword)
          : false;

        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Incorrect password' });
        }
      }

      url.isSecret = false;
      url.secretPassword = undefined;
    } else {
      if (!trimmedPassword) {
        return res.status(400).json({ error: 'Vault password is required' });
      }

      const hasVaultAccess = await ensureVaultAccess(req.userId, trimmedPassword);
      if (!hasVaultAccess) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      url.isSecret = true;
      url.secretPassword = await bcrypt.hash(trimmedPassword, 12);
      url.isPinned = false;
      url.pinnedAt = null;
    }

    await url.save();
    res.json(sanitizeUrl(url));
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
      isSecret: { $ne: true },
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
      isSecret: { $ne: true },
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
