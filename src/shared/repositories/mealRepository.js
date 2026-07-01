/**
 * SINGLE PLACE to fetch meal data. Menu module (listing/grouping) and Meal
 * module (single-item detail) both call this - nobody queries the Meal
 * model directly outside this repository.
 */
const Meal = require('../models/Meal');
const Review = require('../models/Review');

const MENU_CATEGORIES = ['Support', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Beverages'];

/**
 * Fetch all active meals for a kitchen, grouped by category (menu view).
 * Empty categories are omitted from the result.
 */
async function getMenuByKitchenId(kitchenId, options = {}) {
  const filter = { kitchenId, isActive: true };
  if (options.category) filter.category = options.category;
  if (options.veg !== undefined) filter.veg = options.veg;

  const meals = await Meal.find(filter).sort({ category: 1, name: 1 }).lean();

  const grouped = {};
  for (const cat of MENU_CATEGORIES) grouped[cat] = [];
  for (const m of meals) grouped[m.category].push(mapMealSummary(m));

  return MENU_CATEGORIES
    .filter((cat) => grouped[cat].length > 0)
    .map((cat) => ({ name: cat, items: grouped[cat] }));
}

/**
 * Fetch one meal by id, with review preview. Returns archived:true if the
 * meal exists but is inactive/deleted (still needed for reorder/history
 * screens per Module 8 edge cases) instead of null.
 */
async function getMealById(mealId) {
  const meal = await Meal.findById(mealId).lean();
  if (!meal) return null;

  const reviews = await Review.find({ mealId: meal._id }).sort({ createdAt: -1 }).limit(5).lean();

  return {
    id: meal._id,
    kitchenId: meal.kitchenId,
    name: meal.name,
    description: meal.description,
    ingredients: meal.ingredients,
    nutrition: meal.nutrition,
    images: meal.images,
    price: meal.price,
    discountPrice: meal.discountPrice,
    rating: meal.avgRating,
    reviewCount: meal.totalReviews,
    reviewsPreview: reviews.map((r) => ({
      user: r.userName,
      rating: r.rating,
      comment: r.comment,
      images: r.images
    })),
    isAvailable: meal.isActive,
    archived: !meal.isActive,
    veg: meal.veg,
    egg: meal.egg,
    spicyLevel: meal.spicyLevel,
    subscriptionAvailable: meal.subscriptionAvailable
  };
}

function mapMealSummary(m) {
  return {
    id: m._id,
    name: m.name,
    image: m.images?.[0] || null,
    price: m.price,
    discountPrice: m.discountPrice,
    veg: m.veg,
    spicyLevel: m.spicyLevel,
    isAvailable: m.isActive,
    subscriptionAvailable: m.subscriptionAvailable,
    rating: m.avgRating
  };
}

module.exports = { getMenuByKitchenId, getMealById, MENU_CATEGORIES };
