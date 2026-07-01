const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const kitchenRoutes = require('./modules/kitchen/kitchen.routes');
const menuRoutes = require('./modules/menu/menu.routes');
const mealRoutes = require('./modules/meal/meal.routes');
const { notFoundHandler, errorHandler } = require('./shared/middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'catalog-service healthy', data: { modules: ['kitchen', 'menu', 'meal'] } });
});

// Modules 6, 7, 8 - each mounted independently, kept "uniquely" separated
// per module internally, but one Express app / one port.
app.use('/api/v1', kitchenRoutes);
app.use('/api/v1', menuRoutes);
app.use('/api/v1', mealRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
