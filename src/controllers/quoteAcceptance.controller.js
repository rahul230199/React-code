const {
  acceptQuoteAndCreatePO,
} = require("../../services/quoteAcceptance.service");

/**
 * Buyer accepts a quote
 * POST /quotes/accept
 */
const acceptQuote = async (req, res) => {
  try {
    const {
      rfq_id,
      quote_id,
      buyer_id,
      supplier_id,
      quantity,
      price,
    } = req.body;

    if (
      !rfq_id ||
      !quote_id ||
      !buyer_id ||
      !supplier_id ||
      !quantity ||
      !price
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const po = await acceptQuoteAndCreatePO({
      rfq_id,
      quote_id,
      buyer_id,
      supplier_id,
      quantity,
      price,
    });

    return res.status(201).json({
      success: true,
      message: "Quote accepted and PO created",
      data: po,
    });
  } catch (error) {
    console.error("Accept quote error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept quote",
    });
  }
};

module.exports = {
  acceptQuote,
};
