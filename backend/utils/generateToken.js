const jwt = require('jsonwebtoken');

// Generate JWT access and refresh tokens
const generateToken = (id, rememberMe = false, accessTokenOnly = false) => {
  // Access token payload
  const accessPayload = {
    id,
    type: 'access'
  };
  
  // Access token options
  const accessOptions = {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' // 15 minutes
  };
  
  // Generate access token
  const accessToken = jwt.sign(accessPayload, process.env.JWT_SECRET, accessOptions);
  
  if (accessTokenOnly) {
    return { accessToken };
  }
  
  // Refresh token payload
  const refreshPayload = {
    id,
    type: 'refresh'
  };
  
  // Refresh token options
  const refreshOptions = {
    expiresIn: rememberMe ? 
      (process.env.JWT_REFRESH_EXPIRE_LONG || '30d') : // 30 days for "remember me"
      (process.env.JWT_REFRESH_EXPIRE || '7d') // 7 days default
  };
  
  // Generate refresh token
  const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, refreshOptions);
  
  return {
    accessToken,
    refreshToken
  };
};

module.exports = generateToken;
