/**
 * Socket.io handlers for real-time therapy communication
 */
const setupChatSocket = (io) => {
  const activeRooms = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket Connected] Socket ID: ${socket.id}`);

    // Join dedicated room for Therapist-Client pair
    socket.on('join_room', ({ room, user }) => {
      socket.join(room);
      console.log(`[Socket] User ${user?.name || socket.id} (${user?.role || 'guest'}) joined room: ${room}`);

      // Notify others in room
      socket.to(room).emit('user_joined', {
        user,
        message: `${user?.name || 'A user'} entered the chat room.`,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle new message
    socket.on('send_message', (data) => {
      const { room, text, senderId, senderName, senderRole } = data;

      const messagePayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        room,
        text,
        senderId,
        senderName,
        senderRole, // 'therapist' | 'client'
        timestamp: new Date().toISOString(),
        read: false,
      };

      // Broadcast to all participants in room including sender confirmation
      io.to(room).emit('receive_message', messagePayload);
    });

    // Handle typing indicator
    socket.on('typing', ({ room, userName, isTyping }) => {
      socket.to(room).emit('user_typing', { userName, isTyping });
    });

    // Handle read receipt
    socket.on('mark_read', ({ room, messageId, readBy }) => {
      socket.to(room).emit('message_read', {
        messageId,
        readBy,
        readAt: new Date().toISOString(),
      });
    });

    socket.on('leave_room', ({ room, user }) => {
      socket.leave(room);
      socket.to(room).emit('user_left', { user });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected] Socket ID: ${socket.id}`);
    });
  });
};

module.exports = setupChatSocket;
