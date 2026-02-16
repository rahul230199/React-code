const pool = require("../../config/db");

exports.submitRequest = async (req, res) => {
  try {
    console.log("📩 Network submit triggered");

    let {
      company_name,
      website,
      registered_address,
      city_state,
      contact_name,
      role_requested,
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
    } = req.body;

    /* =====================================================
       1️⃣ BASIC VALIDATION
    ===================================================== */

    if (
      !company_name ||
      !city_state ||
      !contact_name ||
      !role_requested ||
      !email ||
      !phone ||
      !primary_product ||
      !key_components ||
      !manufacturing_locations ||
      !monthly_capacity ||
      !role_in_ev ||
      !why_join_axo
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    /* =====================================================
       2️⃣ ENUM NORMALIZATION & VALIDATION
    ===================================================== */

    // Normalize role_requested (system role)
    role_requested = role_requested.toLowerCase();

    const allowedRoleRequested = ["buyer", "supplier", "oem"];

    if (!allowedRoleRequested.includes(role_requested)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role_requested. Allowed: buyer, supplier, oem",
      });
    }

    // Normalize role_in_ev (business descriptor)
    const roleInEvMap = {
      oem: "OEMs",
      oems: "OEMs",
      supplier: "Supplier",
      both: "Both",
    };

    role_in_ev =
      roleInEvMap[role_in_ev.toLowerCase()] || role_in_ev;

    const allowedRoleInEv = ["OEMs", "Supplier", "Both"];

    if (!allowedRoleInEv.includes(role_in_ev)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role_in_ev. Allowed: OEMs, Supplier, Both",
      });
    }

    /* =====================================================
       3️⃣ META DATA
    ===================================================== */

    const ip_address =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const user_agent = req.headers["user-agent"];

    /* =====================================================
       4️⃣ INSERT INTO DB
    ===================================================== */

    const result = await pool.query(
      `
      INSERT INTO public.network_access_requests (
        company_name,
        website,
        registered_address,
        city_state,
        contact_name,
        role_requested,
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
        ip_address,
        user_agent,
        status,
        created_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,
        'pending',
        NOW()
      )
      RETURNING id
      `,
      [
        company_name.trim(),
        website || null,
        registered_address || null,
        city_state.trim(),
        contact_name.trim(),
        role_requested,
        email.toLowerCase().trim(),
        phone.trim(),
        JSON.stringify(what_you_do || {}),
        primary_product.trim(),
        key_components.trim(),
        manufacturing_locations.trim(),
        monthly_capacity.trim(),
        certifications || null,
        role_in_ev,
        why_join_axo.trim(),
        ip_address,
        user_agent,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Request submitted successfully",
      requestId: result.rows[0].id,
    });

  } catch (err) {
    console.error("❌ Network Submit Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};