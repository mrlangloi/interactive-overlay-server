const express = require('express');
const router = express.Router();
const {
  addImage,
  getAllImages,
  deleteImage
} = require('../controllers/imagesController');

router.post('/images', addImage);

router.get('/images', getAllImages);

router.delete('/images/:id', deleteImage);

module.exports = router;