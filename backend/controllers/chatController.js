const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Student = require('../models/Student');
const Client = require('../models/Client');
const Task = require('../models/Task');
const mongoose = require('mongoose');

// Get or Create a conversation for a specific Task
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { studentId, clientId, taskId } = req.body;

    if (!studentId || !clientId || !taskId) {
      return res.status(400).json({ message: 'studentId, clientId, and taskId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId) || 
        !mongoose.Types.ObjectId.isValid(clientId) || 
        !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid Object IDs provided' });
    }

    // Check if task exists and get title
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Try finding existing conversation for this Task
    let conversation = await Conversation.findOne({ taskId: taskId });

    if (!conversation) {
      // Fetch names from Student & Client databases
      const student = await Student.findById(studentId);
      const client = await Client.findById(clientId);

      if (!student || !client) {
        return res.status(404).json({ message: 'Student or Client profile not found in database' });
      }

      conversation = new Conversation({
        participants: [
          { userId: student._id, role: 'student', name: student.name },
          { userId: client._id, role: 'client', name: client.name }
        ],
        taskId: task._id,
        taskTitle: task.title,
        lastMessage: {
          text: 'Contract initiated. Say hi!',
          senderId: client._id,
          createdAt: new Date()
        }
      });

      await conversation.save();

      // Save a default greeting message in history
      const initialMessage = new Message({
        conversationId: conversation._id,
        senderId: client._id,
        senderRole: 'client',
        senderName: client.name,
        text: 'Contract initiated. Say hi!'
      });
      await initialMessage.save();
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all conversations for a specific User
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    const conversations = await Conversation.find({
      'participants.userId': userId
    }).sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error in getUserConversations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get messages for a Conversation
exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'Invalid Conversation ID' });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// HTTP Fallback to send messages
exports.sendMessageHttp = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderId, senderRole, senderName, text } = req.body;

    if (!senderId || !senderRole || !senderName || !text) {
      return res.status(400).json({ message: 'All message parameters are required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const message = new Message({
      conversationId,
      senderId,
      senderRole,
      senderName,
      text
    });

    await message.save();

    // Update conversation lastMessage
    conversation.lastMessage = {
      text,
      senderId,
      createdAt: message.createdAt
    };
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Error in sendMessageHttp:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
