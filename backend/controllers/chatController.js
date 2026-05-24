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

// ==========================================
// GOOGLE MEET SCHEDULER & NOTIFIER
// ==========================================
const Meeting = require('../models/Meeting');
const nodemailer = require('nodemailer');

// Setup generic nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_EMAIL || "dummy_user",
    pass: process.env.SMTP_PASSWORD || "dummy_pass"
  }
});

exports.scheduleMeeting = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { topic, meetingDate, clientId, studentId, clientName, studentName } = req.body;

    if (!topic || !meetingDate || !clientId || !studentId || !clientName || !studentName) {
      return res.status(400).json({ message: 'All scheduling parameters are required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Generate a unique Google Meet formatted link: meet.google.com/xxx-yyyy-zzz
    const generateCode = (length) => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    const meetLink = `https://meet.google.com/${generateCode(3)}-${generateCode(4)}-${generateCode(3)}`;

    // Create the meeting document
    const meeting = new Meeting({
      conversationId,
      clientId,
      studentId,
      topic,
      meetingDate: new Date(meetingDate),
      meetLink
    });
    await meeting.save();

    // Create a special system message representing the scheduled meeting
    const systemText = `[MEETING_SCHEDULED] ${topic}|${meetingDate}|${meetLink}`;
    const systemMessage = new Message({
      conversationId,
      senderId: clientId,
      senderRole: 'client',
      senderName: 'System Sync',
      text: systemText
    });
    await systemMessage.save();

    // Update conversation lastMessage
    conversation.lastMessage = {
      text: `📅 Sync Scheduled: "${topic}"`,
      senderId: clientId,
      createdAt: systemMessage.createdAt
    };
    await conversation.save();

    // Lookup student email asynchronously to send the Nodemailer alert
    const student = await Student.findById(studentId);
    if (student && student.email) {
      const formattedDate = new Date(meetingDate).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      const mailOptions = {
        from: '"CampusLance Sync" <sync@campuslance.com>',
        to: student.email,
        subject: `📅 Scheduled Google Meet Sync: ${topic}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
            <h2 style="color: #3b82f6; margin-top: 0;">Milestone Sync Scheduled</h2>
            <p>Hi <strong>${studentName}</strong>,</p>
            <p>Your client <strong>${clientName}</strong> has scheduled a secure milestone review video meeting regarding your active contract.</p>
            
            <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 20px 0;">
              <p style="margin: 0 0 8px;"><strong>Milestone Topic:</strong> ${topic}</p>
              <p style="margin: 0 0 8px;"><strong>Date & Time:</strong> ${formattedDate}</p>
              <p style="margin: 0;"><strong>Join Link:</strong> <a href="${meetLink}" style="color: #3b82f6; text-decoration: underline;">${meetLink}</a></p>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${meetLink}" target="_blank" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);">
                Join Google Meet Sync
              </a>
            </div>
            
            <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              You can also open the sync drawer inside your student dashboard project chat to click join or chat in real-time.
            </p>
          </div>
        `
      };

      // Dispatch e-mail, catch silent errors if local SMTP configurations are dummy
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.warn('Nodemailer SMTP email dispatch failed (using fallback simulation):', error.message);
          console.log(`[SIMULATION EMAIL DISPATCHED] To: ${student.email} | Topic: ${topic} | Meet: ${meetLink}`);
        } else {
          console.log('Nodemailer SMTP calendar invite dispatched successfully:', info.response);
        }
      });
    }

    res.status(201).json({ message: systemMessage, meeting });
  } catch (error) {
    console.error('Error in scheduleMeeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

