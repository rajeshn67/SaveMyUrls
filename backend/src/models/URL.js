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
    const urlObj = new URL(this.url);
    this.domain = urlObj.hostname || 'unknown';
  } catch (error) {
    console.error('Error extracting domain:', error.message);
    this.domain = 'unknown';
  }
  next();
});

export default mongoose.model('URL', urlSchema);
