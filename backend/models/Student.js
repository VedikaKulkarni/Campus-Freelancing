const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  classOrYear: {
    type: String,
    required: true,
  },
  schoolOrCollegeName: {
    type: String,
    required: true,
  },
  enrollmentNumber: {
    type: String,
    required: true,
  },
  idCardImage: {
    type: String, // Will store the URL/path to the uploaded image
    required: true,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  skills: {
    type: [String],
    default: [],
  },
  bio: {
    type: String,
    default: '',
  },
  projectLinks: {
    type: [{
      title: String,
      url: String
    }],
    default: [],
  },
  stripeAccountId: {
    type: String,
    default: null
  },
  stripeOnboardingComplete: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Student', studentSchema);
