const mealRepository = require('../../shared/repositories/mealRepository');
const kitchenRepository = require('../../shared/repositories/kitchenRepository');
const { success, error } = require('../../shared/utils/response');

// GET /meals/:id
async function getMealDetails(req, res) {
  try {
    const meal = await mealRepository.getMealById(req.params.id);
    if (!meal) {
      return error(res, 'MEAL_NOT_FOUND', 'Meal not found', 404);
    }

    // check parent kitchen visibility via kitchenRepository (single source of truth)
    const visible = await kitchenRepository.isKitchenVisible(meal.kitchenId);
    if (!visible) {
      // per spec edge case: kitchen suspended -> meal still returned but marked unavailable, not 404
      meal.isAvailable = false;
    }

    return success(res, {
      id: meal.id,
      kitchen_id: meal.kitchenId,
      images: meal.images,
      name: meal.name,
      description: meal.description,
      ingredients: meal.ingredients,
      nutrition: meal.nutrition,
      price: meal.price,
      discount_price: meal.discountPrice,
      rating: meal.rating,
      review_count: meal.reviewCount,
      reviews_preview: meal.reviewsPreview,
      is_available: meal.isAvailable,
      archived: meal.archived,
      veg: meal.veg,
      egg: meal.egg,
      spicy_level: meal.spicyLevel,
      subscription_available: meal.subscriptionAvailable
    });
  } catch (err) {
    console.error('[getMealDetails]', err);
    return error(res, 'INTERNAL_ERROR', 'Failed to fetch meal details', 500);
  }
}

module.exports = { getMealDetails };
