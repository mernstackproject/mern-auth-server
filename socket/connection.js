const users = {}; // To map userId to socketId
let Io; // To hold the socket.io instance
const jwt = require("jsonwebtoken");

function connection(io) {
  Io = io;

  // When a new socket connection happens
  Io.on('connection', (socket) => {
    console.log('New connection', socket.id);

    socket.on('login', (token) => {
      const userId = verifyToken(token);
      if (userId) {
        if (!users[userId]) {
          users[userId] = [];
        }
        users[userId].push(socket.id);
        console.log(`User ${userId} logged in with socket ID ${socket.id}`);
        socket.join(userId); // Join the user-specific room
        io.emit("hello" , {message:"hello everyone"})
        // Emit notification to the current user
        sendNotificationToUser(userId);
      } else {
        console.log('Invalid token, disconnecting socket');
        socket.disconnect();
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      for (const userId in users) {
        const socketIndex = users[userId].indexOf(socket.id);
        if (socketIndex !== -1) {
          users[userId].splice(socketIndex, 1); 
          console.log(`Socket ${socket.id} disconnected for user ${userId}`);
          if (users[userId].length === 0) {
            delete users[userId]; 
          }
          break;
        }
      }
    });
  });
}

// Utility function to send a notification to a specific user
function sendNotificationToUser(userId) {
  if (users[userId] && users[userId].length > 0) {
    users[userId].forEach((socketId) => {
      Io.to(socketId).emit('login-notification', { message: "hello" });
    });
  } else {
    console.log(`User ${userId} is not connected`);
  }
}

// JWT Verification
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    return decoded.userId;
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return null;
  }
}

module.exports = { connection, sendNotificationToUser };
