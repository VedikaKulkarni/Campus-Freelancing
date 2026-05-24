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
  appliedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Application', applicationSchema);
