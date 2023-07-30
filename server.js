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
        zIndex: change.fullDocument.zIndex,
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
        zIndex: change.updateDescription.updatedFields.zIndex,
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
          zIndex: image.zIndex,
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