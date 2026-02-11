const { ZodError } = require("zod");

/**
 * Generic request validation middleware
 * @param {ZodSchema} schema
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      next(error);
    }
  };
};

module.exports = {
  validateRequest,
};
