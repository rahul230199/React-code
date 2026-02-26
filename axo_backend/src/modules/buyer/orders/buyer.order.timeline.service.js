const queries = require("./buyer.order.timeline.queries");

exports.getTimeline = async (orgId, poId) => {
  const result = await queries.getOrderTimeline(orgId, poId);

  return result.rows.map(event => ({
    event_type: event.event_type,
    actor_id: event.actor_id,
    metadata: event.metadata,
    created_at: event.created_at
  }));
};