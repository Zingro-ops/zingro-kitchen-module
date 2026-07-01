const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, sortOrder: { type: Number, default: 0 } },
  { _id: false }
);

const scheduleSchema = new mongoose.Schema(
  {
    weekday: { type: Number, min: 0, max: 6, required: true },
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true }
  },
  { _id: false }
);

// Marketplace-listing fields only. fssaiNumber, cuisine, veg flag, description,
// onboarding photo live in the EXISTING homemaker profile collection - merged
// at the repository level, never duplicated here.
const kitchenSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, unique: true },
    kitchenName: { type: String, required: true, trim: true },
    coverImage: { type: String, default: '' },
    images: { type: [imageSchema], default: [] },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    deliveryRadiusKm: { type: Number, required: true, min: 0.1 },
    schedule: { type: [scheduleSchema], default: [] },
    isOpenOverride: { type: Boolean, default: null },
    avgRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' }
  },
  { timestamps: true, collection: 'kitchens' }
);

kitchenSchema.index({ 'location.lat': 1, 'location.lng': 1 });
kitchenSchema.index({ status: 1 });

module.exports = mongoose.model('Kitchen', kitchenSchema);
