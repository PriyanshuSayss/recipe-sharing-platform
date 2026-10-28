import { Router } from 'express';
import { uploadRecipeImage } from '../controllers/upload.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/recipe-image', requireAuth, uploadRecipeImage);

export default router;
