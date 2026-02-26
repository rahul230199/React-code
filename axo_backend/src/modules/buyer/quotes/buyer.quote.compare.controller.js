const asyncHandler = require("../../../utils/asyncHandler");
const service = require("./buyer.quote.compare.service");

exports.compare = asyncHandler(async (req, res) => {

  const orgId = req.user.organization_id;
  const { rfqId } = req.params;

  const quotes = await service.compareQuotes(orgId, rfqId);

  res.json({
    success: true,
    data: {
      rfq_id: rfqId,
      quotes
    }
  });

});