require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[catalog-service] listening on port ${PORT} (modules: kitchen, menu, meal)`);
  });
});
