function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' });
}

function errorHandler(err, req, res, next) {
  console.error('[unhandled error]', err);
  res.status(500).json({ success: false, message: 'Internal server error', code: 'INTERNAL_ERROR' });
}

module.exports = { notFoundHandler, errorHandler };
