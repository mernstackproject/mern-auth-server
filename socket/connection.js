const jwt = require('jsonwebtoken');
const users = {}; 
let Io;


function connection(io) {
  Io = io;

  Io.on('connection', (socket) => {
    console.log('New connection');
    if (!users[socket.id]) {
      users[socket.id] = socket.id;
      Io.emit('all-users', users); 
    }
    socket.on('join-auction', (auctionId, token) => {
      const userId = handleJwtToken(token);
      if (userId) {
        socket.join(auctionId); 
        console.log(`User ${userId} joined auction ${auctionId}`);
        Io.to(socket.id).emit('auction-details', { auctionId, message: 'Welcome to the auction!' });
      } else {
        socket.emit('error', 'Invalid token');
      }
    });
    socket.on('bid', async (data) => {
      const token = socket.handshake.query.token;
      const userId = handleJwtToken(token);
      if (userId) {
        updateAuctionBidAndNotifyAllUsers(data.auctionId, userId, data);
      } else {
        socket.emit('error', 'Invalid token');
      }
    });
    socket.on('disconnect', () => {
      console.log('User disconnected');
      delete users[socket.id]; // Remove user from the user list
      Io.emit('all-users', users); // Emit updated users list globally
    });
  });
}
function updateAuctionBidAndNotifyAllUsers(auctionId, userId, data) {
  if (auctionId) {
    Io.emit('auction-update', {
      auctionId: auctionId,
      currentBid: data.bidAmount,
      bidder: userId,
      timestamp: new Date(),
    });
    Io.to(auctionId).emit('bid', {
      userId: userId,
      bidAmount: data.bidAmount,
      auctionId: auctionId,
      timestamp: new Date(),
    });

    console.log(`Bid from user ${userId} for auction ${auctionId}: ${data.bidAmount}`);
  } else {
    console.log("Auction not found for bid notification:", auctionId);
  }
}
function handleJwtToken(token) {
  if (!token) {
    console.log("Token not provided");
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    console.log("Invalid token");
    return null;
  }

  return decoded.id;
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}

// inside auction table i have the start time and i want to send the notification before 10 minutes of start time
// i wan to create cron job for this
const cron = require("node-cron")   

function scheduleAuctionNotifications() {
    cron.schedule('* * * * *', async () => {
      const now = new Date();
      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
  
      // Find auctions that start in the next 10 minutes
      const auctionsStartingSoon = await Auction.find({
        startTime: { $gte: now, $lt: tenMinutesFromNow }, // Auctions starting in the next 10 minutes
        status: 'upcoming', // Only upcoming auctions
      });
  
      if (auctionsStartingSoon.length > 0) {
        auctionsStartingSoon.forEach((auction) => {
          
          
          // Send a notification to all users in the auction room
          Io.to(auction._id.toString()).emit("auction-starting-soon", {
            message: `Auction "${auction.title}" is starting in 10 minutes!`
          });
  
          console.log(`Sent notification for auction "${auction.title}" starting soon.`);
        });
      } else {
        console.log("No auctions starting in the next 10 minutes.");
      }
    });
  }
  
function getIo() {
  if (!Io) {
    throw new Error('Socket.io is not connected');
  }
  return Io;
}

module.exports = { connection, getIo };
