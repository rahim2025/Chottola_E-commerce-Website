const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { createReviewValidator, idValidator } = require('../utils/validators');

router.post('/:productId', protect, createReviewValidator, createReview);
router.get('/:productId', getProductReviews);
router.put('/:id', protect, idValidator, updateReview);
router.delete('/:id', protect, idValidator, deleteReview);

module.exports = router;
