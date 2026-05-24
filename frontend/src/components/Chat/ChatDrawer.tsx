import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, Send, X, Calendar, Video, Clock } from 'lucide-react';
import './ChatDrawer.css';

interface Participant {
  userId: string;
  role: 'student' | 'client';
  name: string;
}

interface LastMessage {
  text: string;
  senderId: string;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  taskId: string;
  taskTitle: string;
  lastMessage?: LastMessage;
  updatedAt: string;
  createdAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'student' | 'client';
  senderName: string;
  text: string;
  createdAt: string;
}

interface ActiveChatSession {
  targetId: string;
  targetName: string;
  taskId: string;
  taskTitle: string;
}

interface ChatDrawerProps {
  userId: string | null;
  userRole: string | null;
  userName: string;
  activeChatSession: ActiveChatSession | null;
  onClearActiveChatSession: () => void;
}

// Keep a single persistent socket instance outside of render to prevent double-connections in React dev mode
let socketInstance: Socket | null = null;

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  userId,
  userRole,
  userName,
  activeChatSession,
  onClearActiveChatSession
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Scheduling states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingDate, setMeetingDate] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!userId) return;

    if (!socketInstance) {
      socketInstance = io('http://localhost:5000');
    }
    socketRef.current = socketInstance;

    // Register user room
    socketRef.current.emit('register', userId);

    // Socket message listeners
    socketRef.current.on('new_message', (message: Message) => {
      // 1. If message belongs to currently open active conversation, append to list
      setActiveConversation(currActive => {
        if (currActive && currActive._id === message.conversationId) {
          setMessages(prev => {
            // Avoid duplicate appends
            if (prev.some(m => m._id === message._id)) return prev;
            return [...prev, message];
          });
        } else {
          // If drawer is closed or user is in a different chat, bump notifications
          setUnreadCount(prev => prev + 1);
        }
        return currActive;
      });

      // 2. Fetch/update conversations list in background to refresh lastMessage
      fetchConversations();
    });

    // Fetch initial conversations list
    fetchConversations();

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new_message');
      }
    };
  }, [userId]);

  // Scroll to bottom of message list whenever messages change or drawer opens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Fetch Conversations from API
  const fetchConversations = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`http://localhost:5000/api/chat/conversations/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch user conversations:', err);
    }
  };

  // Fetch Messages for Selected Conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversation messages:', err);
    }
  };

  // Select a conversation from list
  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    fetchMessages(conv._id);
    // Decrease unread count when opening conversation (simulated reset)
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Handle active session triggers (e.g. clicked Chat button on dashboard)
  useEffect(() => {
    if (!userId || !activeChatSession) return;

    const initiateActiveChat = async () => {
      const payload = {
        studentId: userRole === 'student' ? userId : activeChatSession.targetId,
        clientId: userRole === 'client' ? userId : activeChatSession.targetId,
        taskId: activeChatSession.taskId
      };

      try {
        const response = await fetch('http://localhost:5000/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const conv: Conversation = await response.json();
          // Insert conversation or update in list
          setConversations(prev => {
            if (prev.some(c => c._id === conv._id)) return prev;
            return [conv, ...prev];
          });
          setActiveConversation(conv);
          fetchMessages(conv._id);
          setIsOpen(true);
        } else {
          console.error('Failed to create/fetch targeted chat session');
        }
      } catch (err) {
        console.error('Failed to connect to chat API:', err);
      } finally {
        // Clear active session trigger in dashboard parent state
        onClearActiveChatSession();
      }
    };

    initiateActiveChat();
  }, [activeChatSession, userId, userRole]);

  // Handle Message Submit
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation || !userId) return;

    const payload = {
      conversationId: activeConversation._id,
      senderId: userId,
      senderRole: userRole,
      senderName: userName,
      text: inputText.trim()
    };

    // Emit message in real-time over WebSocket connection
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', payload);
    } else {
      // Fallback: Send message over HTTP REST API if socket is down
      fetch(`http://localhost:5000/api/chat/conversations/${activeConversation._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(async (res) => {
          if (res.ok) {
            const msg = await res.json();
            setMessages(prev => [...prev, msg]);
            fetchConversations();
          }
        })
        .catch(err => console.error('REST message sending failed:', err));
    }

    setInputText('');
  };

  // Handle Meeting Schedule Submit
  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTopic.trim() || !meetingDate || !activeConversation || !userId) return;

    const studentParticipant = activeConversation.participants.find(p => p.role === 'student');

    const payload = {
      conversationId: activeConversation._id,
      topic: meetingTopic.trim(),
      meetingDate,
      clientId: userId,
      studentId: studentParticipant ? studentParticipant.userId : '',
      clientName: userName,
      studentName: studentParticipant ? studentParticipant.name : 'Student'
    };

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('schedule_meeting', payload);
    } else {
      // HTTP fallback
      fetch(`http://localhost:5000/api/chat/conversations/${activeConversation._id}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setMessages(prev => [...prev, data.message]);
            fetchConversations();
          }
        })
        .catch(err => console.error('REST meeting schedule failed:', err));
    }

    setMeetingTopic('');
    setMeetingDate('');
    setIsScheduleModalOpen(false);
  };

  // Helper: Format message timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper: Get recipient name out of conversation participants
  const getRecipientName = (conv: Conversation) => {
    const recipient = conv.participants.find(p => p.userId !== userId);
    return recipient ? recipient.name : 'Participant';
  };

  // Helper: Get recipient initial for avatar
  const getRecipientInitial = (conv: Conversation) => {
    const name = getRecipientName(conv);
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      {/* Floating Glassmorphic Bubble Trigger Button */}
      <button 
        className="chat-trigger-bubble" 
        onClick={() => setIsOpen(!isOpen)}
        title="Open Real-time Project Chats"
      >
        <MessageSquare size={26} />
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {/* Slide-out Panel Overlay Container */}
      <div className={`chat-drawer-container ${isOpen ? 'open' : ''}`}>
        
        {/* LEFT PANEL: CONVERSATIONS LIST */}
        <div className="chat-conversations-pane">
          <div className="conversations-header">
            <h3>
              <MessageSquare size={20} style={{ color: 'var(--chat-accent)' }} /> 
              <span>Milestone Chats</span>
            </h3>
            <button className="close-drawer-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="conversations-list">
            {conversations.length > 0 ? (
              conversations.map((conv) => {
                const isActive = activeConversation?._id === conv._id;
                return (
                  <div 
                    key={conv._id} 
                    className={`conversation-card ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="conversation-avatar">
                      {getRecipientInitial(conv)}
                    </div>
                    <div className="conversation-card-details">
                      <div className="card-header-row">
                        <h4>{getRecipientName(conv)}</h4>
                        <span>{conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}</span>
                      </div>
                      <div className="task-title-badge" title={conv.taskTitle}>
                        💼 {conv.taskTitle}
                      </div>
                      <p className="last-msg-preview">
                        {conv.lastMessage ? conv.lastMessage.text : 'No messages yet.'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '30px 20px', color: 'var(--chat-text-muted)', fontSize: '13px' }}>
                <p>No active task contracts started.</p>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>
                  Once you hire a student or get hired for a gig, your real-time secure contract chat room will automatically spawn here!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CHAT FEED SCREEN */}
        <div className="chat-messages-pane">
          {activeConversation ? (
            <>
              {/* Active Conversation Header */}
              <div className="active-chat-header">
                <div className="recipient-info">
                  <h4>{getRecipientName(activeConversation)}</h4>
                  <p className="task-subtitle">📍 Contract: {activeConversation.taskTitle}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {userRole === 'client' && (
                    <button 
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px', background: '#10b981', borderColor: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '100px', fontWeight: 600 }}
                      onClick={() => setIsScheduleModalOpen(true)}
                    >
                      <Calendar size={13} /> Schedule Meet
                    </button>
                  )}
                  <div className="online-badge">
                    <span className="dot"></span>
                    <span>Secure Escrow Room</span>
                  </div>
                </div>
              </div>

              {/* Message History Feed */}
              <div className="chat-messages-scroll">
                {messages.map((msg) => {
                  const isSentByMe = String(msg.senderId) === String(userId);
                  const isMeetingMessage = msg.text.startsWith('[MEETING_SCHEDULED]');
                  
                  if (isMeetingMessage) {
                    const parts = msg.text.replace('[MEETING_SCHEDULED] ', '').split('|');
                    const topic = parts[0] || 'Sync Meeting';
                    const dateString = parts[1] || '';
                    const meetLink = parts[2] || '#';
                    
                    const formattedMeetDate = dateString ? new Date(dateString).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Scheduled';

                    return (
                      <div key={msg._id} className="chat-message-row system-meeting-align">
                        <div className="chat-meeting-card bg-glass">
                          <div className="card-top-glow"></div>
                          <div className="meeting-card-header">
                            <span className="meeting-badge">📅 GOOGLE MEET SYNC</span>
                            <h4>{topic}</h4>
                          </div>
                          <div className="meeting-card-details">
                            <p style={{ margin: '0 0 4px', fontSize: '13px' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> <strong>Time:</strong> {formattedMeetDate}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--chat-text-muted)', marginTop: '4px' }}>Scheduled by {msg.senderName}</p>
                          </div>
                          <a 
                            href={meetLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="chat-meeting-join-btn"
                          >
                            <Video size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Join Google Meet
                          </a>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg._id} 
                      className={`chat-message-row ${isSentByMe ? 'sent' : 'received'}`}
                    >
                      <div className="chat-bubble">
                        {msg.text}
                      </div>
                      <div className="message-meta">
                        <span>{msg.senderName}</span>
                        <span>•</span>
                        <span>{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Send Input Box */}
              <div className="chat-input-bar">
                <form className="chat-input-form" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    placeholder="Discuss milestone specifications..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    required
                  />
                  <button type="submit" title="Send Message">
                    <Send size={15} />
                  </button>
                </form>
              </div>

              {/* Schedule Meeting Modal Glass Overlay */}
              {isScheduleModalOpen && (
                <div className="meeting-modal-overlay">
                  <div className="meeting-modal-content bg-glass">
                    <button className="modal-close-btn" style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--chat-text)', cursor: 'pointer' }} onClick={() => setIsScheduleModalOpen(false)}>
                      <X size={18} />
                    </button>
                    
                    <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                      <span className="meeting-badge">📅 GOOGLE MEET SCHEDULE</span>
                      <h4 style={{ margin: '6px 0 0', fontSize: '17px', color: 'var(--chat-text)' }}>Schedule Milestone Review</h4>
                    </div>

                    <form onSubmit={handleScheduleMeeting}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--chat-text-muted)' }}>Sync Topic / Milestone Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Test Landing Page Escrow release"
                            value={meetingTopic}
                            onChange={(e) => setMeetingTopic(e.target.value)}
                            style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--chat-border)', borderRadius: '8px', color: 'var(--chat-text)', outline: 'none', fontSize: '13px' }}
                            required
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--chat-text-muted)' }}>Scheduled Date & Time</label>
                          <input 
                            type="datetime-local" 
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--chat-border)', borderRadius: '8px', color: 'var(--chat-text)', outline: 'none', fontSize: '13px' }}
                            required
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="button" className="btn-secondary-dash" style={{ flex: 1, padding: '10px 0', fontSize: '13px' }} onClick={() => setIsScheduleModalOpen(false)}>
                            Cancel
                          </button>
                          <button type="submit" className="btn-primary-dash" style={{ flex: 1, padding: '10px 0', background: '#10b981', borderColor: '#10b981', fontSize: '13px', fontWeight: 600 }}>
                            Schedule Sync
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty Chat State */
            <div className="chat-empty-feed">
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '16px' }}>
                <MessageSquare size={36} style={{ color: 'var(--chat-accent)' }} />
              </div>
              <h4>Your Private Message Board</h4>
              <p>Select a contract conversation from the left pane to begin discussing tasks and sharing file coordinates securely.</p>
            </div>
          )}
        </div>

      </div>
    </>
  );
};
