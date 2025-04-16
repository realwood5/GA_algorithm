import express from 'express';
import { 
  createPicture, 
  getPictures, 
  getPictureById, 
  updatePicture, 
  deletePicture, 
  likePicture, 
  postComment, 
  getPicturesByAuthor // Import the new method
} from '../controllers/pictureController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authenticate, createPicture);
router.get('/', getPictures);
router.get('/author/:authorId', getPicturesByAuthor); // New route for fetching pictures by author
router.get('/:pictureId', getPictureById);
router.patch('/:pictureId', authenticate, updatePicture);
router.delete('/:pictureId', authenticate, deletePicture);
router.patch('/like/:pictureId', authenticate, likePicture);
router.patch('/comment/:pictureId', authenticate, postComment);

export default router;
