const kitchenRepository = require('../../shared/repositories/kitchenRepository');
const { getDistanceAndEta } = require('../../shared/services/distanceService');
const { isValidLatLng } = require('../../shared/utils/validators');
const { success, error } = require('../../shared/utils/response');
const Review = require('../../shared/models/Review');
const SubscriptionPlan = require('../../shared/models/SubscriptionPlan');
const Offer = require('../../shared/models/Offer');

// GET /homemakers
async function listKitchens(req, res) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (!isValidLatLng(lat, lng)) {
      return error(res, 'INVALID_LOCATION', 'Valid lat and lng query params are required', 400);
    }

    const { veg, rating_min, open_now, sort } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const filter = {};
    if (rating_min) filter.avgRating = { $gte: parseFloat(rating_min) };

    const kitchens = await kitchenRepository.listKitchens(filter); // already merged + approved-only

    const enriched = [];
    for (const k of kitchens) {
      if (veg === 'true' && !k.vegOnly) continue;
      if (req.query.cuisine && !k.cuisineTags.includes(req.query.cuisine)) continue;
      if (open_now === 'true' && !k.isOpen) continue;

      const { distanceKm, etaMinutes, estimated } = await getDistanceAndEta(
        { lat, lng },
        { lat: k.location.lat, lng: k.location.lng }
      );
      if (distanceKm > k.deliveryRadiusKm) continue;

      enriched.push({
        id: k.id,
        name: k.name,
        cover_image: k.coverImage,
        rating: k.avgRating,
        review_count: k.totalReviews,
        cuisine_tags: k.cuisineTags,
        is_open: k.isOpen,
        distance_km: distanceKm,
        eta_minutes: etaMinutes,
        distance_estimated: estimated,
        veg_only: k.vegOnly
      });
    }

    const sortFns = {
      distance: (a, b) => a.distance_km - b.distance_km,
      rating: (a, b) => b.rating - a.rating,
      popularity: (a, b) => b.review_count - a.review_count
    };
    if (sort && sortFns[sort]) enriched.sort(sortFns[sort]);

    const start = (page - 1) * limit;
    const paged = enriched.slice(start, start + limit);

    return success(res, { homemakers: paged, pagination: { page, limit, total: enriched.length } });
  } catch (err) {
    console.error('[listKitchens]', err);
    return error(res, 'INTERNAL_ERROR', 'Failed to fetch kitchens', 500);
  }
}

// GET /homemakers/:id
async function getKitchenDetails(req, res) {
  try {
    const kitchen = await kitchenRepository.getKitchenById(req.params.id);
    if (!kitchen) {
      return error(res, 'KITCHEN_NOT_FOUND', 'Kitchen not found', 404);
    }

    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    let distancePayload = { distance_km: null, eta_minutes: null, distance_estimated: false };
    if (isValidLatLng(lat, lng)) {
      const { distanceKm, etaMinutes, estimated } = await getDistanceAndEta(
        { lat, lng },
        { lat: kitchen.location.lat, lng: kitchen.location.lng }
      );
      distancePayload = { distance_km: distanceKm, eta_minutes: etaMinutes, distance_estimated: estimated };
    }

    const [reviews, subscriptionPlans, offers] = await Promise.all([
      Review.find({ kitchenId: kitchen.id, mealId: null }).sort({ createdAt: -1 }).limit(3).lean(),
      SubscriptionPlan.find({ kitchenId: kitchen.id, isActive: true }).lean(),
      Offer.find({ isActive: true, $or: [{ kitchenId: kitchen.id }, { kitchenId: null }] }).lean()
    ]);
    const activeOffers = offers.filter((o) => !o.expiresAt || o.expiresAt > new Date());

    return success(res, {
      id: kitchen.id,
      name: kitchen.name,
      description: kitchen.description,
      images: kitchen.images,
      rating: kitchen.avgRating,
      review_count: kitchen.totalReviews,
      reviews_preview: reviews.map((r) => ({ user: r.userName, rating: r.rating, comment: r.comment, images: r.images })),
      schedule: kitchen.schedule,
      is_open: kitchen.isOpen,
      delivery_radius_km: kitchen.deliveryRadiusKm,
      fssai: kitchen.fssai,
      subscription_plans: subscriptionPlans.map((p) => ({ id: p._id, name: p.name, frequency: p.frequency, price: p.price })),
      offers: activeOffers.map((o) => ({ id: o._id, title: o.title, description: o.description })),
      cuisine_tags: kitchen.cuisineTags,
      veg_only: kitchen.vegOnly,
      ...distancePayload
    });
  } catch (err) {
    console.error('[getKitchenDetails]', err);
    return error(res, 'INTERNAL_ERROR', 'Failed to fetch kitchen details', 500);
  }
}

module.exports = { listKitchens, getKitchenDetails };
