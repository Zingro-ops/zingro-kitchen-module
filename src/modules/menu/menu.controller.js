const kitchenRepository = require('../../shared/repositories/kitchenRepository');
const mealRepository = require('../../shared/repositories/mealRepository');
const { success, error } = require('../../shared/utils/response');

const VALID_CATEGORIES = ['Support', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Beverages'];

// GET /homemakers/:id/menu
async function getMenu(req, res) {
  try {
    const { id } = req.params;

    // uses kitchenRepository - the single source of truth for "does this kitchen exist and is it visible"
    const visible = await kitchenRepository.isKitchenVisible(id);
    if (!visible) {
      return error(res, 'KITCHEN_NOT_FOUND', 'Kitchen not found', 404);
    }

    const { category, veg } = req.query;
    if (category && !VALID_CATEGORIES.includes(category)) {
      return error(res, 'INVALID_CATEGORY', 'category must be one of: ' + VALID_CATEGORIES.join(', '), 400);
    }

    const options = {};
    if (category) options.category = category;
    if (veg === 'true') options.veg = true;
    if (veg === 'false') options.veg = false;

    const categories = await mealRepository.getMenuByKitchenId(id, options);

    return success(res, { categories });
  } catch (err) {
    console.error('[getMenu]', err);
    return error(res, 'INTERNAL_ERROR', 'Failed to fetch menu', 500);
  }
}

module.exports = { getMenu };
