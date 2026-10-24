import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getSocketURL } from '../../api/axiosInstance';
import Button from '../common/Button';
import { Send, MessageSquare, Check, CheckCheck, User } from 'lucide-react';

const ChatWindow = ({ currentUser, partnerUser, roomName }) => {
  const [messages, setMessages] = useState([
    {
      id: 'init_1',
      senderRole: partnerUser?.role || 'therapist',
      senderName: partnerUser?.name || 'Therapist',
      text: 'Namaste! Welcome to our confidential practice communication channel. Feel free to leave messages here between scheduled sessions.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const room = roomName || `room_${partnerUser?.id || 'default'}_${currentUser?.id || 'user'}`;

  useEffect(() => {
    // Connect to Socket.io backend server
    const socketServerUrl = getSocketURL();
    const socket = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.emit('join_room', {
      room,
      user: {
        id: currentUser?.id,
        name: currentUser?.name,
        role: currentUser?.role || 'user',
      },
    });

    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user_typing', ({ userName, isTyping: typingStatus }) => {
      if (typingStatus && userName !== currentUser?.name) {
        setTypingUser(userName);
        setIsTyping(true);
      } else {
        setIsTyping(false);
        setTypingUser('');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [room, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Emit typing indicator
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        room,
        userName: currentUser?.name || 'User',
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing', {
          room,
          userName: currentUser?.name || 'User',
          isTyping: false,
        });
      }, 1500);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageData = {
      room,
      text: inputText.trim(),
      senderId: currentUser?.id,
      senderName: currentUser?.name || 'User',
      senderRole: currentUser?.role || 'user',
    };

    if (socketRef.current) {
      socketRef.current.emit('send_message', messageData);
    } else {
      // Local fallback
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          ...messageData,
          timestamp: new Date().toISOString(),
          read: false,
        },
      ]);
    }

    setInputText('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
            {partnerUser?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
              {partnerUser?.name || 'Chat Conversation'}
            </h4>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Encrypted Channel
            </span>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
        {messages.map((msg, idx) => {
          const isMe = msg.senderRole === currentUser?.role || msg.senderId === currentUser?.id;
          return (
            <div
              key={idx}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-2xs leading-relaxed ${
                  isMe
                    ? 'bg-teal-600 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {!isMe && (
                  <span className="block text-[10px] font-bold text-teal-700 mb-0.5">
                    {msg.senderName}
                  </span>
                )}
                <p>{msg.text}</p>
                <div
                  className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                    isMe ? 'text-teal-100' : 'text-slate-400'
                  }`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMe && <CheckCheck className="w-3 h-3 text-teal-200" />}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="text-xs text-slate-400 italic flex items-center gap-1 animate-pulse">
            <span>{typingUser} is typing</span>
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-100" />
              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-200" />
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type message..."
          className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <Button variant="primary" type="submit" size="sm" icon={Send}>
          Send
        </Button>
      </form>
    </div>
  );
};

export default ChatWindow;
