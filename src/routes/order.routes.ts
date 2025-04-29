import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  paymentStatus,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = Router();

router.put("/update/:orderId", authMiddleware, updateOrderStatus);
router.put("/payment-status", authMiddleware, paymentStatus);

export default router;
