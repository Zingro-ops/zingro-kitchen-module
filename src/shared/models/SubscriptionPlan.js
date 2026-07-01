const mongoose = require('mongoose');

// Stub - full Subscription module (pause/resume/skip/vacation/renew) lands in Module 17.
const subscriptionPlanSchema = new mongoose.Schema(
  {
    kitchenId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'], default: 'weekly' },
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'subscriptionplans' }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
