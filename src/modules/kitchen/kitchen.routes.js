const express = require('express');
const router = express.Router();
const { listKitchens, getKitchenDetails } = require('./kitchen.controller');

router.get('/homemakers', listKitchens);
router.get('/homemakers/:id', getKitchenDetails);

module.exports = router;
