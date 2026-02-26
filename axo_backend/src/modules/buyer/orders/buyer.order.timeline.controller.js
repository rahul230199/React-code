const asyncHandler = require("../../../utils/asyncHandler");
const service = require("./buyer.order.timeline.service");

exports.getTimeline = asyncHandler(async (req, res) => {

  const orgId = req.user.organization_id;
  const { poId } = req.params;

  const timeline = await service.getTimeline(orgId, poId);

  res.json({
    success: true,
    data: {
      po_id: poId,
      timeline
    }
  });

});