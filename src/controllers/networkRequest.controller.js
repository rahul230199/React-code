const pool = require("../config/db");
const { createUserFromRequest } =
  require("../../services/userProvisioningService");

/* =====================================================
   CREATE NETWORK REQUEST
===================================================== */
exports.createNetworkRequest = async (req, res) => {
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

    const duplicate = await pool.query(
      `SELECT id FROM network_access_requests
       WHERE email = $1 AND status = 'pending'`,
      [email]
    );

    if (duplicate.rows.length) {
      return res.status(400).json({
        success: false,
        message: "Pending request already exists"
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
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Create request error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/* =====================================================
   GET ALL NETWORK REQUESTS (ADMIN)
===================================================== */
exports.getAllNetworkRequests = async (req, res) => {
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
      success: false
    });
  }
};


/* =====================================================
   UPDATE STATUS (ADMIN)
===================================================== */
exports.updateNetworkRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const allowed = ["pending", "verified", "rejected"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
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

    const updated = result.rows[0];

    if (status === "verified") {
      await createUserFromRequest(pool, updated);
    }

    res.json({
      success: true,
      data: updated
    });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({
      success: false
    });
  }
};