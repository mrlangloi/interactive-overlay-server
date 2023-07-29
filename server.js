require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Image = require('./models/images.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
  }
});

app.use(cors({
  origin: "http://localhost:3000", // restrict calls to those this address
}));

/**
 * TODO
 * - I'm able to get the image data from mongoDB
 * - Now I need to find a way to simultaneously update the positional data across all clients
 * - find a way to rotate images
 */


// Get all images from mongoDB
app.get('/images', async (req, res) => {
  try {
    const images = await Image.find();
    res.json(images);
  } catch (error) {
    console.error(error);
  }
});

// Connect to MongoDB
mongoose.connect(`${process.env.MONGO_URI}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then( () => {
  console.log('Connected to mongoDB');
}).catch( err => {
  console.log(err);
});

const connection = mongoose.connection;

connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
  const imagesChangeStream = connection.collection('images').watch();
  
  imagesChangeStream.on('change', (change) => {
    console.log(change);
    if (change.operationType === 'insert') {
      const image = {
        _id: change.fullDocument._id,
        key: change.fullDocument.key,
        imageData: change.fullDocument.imageData,
        x: change.fullDocument.x,
        y: change.fullDocument.y,
        width: change.fullDocument.width,
        height: change.fullDocument.height,
        rotation: change.fullDocument.rotation,
        opacity: change.fullDocument.opacity,
      };
      io.emit('newImage', image);
    } 
    else if (change.operationType === 'update') {
      const image = {
        _id: change.documentKey._id,
        key: change.updateDescription.updatedFields.key,
        imageData: change.updateDescription.updatedFields.imageData,
        x: change.updateDescription.updatedFields.x,
        y: change.updateDescription.updatedFields.y,
        width: change.updateDescription.updatedFields.width,
        height: change.updateDescription.updatedFields.height,
        rotation: change.updateDescription.updatedFields.rotation,
        opacity: change.updateDescription.updatedFields.opacity,
      };
      io.emit('updatedImage', image);
    }
    else if (change.operationType === 'delete') {
      io.emit('deletedImage', change.documentKey.key);
    }
  });
  
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`);

  // Handle when a client sends a message
  socket.on('message', message => {
    console.log(message);
    io.emit('message', message);
  })

  socket.on('uploadImage', (data) => {
    try {
      // Store the image data in MongoDB
      const image = new Image({ key: data.key, imageData: data.imageData, x: data.x, y: data.y, width: data.width, height: data.height, rotation: data.rotation, opacity: data.opacity });
      image.save().then( () => {
        // // Broadcast the image data to all connected clients
        console.log(data);
        socket.broadcast.emit('newImage', data);
        console.log('Image saved to MongoDB');
      });
    } catch (error) {
      console.error('Error saving image:', error);
    }
  });

  socket.on('updateImage', (data) => {
    socket.broadcast.emit('updatedImage', data);
  });

  // Handle when a client disconnects
  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected.`);
  });
});

server.listen(`${process.env.PORT}`, () => {
  console.log(`listening on *:${process.env.PORT}`);
});