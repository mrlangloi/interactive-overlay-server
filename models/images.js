const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  key: String,
  imageData: String,
  createdAt: { type: Date, default: Date.now },
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  rotation: Number,
  opacity: Number,
});

const Image = mongoose.model('image', imageSchema);

module.exports = Image;