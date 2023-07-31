require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE", "PUT"]
  }
});

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Routes
const imageRoutes = require('./routes/imageRoutes');
app.use('/images', imageRoutes);

/**
 * TODO
 * - change z-index of images upon - or = keypress
 * - update the translate and rotate values in mongoDB when the image is moved or rotated
 * - have app hosted on Render
 * - add support for text
 * - add opacity slider??
 * - dump mongoDB collection every midnight
 * - there is a slight hitch (event processing delay) on the initial 
 * move when trying to move an image that has a big file size, 
 * I am considering using web workers to handle interactjs events
 * Or I could look into using GridFS to compress the images
 * 
 * Bugs
 * - upon deleting an image that precedes other uploaded images, the image 
 * of the following index snaps to the position of the deleted image and
 * takes on ALL of its properties
 */

// Connect to MongoDB
mongoose.connect(`${process.env.MONGO_URI}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to mongoDB');
}).catch(err => {
  console.log(err);
});

// Socket.io connection
io.on('connection', (socket) => {
  const userIP = socket.handshake.address;
  console.log(`IP ${userIP.replace('::ffff:', '')} connected`);

  // Handle when a client sends a message
  socket.on('message', message => {
    console.log(message);
    io.emit('message', message);
  })

  socket.on('uploadImage', (data) => {
    console.log('Uploading: ' + data);
    io.emit('uploadedImage', data);
  });

  socket.on('updateImage', (data) => {
    io.emit('updatedImage', data);
  });

  socket.on('deleteImage', (data) => {
    console.log('Deleting: ' + data);
    io.emit('deletedImage', data);
  });

  // Handle when a client disconnects
  socket.on('disconnect', () => {
    console.log(`IP ${userIP.replace('::ffff:', '')} disconnected`);
  });
});

server.listen(`${process.env.PORT}`, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});