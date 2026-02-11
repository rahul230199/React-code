const rfqMessageModel = require("../../models/rfqMessage.model");

/**
 * Send message in RFQ (Buyer or Supplier)
 * POST /rfq-messages
 */
const sendMessage = async (req, res) => {
  try {
    const { rfq_id, sender_id, message } = req.body;

    if (!rfq_id || !sender_id || !message) {
      return res.status(400).json({
        success: false,
        message: "rfq_id, sender_id and message are required",
      });
    }

    const msg = await rfqMessageModel.sendMessage({
      rfq_id,
      sender_id,
      message,
    });

    return res.status(201).json({
      success: true,
      data: msg,
    });
  } catch (error) {
    console.error("Send RFQ message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

/**
 * Get messages for RFQ
 * GET /rfq-messages/rfq/:rfq_id
 */
const getMessagesByRFQ = async (req, res) => {
  try {
    const { rfq_id } = req.params;

    const messages = await rfqMessageModel.getMessagesByRFQ(rfq_id);

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Get RFQ messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

module.exports = {
  sendMessage,
  getMessagesByRFQ,
};
