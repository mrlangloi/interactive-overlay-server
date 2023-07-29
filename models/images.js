const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  imageData: String,
  createdAt: { type: Date, default: Date.now },
});

const Image = mongoose.model('image', imageSchema);

module.exports = Image;