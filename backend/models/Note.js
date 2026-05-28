const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  sellerName: {
    type: String,
    required: true,
  },
  fileData: {
    type: String, // base64 payload of the uploaded PDF or Word document
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  previewData: {
    type: [String], // Slices/pages for standard previews (e.g. Page 1 & Page 2)
    default: [],
  },
  buyers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: [],
  }],
  reviews: [{
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    reviewerName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Note', noteSchema);
