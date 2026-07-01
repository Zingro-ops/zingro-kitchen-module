const mongoose = require('mongoose');

// Individual menu items. Fixed category enum matching spec exactly.
// Availability = isActive only (manual toggle by homemaker, per your decision -
// no stock-count layer for now).
const mealSchema = new mongoose.Schema(
  {
    kitchenId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    ingredients: { type: String, default: '' }, // free text
    nutrition: { type: String, default: '' }, // free text
    category: {
      type: String,
      enum: ['Support', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Beverages'],
      required: true
    },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null },
    veg: { type: Boolean, required: true },
    egg: { type: Boolean, default: false },
    spicyLevel: { type: Number, min: 0, max: 3, default: 0 },
    subscriptionAvailable: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // manual toggle - sole availability control
    avgRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  { timestamps: true, collection: 'meals' }
);

mealSchema.index({ kitchenId: 1, category: 1 });
mealSchema.index({ isActive: 1 });

module.exports = mongoose.model('Meal', mealSchema);
