require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ---------------- MONGODB ---------------- */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

/* ---------------- SCHEMAS ---------------- */

// SUPPLIER
const SupplierSchema = new mongoose.Schema({
  companyName: String,
  contactPerson: String,
  email: String,
  location: String,
  components: String,
  createdAt: { type: Date, default: Date.now }
});

// OEM
const OemSchema = new mongoose.Schema({
  companyName: String,
  contactPerson: String,
  email: String,
  website: String,
  programContext: String,
  componentsNeeded: String,
  volume: String,
  regions: String,
  createdAt: { type: Date, default: Date.now }
});

// FINANCE
const FinanceSchema = new mongoose.Schema({
  companyName: String,
  contactPerson: String,
  email: String,
  fundingType: String,
  amount: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Supplier = mongoose.model("Supplier", SupplierSchema);
const OEM = mongoose.model("OEM", OemSchema);
const Finance = mongoose.model("Finance", FinanceSchema);

/* ---------------- PAGES ---------------- */
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public/index.html"))
);

app.get("/supplier", (_, res) =>
  res.sendFile(path.join(__dirname, "public/supplier.html"))
);

app.get("/oem", (_, res) =>
  res.sendFile(path.join(__dirname, "public/oem.html"))
);

app.get("/finance", (_, res) =>
  res.sendFile(path.join(__dirname, "public/finance.html"))
);

/* ---------------- APIs ---------------- */

// Supplier form
app.post("/api/supplier", async (req, res) => {
  try {
    await Supplier.create(req.body);
    res.json({ success: true, message: "Supplier data saved" });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// OEM form
app.post("/api/oem", async (req, res) => {
  try {
    await OEM.create(req.body);
    res.json({ success: true, message: "OEM data saved" });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// Finance form
app.post("/api/finance", async (req, res) => {
  try {
    await Finance.create(req.body);
    res.json({ success: true, message: "Finance data saved" });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

/* ---------------- START ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

