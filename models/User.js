const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  tempPassword: { 
    type: String, 
    required: true 
  },
  forcePasswordReset: { 
    type: Boolean, 
    default: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  company: { 
    type: String, 
    required: true 
  },
  phone: String,
  
  // User type and roles
  userType: { 
    type: String, 
    enum: ['buyer', 'supplier', 'oem', 'admin', 'both'], 
    default: 'supplier' 
  },
  
  roles: {
    buyer: { type: Boolean, default: false },
    supplier: { type: Boolean, default: false },
    oem: { type: Boolean, default: false },
    admin: { type: Boolean, default: false }
  },
  
  // Company profile
  companyType: String,
  industry: [String],
  location: String,
  certifications: [String],
  manufacturingCapacity: String,
  
  // Stats for dashboard
  profileCompletion: { type: Number, default: 0 },
  reliabilityScore: { type: Number, default: 100 },
  completedOrders: { type: Number, default: 0 },
  pendingOrders: { type: Number, default: 0 },
  responseRate: { type: Number, default: 0 },
  
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'users' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // First check against temporary password (plain text)
    if (candidatePassword === this.tempPassword) {
      return true;
    }
    
    // Then check against hashed password
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Update timestamp on update
userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('User', userSchema);
