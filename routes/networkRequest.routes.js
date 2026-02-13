const express = require("express");
const pool = require("../src/config/db");
const { authenticate, authorizeAdmin } =
  require("../middleware/auth.middleware");
const { createUserFromRequest } =
  require("../services/userProvisioningService");

const router = express.Router();

/* =====================================================
   CREATE NETWORK REQUEST (PUBLIC)
   POST /api/network-request
===================================================== */
router.post("/", async (req, res) => {
  try {
    const {
      companyName,
      website,
      registeredAddress,
      cityState,
      contactName,
      role,
      email,
      phone,
      whatYouDo,
      primaryProduct,
      keyComponents,
      manufacturingLocations,
      monthlyCapacity,
      certifications,
      roleInEV,
      whyJoinAXO
    } = req.body;

    // Basic validation
    if (!companyName || !cityState || !contactName ||
        !role || !email || !phone ||
        !primaryProduct || !keyComponents ||
        !manufacturingLocations || !monthlyCapacity ||
        !roleInEV || !whyJoinAXO) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Prevent duplicate pending request
    const existing = await pool.query(
      `SELECT id FROM network_access_requests
       WHERE email = $1 AND status = 'pending'`,
      [email]
    );

    if (existing.rows.length) {
      return res.status(400).json({
        success: false,
        message: "Pending request already exists for this email"
      });
    }

    const result = await pool.query(
      `INSERT INTO network_access_requests (
        company_name,
        website,
        registered_address,
        city_state,
        contact_name,
        role,
        email,
        phone,
        what_you_do,
        primary_product,
        key_components,
        manufacturing_locations,
        monthly_capacity,
        certifications,
        role_in_ev,
        why_join_axo,
        status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,'pending'
      )
      RETURNING *`,
      [
        companyName,
        website || null,
        registeredAddress || null,
        cityState,
        contactName,
        role,
        email,
        phone,
        JSON.stringify(whatYouDo || []),
        primaryProduct,
        keyComponents,
        manufacturingLocations,
        monthlyCapacity,
        certifications || null,
        roleInEV,
        whyJoinAXO
      ]
    );

    res.json({
      success: true,
      message: "Request submitted successfully",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Create request error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* =====================================================
   GET ALL REQUESTS (ADMIN)
===================================================== */
router.get("/", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM network_access_requests
       ORDER BY submission_timestamp DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* =====================================================
   UPDATE STATUS (ADMIN APPROVAL FLOW)
===================================================== */
router.put("/:id/status", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const allowed = ["pending", "verified", "rejected"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Verification comment required"
      });
    }

    const result = await pool.query(
      `UPDATE network_access_requests
       SET status = $1,
           verification_comment = $2,
           verified_by = $3,
           verified_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, comment, req.user.id, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    const updatedRequest = result.rows[0];

    // Auto-create user after approval
    if (status === "verified") {
      await createUserFromRequest(pool, updatedRequest);
    }

    res.json({
      success: true,
      message: "Status updated successfully",
      data: updatedRequest
    });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;