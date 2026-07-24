const { asyncHandler } = require('../utils/asyncHandler');
const kycService = require('../services/kycService');
const AppError = require('../utils/appError');

exports.submitKYC = asyncHandler(async (req, res) => {
  const data = req.body;
  const kyc = await kycService.upsertKYC(req.user._id, data);
  res.json({ success: true, data: kyc });
});

exports.getKYC = asyncHandler(async (req, res) => {
  const kyc = await kycService.getUserKYC(req.user._id);
  res.json({ success: true, data: kyc });
});