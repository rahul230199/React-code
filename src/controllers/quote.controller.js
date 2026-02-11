const quoteModel = require("../../models/quote.model");

/**
 * Supplier submits a quote
 * POST /quotes
 */
const submitQuote = async (req, res) => {
  try {
    const quote = await quoteModel.createQuote(req.body);

    return res.status(201).json({
      success: true,
      message: "Quote submitted successfully",
      data: quote,
    });
  } catch (error) {
    console.error("Submit quote error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit quote",
    });
  }
};

/**
 * Buyer views quotes for RFQ
 * GET /quotes/rfq/:rfq_id
 */
const getQuotesByRFQ = async (req, res) => {
  try {
    const { rfq_id } = req.params;

    const quotes = await quoteModel.getQuotesByRFQ(rfq_id);

    return res.status(200).json({
      success: true,
      data: quotes,
    });
  } catch (error) {
    console.error("Get quotes error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotes",
    });
  }
};

/**
 * Get single quote
 * GET /quotes/:id
 */
const getQuoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await quoteModel.getQuoteById(id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error("Get quote error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quote",
    });
  }
};

module.exports = {
  submitQuote,
  getQuotesByRFQ,
  getQuoteById,
};
