import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      default: 'uncategorized',
    },
    tags: [String],
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    secretPassword: {
      type: String,
      select: false,
    },
    pinnedAt: {
      type: Date,
    },
    thumbnail: {
      type: String,
    },
    domain: {
      type: String,
    },
  },
  { timestamps: true }
);

// Extract domain from URL before saving
urlSchema.pre('save', function (next) {
  try {
    if (this.url && !/^https?:\/\//i.test(this.url)) {
      this.url = `https://${this.url}`;
    }
    const urlObj = new URL(this.url);
    this.domain = urlObj.hostname || 'unknown';
  } catch (error) {
    console.error('Error extracting domain:', error.message);
    this.domain = 'unknown';
  }
  next();
});

export default mongoose.model('URL', urlSchema);
