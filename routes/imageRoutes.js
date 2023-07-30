const {
  addImage,
  getAllImages,
  deleteImage,
  updateImage
} = require('../controllers/imagesController');

const router = require('express').Router();

router.get('/', getAllImages);
router.post('/', addImage);
router.delete('/:id', deleteImage);
router.put('/:id', updateImage);

module.exports = router;