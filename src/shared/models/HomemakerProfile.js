const mongoose = require('mongoose');
const { getHomemakerConnection } = require('../../config/homemakerDb');

// Mirrors only the fields catalog-service needs from the EXISTING homemaker
// onboarding/profile document. strict:false so unknown fields (passwordHash,
// otp, bank, kyc, consent, etc.) are ignored - never touched or exposed.
const homemakerProfileSchema = new mongoose.Schema(
  {
    status: { type: String },
    personal: { name: String, gender: String },
    food: { category: String, cuisine: String, description: String, radius: String },
    fssai: { license_masked: String, active: Boolean, expiry: String, registered_name: String },
    photos: { kitchen_s3_key: String }
  },
  { strict: false, collection: process.env.HOMEMAKER_COLLECTION_NAME || 'homemakers' }
);

function getHomemakerProfileModel() {
  const conn = getHomemakerConnection();
  return conn.models.HomemakerProfile || conn.model('HomemakerProfile', homemakerProfileSchema);
}

module.exports = { getHomemakerProfileModel };
