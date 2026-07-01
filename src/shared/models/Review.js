const mongoose = require('mongoose');

// Stub - full Review module (likes, images, ordering-gated) lands in Module 18.
// Shared by Kitchen (kitchen-level reviews) and Meal (meal-level reviews) via
// an optional mealId field.
const reviewSchema = new mongoose.Schema(
  {
    kitchenId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    mealId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId },
    userName: { type: String, default: 'Customer' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
    images: { type: [String], default: [] }
  },
  { timestamps: true, collection: 'reviews' }
);

module.exports = mongoose.model('Review', reviewSchema);
