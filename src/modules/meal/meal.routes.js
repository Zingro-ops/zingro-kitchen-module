const express = require('express');
const router = express.Router();
const { getMealDetails } = require('./meal.controller');

router.get('/meals/:id', getMealDetails);

module.exports = router;
