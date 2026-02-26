const queries = require("./buyer.quote.compare.queries");
const engine = require("./buyer.quote.compare.engine");

exports.compareQuotes = async (orgId, rfqId) => {

  const result = await queries.getQuotesForRFQ(orgId, rfqId);

  const scored = engine.calculateScores(result.rows);

  return scored;
};