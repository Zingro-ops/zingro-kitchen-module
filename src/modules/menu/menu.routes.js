const express = require('express');
const router = express.Router();
const { getMenu } = require('./menu.controller');

router.get('/homemakers/:id/menu', getMenu);

module.exports = router;
