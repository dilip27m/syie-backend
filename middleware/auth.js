const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');

  if (!token) {
    throw new AppError('No token, authorization denied', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    throw new AppError('Token is not valid', 401);
  }
};