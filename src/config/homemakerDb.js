const mongoose = require('mongoose');

let homemakerConnection = null;

/**
 * Separate read-only connection to the EXISTING homemaker website's database.
 * Never write through this connection - catalog-service only reads.
 */
function getHomemakerConnection() {
  if (!homemakerConnection) {
    homemakerConnection = mongoose.createConnection(process.env.HOMEMAKER_MONGO_URI);
    homemakerConnection.on('connected', () => {
      console.log('[catalog-service] Homemaker DB (read-only) connected');
    });
    homemakerConnection.on('error', (err) => {
      console.error('[catalog-service] Homemaker DB connection error:', err.message);
    });
  }
  return homemakerConnection;
}

module.exports = { getHomemakerConnection };
