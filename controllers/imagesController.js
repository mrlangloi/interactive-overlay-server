const Image = require('../models/image');

const addImage = async (req, res) => {
  try {
    console.log(`Body: ${req.body}`);
    const image = await Image.create(req.body);
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
    console.log(`Params: ${req.params.id}`);
    const id = req.params.id;
    const deleted = await Image.find({ key: id }).deleteOne();
    if (deleted) {
      return res.status(200).send("Image deleted");
    }
    throw new Error("Image not found");
  }
  catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateImage = async (req, res) => {
  try {
    const { id } = req.params.id;
    const updatedValues = req.body;
    await axios.put(`http://localhost:3000/images/${id}`, updatedValues);
    res.status(200).send("Image updated");
  }
  catch (error) {
    res.status(400).json({ error: error.message });
  }
};


module.exports = {
  addImage,
  getAllImages,
  deleteImage,
  updateImage,
};