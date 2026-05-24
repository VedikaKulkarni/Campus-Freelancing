const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    role: {
      type: String,
      enum: ['student', 'client'],
      required: true
    },
    name: {
      type: String,
      required: true
    }
  }],
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true // Since it's task-related only
  },
  taskTitle: {
    type: String,
    required: true
  },
  lastMessage: {
    text: String,
    senderId: mongoose.Schema.Types.ObjectId,
    createdAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
