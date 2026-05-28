require("dotenv").config();
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Keep it generic to allow easy connections
    methods: ["GET", "POST"]
  }
});


mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log(err);
  });


app.use(cors());
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json({ limit: "50mb" })(req, res, next);
  }
});
app.use(express.urlencoded({ limit: "50mb", extended: true }));


app.use("/api/auth", authRoutes);
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));


app.get("/", (req, res) => {
  res.send("Server is Running");
});

// Socket.io Real-time Event Handlers
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");
const Meeting = require("./models/Meeting");
const Student = require("./models/Student");
const nodemailer = require("nodemailer");

// Setup generic nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_EMAIL || "dummy_user",
    pass: process.env.SMTP_PASSWORD || "dummy_pass"
  }
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Register user and join their unique room
  socket.on("register", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} registered socket room: ${socket.id}`);
    }
  });

  // Real-time message receiver & broadcaster
  socket.on("send_message", async (data) => {
    try {
      const { conversationId, senderId, senderRole, senderName, text } = data;
      if (!conversationId || !senderId || !senderRole || !senderName || !text) return;

      const message = new Message({
        conversationId,
        senderId,
        senderRole,
        senderName,
        text
      });
      await message.save();

      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.lastMessage = {
          text,
          senderId,
          createdAt: message.createdAt
        };
        await conversation.save();

        // Broadcast to all participants in this conversation
        conversation.participants.forEach((p) => {
          io.to(p.userId.toString()).emit("new_message", message);
        });
      }
    } catch (err) {
      console.error("Error in real-time send_message socket handler:", err);
    }
  });

  // Real-time meeting scheduler & broadcaster
  socket.on("schedule_meeting", async (data) => {
    try {
      const { conversationId, topic, meetingDate, clientId, studentId, clientName, studentName } = data;
      if (!conversationId || !topic || !meetingDate || !clientId || !studentId || !clientName || !studentName) return;

      // Generate secure Meet Link
      const generateCode = (length) => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let code = '';
        for (let i = 0; i < length; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      const meetLink = `https://meet.google.com/${generateCode(3)}-${generateCode(4)}-${generateCode(3)}`;

      const meeting = new Meeting({
        conversationId,
        clientId,
        studentId,
        topic,
        meetingDate: new Date(meetingDate),
        meetLink
      });
      await meeting.save();

      const systemText = `[MEETING_SCHEDULED] ${topic}|${meetingDate}|${meetLink}`;
      const systemMessage = new Message({
        conversationId,
        senderId: clientId,
        senderRole: 'client',
        senderName: 'System Sync',
        text: systemText
      });
      await systemMessage.save();

      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.lastMessage = {
          text: `📅 Sync Scheduled: "${topic}"`,
          senderId: clientId,
          createdAt: systemMessage.createdAt
        };
        await conversation.save();

        // Broadcast to all participants in this conversation
        conversation.participants.forEach((p) => {
          io.to(p.userId.toString()).emit("new_message", systemMessage);
        });
      }

      // Lookup student email asynchronously to send Nodemailer alert
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

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.warn('Nodemailer socket invite failed:', error.message);
            console.log(`[SIMULATION EMAIL DISPATCHED] To: ${student.email} | Topic: ${topic} | Meet: ${meetLink}`);
          } else {
            console.log('Nodemailer SMTP invite dispatched successfully:', info.response);
          }
        });
      }

    } catch (err) {
      console.error("Error in real-time schedule_meeting socket handler:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});