exports.validateCreateRFQ = (req, res, next) => {
  const { part_name, quantity } = req.body;

  if (!part_name || typeof part_name !== "string")
    return res.status(400).json({ success: false, message: "Invalid part name" });

  if (!quantity || isNaN(quantity) || quantity <= 0)
    return res.status(400).json({ success: false, message: "Invalid quantity" });

  next();
};