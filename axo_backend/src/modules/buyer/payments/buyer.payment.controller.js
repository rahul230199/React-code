const asyncHandler = require("../../../utils/asyncHandler");
const service = require("./buyer.payment.service");

exports.getLedger = asyncHandler(async (req, res) => {

  const orgId = req.user.organization_id;
  const { poId } = req.params;

  const data = await service.getLedger(orgId, poId);

  res.json({
    success: true,
    data
  });

});