const mongoose = require('mongoose');

// Stub - full Offers/Coupons logic lands in Module 12.
// kitchenId: null = platform-wide offer, set = kitchen-specific offer.
const offerSchema = new mongoose.Schema(
  {
    kitchenId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date }
  },
  { timestamps: true, collection: 'offers' }
);

module.exports = mongoose.model('Offer', offerSchema);
