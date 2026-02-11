const express = require("express");
const multer = require("multer");
const path = require("path");
const pool = require("../src/config/db"); // ✅ FIXED

const router = express.Router();

/* ===================== MULTER CONFIG ===================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/rfq");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ===================== UPLOAD RFQ FILE ===================== */
router.post("/:rfq_id", upload.single("file"), async (req, res) => {
  try {
    const { rfq_id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileType = path.extname(req.file.originalname).replace(".", "");

    const result = await pool.query(
      `INSERT INTO rfq_files
       (rfq_id, file_name, file_type, file_url)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [
        rfq_id,
        req.file.originalname,
        fileType,
        req.file.path,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("RFQ file upload error:", error);
    res.status(500).json({
      success: false,
      message: "File upload failed",
    });
  }
});

module.exports = router;
