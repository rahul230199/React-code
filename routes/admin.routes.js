const express = require("express");
const router = express.Router();
const NetworkRequest = require("../models/NetworkRequest");
const User = require("../models/User");
const UserCreationService = require("../services/UserCreationService");

// Approve request and create user
router.post("/approve-request/:id", async (req, res) => {
  console.log("🚀 ADMIN APPROVE ENDPOINT CALLED");
  console.log("ID:", req.params.id);

  try {
    const { id } = req.params;
    const { adminNotes } = req.body || {};

    // Find the request
    const request = await NetworkRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    console.log("📄 Processing request:", {
      company: request.companyName,
      contact: request.contactName,
      email: request.email
    });

    // Use UserCreationService to create user
    const creationResult = await UserCreationService.createUserFromRequest(request);

    if (!creationResult.success) {
      return res.status(400).json(creationResult);
    }

    const { user, credentials } = creationResult;

    // Update request
    request.status = 'APPROVED';
    request.approvedAt = new Date();
    request.adminNotes = adminNotes || '';
    request.userId = user._id;
    request.updatedAt = new Date();
    await request.save();

    console.log("✅ Request approved and updated");

    // Return success
    res.json({
      success: true,
      message: 'Request approved and user account created',
      data: {
        requestId: request._id,
        userId: user._id,
        username: credentials.username,
        email: credentials.email,
        userType: credentials.userType,
        tempPassword: credentials.tempPassword,
        loginUrl: 'https://axonetworks.com/login.html'
      }
    });

  } catch (error) {
    console.error("❌ APPROVE ERROR:", error.message);
    console.error("❌ Error stack:", error.stack);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Duplicate user",
        message: "User with this email or username already exists."
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pending requests
router.get("/pending-requests", async (req, res) => {
  try {
    const requests = await NetworkRequest.find({ status: 'PENDING' }).sort({ submittedAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
