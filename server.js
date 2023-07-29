require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Image = require('./models/images.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());

/**
 * TODO
 * - I've successfully stored image data to mongoDB Atlas
 * - now I need to translate that data back into an image for the frontend
 * - still need to find a way to connect OBS websocket to my server
 * - find a way to rotate images
 */


// Connect to MongoDB
mongoose.connect(`${process.env.MONGO_URI}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then( () => {
  console.log('connected to mongoDB');
}).catch( err => {
  console.log(err);
});

// For debugging if mongoose is unable to connect to mongoDB
const db = mongoose.connection;
db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});
db.once('open', () => {
  console.log('Connected to MongoDB');
});


// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle when a client sends a message
  socket.on('message', message => {
    console.log(message);
    io.emit('message', message);
  })

  // Handle 'previewImage' event from the client
  socket.on('previewImage', (imageData) => {
    // Broadcast the image data to all connected clients (except the sender)
    socket.broadcast.emit('newImage', imageData);
  });

  socket.on('uploadImage', (data) => {
    try {
      // Store the image data in MongoDB
      const image = new Image({ imageData: data });
      image.save().then( () => {
        // Broadcast the image data to all connected clients
        socket.broadcast.emit('newImage', data);
      });
    } catch (error) {
      console.error('Error saving image:', error);
    }
  });

  // Handle when a client disconnects
  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

server.listen(`${process.env.PORT}`, () => {
  console.log(`listening on *:${process.env.PORT}`);
});