const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  studentCollege: {
    type: String,
  },
  studentYear: {
    type: String,
  },
  studentEmail: {
    type: String,
  },
  proposal: {
    type: String,
    required: true,
  },
  projectLinks: {
    type: [{
      title: String,
      url: String
    }],
    default: [],
  },
  status: {
    type: String,
    enum: ['Pending', 'Interviewing', 'Hired', 'Rejected'],
    default: 'Pending',
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Held in Escrow', 'Released', 'Refunded'],
    default: 'Unpaid'
  },
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  stripeTransferId: {
    type: String,
    default: null
  },
  escrowFundedAt: {
    type: Date,
    default: null
  },
  escrowReleasedAt: {
    type: Date,
    default: null
  },
  deliverables: {
    githubUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    screenshots: { type: [String], default: [] },
    videoUrl: { type: String, default: '' },
    submittedAt: { type: Date, default: null }
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Application', applicationSchema);
