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
 * - I'm able to get the image data from mongoDB
 * - Now I need to find a way to simultaneously update the positional data across all clients
 * - find a way to rotate images
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

const connection = mongoose.connection;

connection.once('open', () => {
  const imagesChangeStream = connection.collection('images').watch();

  console.log('MongoDB database connection established successfully');

  imagesChangeStream.on('change', async (change) => {

    console.log(`Change detected: ${change.operationType}`);

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
      await connection.collection('images').findOneAndUpdate({
        _id: image._id
      }, {
        $set: {
          key: image.key,
          imageData: image.imageData,
          x: image.x,
          y: image.y,
          width: image.width,
          height: image.height,
          rotation: image.rotation,
          opacity: image.opacity
        }
      });
      io.emit('updatedImage', image);
    }
    else if (change.operationType === 'delete') {
      console.log(`Deleting image: ${change.documentKey._id}`);
      io.emit('deletedImage', change.documentKey._id);
    }
  }
  );
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

  // socket.on('uploadImage', (data) => {
  //   try {
  //     // Store the image data in MongoDB
  //     const image = new Image({ key: data.key, imageData: data.imageData, x: data.x, y: data.y, width: data.width, height: data.height, rotation: data.rotation, opacity: data.opacity });
  //     image.save().then( () => {
  //       // // Broadcast the image data to all connected clients
  //       console.log(data);
  //       socket.broadcast.emit('newImage', data);
  //       console.log('Image saved to MongoDB');
  //     });
  //   } catch (error) {
  //     console.error('Error saving image:', error);
  //   }
  // });

  socket.on('updateImage', (data) => {
    console.log(data);
    io.emit('updatedImage', data);
  });

  // Handle when a client disconnects
  socket.on('disconnect', () => {
    console.log(`IP ${userIP.replace('::ffff:', '')} disconnected`);
  });
});

server.listen(`${process.env.PORT}`, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});