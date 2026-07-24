const express = require('express');
const { protect } = require('../middlewares/auth');
const { submitKYC, getKYC } = require('../controllers/kycController');
const router = express.Router();

router.use(protect);
router.post('/', submitKYC);
router.get('/', getKYC);

module.exports = router;