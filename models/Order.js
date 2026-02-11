const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // RFQ Information
  rfqNumber: { type: String, unique: true },
  title: { type: String, required: true },
  description: String,
  
  // Buyer Information
  buyerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  buyerCompany: String,
  buyerContact: String,
  buyerEmail: String,
  
  // Product Details
  productName: { type: String, required: true },
  category: String,
  specifications: String,
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'units' },
  
  // Requirements
  qualityStandards: [String],
  certificationsRequired: [String],
  materialRequirements: String,
  
  // Timeline
  deliveryDate: Date,
  deadlineForQuotes: Date,
  createdAt: { type: Date, default: Date.now },
  
  // Budget
  budgetRange: String,
  currency: { type: String, default: 'USD' },
  
  // Status
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'open', 'closed', 'awarded', 'cancelled'],
    default: 'pending'
  },
  
  // Quotes from suppliers
  quotes: [{
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: String,
    quotedPrice: Number,
    deliveryTime: String,
    validity: Date,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    submittedAt: { type: Date, default: Date.now }
  }],
  
  // Selected supplier
  selectedSupplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  awardedPrice: Number,
  awardedDate: Date,
  
  // Files/Attachments
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }],
  
  updatedAt: { type: Date, default: Date.now }
});

// Generate RFQ number before saving
orderSchema.pre('save', async function(next) {
  if (!this.rfqNumber) {
    const count = await this.constructor.countDocuments();
    this.rfqNumber = `RFQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
