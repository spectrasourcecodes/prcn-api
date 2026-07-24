const express = require('express');
const { register, login, refreshToken, logout, verifyEmail } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');
const { validateRegister, validateLogin } = require('../utils/validationSchemas');

const router = express.Router();

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/verify-email/:token', verifyEmail);

module.exports = router;