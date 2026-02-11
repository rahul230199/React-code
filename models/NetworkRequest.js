const mongoose = require("mongoose");

const NetworkRequestSchema = new mongoose.Schema(
  {
    // Company Information
    companyName: { type: String, required: true },
    website: { type: String },
    registeredAddress: { type: String, required: true },
    cityState: { type: String, required: true },

    // Contact Information
    contactName: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },

    // What You Do (Checkboxes)
    whatYouDo: {
      type: [String],
      required: true
    },

    // Manufacturing Details
    primaryProduct: { type: String, required: true },
    keyComponents: { type: String, required: true },
    manufacturingLocations: { type: String, required: true },
    monthlyCapacity: { type: String, required: true },
    certifications: { type: String },

    // Role in EV Manufacturing - UPDATED PER YOUR REQUEST
    roleInEV: {
      type: String,
      enum: ["OEMs", "Suppliers", "Both"],
      required: true
    },

    // Why AXO
    whyJoinAXO: { type: String, required: true },

    // ========== NEW FIELDS FOR USER CREATION ==========
    // Link to created user account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Approval details
    approvedAt: {
      type: Date,
      default: null
    },

    rejectedAt: {
      type: Date,
      default: null
    },

    adminNotes: {
      type: String,
      default: ""
    },

    // Admin who processed this request
    processedBy: {
      type: String,
      default: null
    },

    // ========== EXISTING FIELDS ==========
    // System Fields
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },

    submittedAt: {
      type: Date,
      default: Date.now
    },

    verifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    collection: "network_requests",
    timestamps: true  // Adds createdAt and updatedAt automatically
  }
);

// Add index for faster queries
NetworkRequestSchema.index({ email: 1 });
NetworkRequestSchema.index({ status: 1 });
NetworkRequestSchema.index({ submittedAt: -1 });

module.exports = mongoose.model("NetworkRequest", NetworkRequestSchema);
