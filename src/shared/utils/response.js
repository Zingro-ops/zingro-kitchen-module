function success(res, data = {}, message = '', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function error(res, code, message = '', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message, code });
}

module.exports = { success, error };
