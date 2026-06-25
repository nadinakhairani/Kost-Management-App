const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/auth');

// Route POST /api/auth/login
router.post('/login', login);

// Route POST /api/auth/register
router.post('/register', register);

module.exports = router;
