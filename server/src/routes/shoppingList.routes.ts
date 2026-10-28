import { Router } from 'express';
import { aggregateShoppingListHandler } from '../controllers/shoppingList.controller';

const router = Router();

router.post('/aggregate', aggregateShoppingListHandler);

export default router;
