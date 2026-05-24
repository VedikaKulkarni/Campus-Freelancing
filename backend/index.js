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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


app.use("/api/auth", authRoutes);
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));


app.get("/", (req, res) => {
  res.send("Server is Running");
});

// Socket.io Real-time Event Handlers
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");

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

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});