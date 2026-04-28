const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate average rating for lawyer
reviewSchema.statics.calculateAverageRating = async function(lawyerId) {
  const stats = await this.aggregate([
    { $match: { lawyer: lawyerId } },
    {
      $group: {
        _id: '$lawyer',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('User').findByIdAndUpdate(lawyerId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].numReviews
    });
  } else {
    await mongoose.model('User').findByIdAndUpdate(lawyerId, {
      averageRating: 0,
      totalReviews: 0
    });
  }
};

// Update avg rating on save/delete
reviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.lawyer);
});

reviewSchema.post('remove', function() {
  this.constructor.calculateAverageRating(this.lawyer);
});

module.exports = mongoose.model('Review', reviewSchema);
