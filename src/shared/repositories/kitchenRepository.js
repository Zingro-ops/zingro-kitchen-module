/**
 * SINGLE PLACE to fetch kitchen data. Every module (kitchen, menu, meal)
 * goes through this file - nobody queries Kitchen or HomemakerProfile
 * models directly outside this repository.
 *
 * Handles the merge between:
 *  - kitchen_db.kitchens        (marketplace fields: location, schedule, images, rating)
 *  - existing homemaker DB      (profile fields: name, fssai, cuisine, veg, description, photo, approval status)
 */
const Kitchen = require('../models/Kitchen');
const { getHomemakerProfileModel } = require('../models/HomemakerProfile');
const { buildS3Url, isVegFromCategory } = require('../utils/homemakerMapper');
const { getEffectiveOpenStatus } = require('../services/kitchenStatusService');

/**
 * Fetch one kitchen merged with its homemaker profile.
 * Returns null if kitchen doesn't exist, is suspended, or the owning
 * homemaker isn't approved (i.e. "not visible to customers").
 *
 * @param {string} kitchenId
 * @param {{ includeSuspended?: boolean }} [options] - internal callers (e.g. admin) can bypass visibility gate
 */
async function getKitchenById(kitchenId, options = {}) {
  const kitchen = await Kitchen.findById(kitchenId).lean();
  if (!kitchen) return null;
  if (!options.includeSuspended && kitchen.status === 'suspended') return null;

  const HomemakerProfile = getHomemakerProfileModel();
  const profile = await HomemakerProfile.findById(kitchen.ownerId).lean();
  if (!profile) return null;
  if (!options.includeSuspended && profile.status !== 'approved') return null;

  return mergeKitchenAndProfile(kitchen, profile);
}

/**
 * Fetch multiple kitchens (by filter) merged with their homemaker profiles.
 * Only returns kitchens whose homemaker profile is approved.
 *
 * @param {object} filter - Mongoose filter for the Kitchen collection
 */
async function listKitchens(filter = {}) {
  const kitchens = await Kitchen.find({ status: 'active', ...filter }).lean();
  if (kitchens.length === 0) return [];

  const HomemakerProfile = getHomemakerProfileModel();
  const ownerIds = kitchens.map((k) => k.ownerId);
  const profiles = await HomemakerProfile.find({ _id: { $in: ownerIds } }).lean();
  const profileMap = new Map(profiles.map((p) => [String(p._id), p]));

  const merged = [];
  for (const k of kitchens) {
    const profile = profileMap.get(String(k.ownerId));
    if (!profile || profile.status !== 'approved') continue;
    merged.push(mergeKitchenAndProfile(k, profile));
  }
  return merged;
}

/**
 * Lightweight existence+visibility check, used by Menu/Meal modules to
 * confirm a kitchenId is valid before returning its menu/meal data.
 * Does not fetch the full merged object - cheaper than getKitchenById.
 */
async function isKitchenVisible(kitchenId) {
  const kitchen = await Kitchen.findById(kitchenId).select('status ownerId').lean();
  if (!kitchen || kitchen.status === 'suspended') return false;

  const HomemakerProfile = getHomemakerProfileModel();
  const profile = await HomemakerProfile.findById(kitchen.ownerId).select('status').lean();
  return !!profile && profile.status === 'approved';
}

/**
 * Internal: combines a raw Kitchen doc + raw HomemakerProfile doc into
 * one flat object. This is the ONLY place field-name mapping happens.
 */
function mergeKitchenAndProfile(kitchen, profile) {
  return {
    id: kitchen._id,
    ownerId: kitchen.ownerId,
    name: kitchen.kitchenName,
    description: profile.food?.description || '',
    coverImage: kitchen.coverImage || buildS3Url(profile.photos?.kitchen_s3_key),
    images: [
      ...(kitchen.images || []).map((i) => i.url),
      buildS3Url(profile.photos?.kitchen_s3_key)
    ].filter(Boolean),
    location: kitchen.location,
    deliveryRadiusKm: kitchen.deliveryRadiusKm,
    schedule: kitchen.schedule,
    isOpen: getEffectiveOpenStatus(kitchen),
    avgRating: kitchen.avgRating,
    totalReviews: kitchen.totalReviews,
    cuisineTags: profile.food?.cuisine ? [profile.food.cuisine] : [],
    vegOnly: isVegFromCategory(profile.food?.category),
    fssai: {
      licenseMasked: profile.fssai?.license_masked || null,
      active: profile.fssai?.active ?? null,
      expiry: profile.fssai?.expiry || null
    },
    status: kitchen.status
  };
}

module.exports = { getKitchenById, listKitchens, isKitchenVisible };
