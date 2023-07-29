const Image = require('../models/image');

const addImage = async (req, res) => {
  try {
    const image = new Image(req.body);
    await image.save();
    res.status(201).json(image);
  }
  catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllImages = async (req, res) => {
  try {
    const images = await Image.find();
    res.status(200).json(images);
  }
  catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Image.findByIdAndDelete(id);
    if (deleted) {
      return res.status(200).send("Image deleted");
    }
    throw new Error("Image not found");
  }
  catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  addImage,
  getAllImages,
  deleteImage
};