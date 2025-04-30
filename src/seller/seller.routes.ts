import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  registerSeller,
  loginSeller,
  addProduct,
  editProduct,
  getDashboard,
  markAvailable,
  getSellerDetails,
  acceptOrder,
} from "../seller/seller.controller.js";
import { sellerMiddleware } from "../middleware/seller.middleware.js";

const router = Router();
router.post("/register", registerSeller);
router.post("/login", loginSeller);
router.post("/add-product", authMiddleware, sellerMiddleware, addProduct);
router.put(
  "/products/:productId",
  authMiddleware,
  sellerMiddleware,
  editProduct
);
router.patch(
  "/products/:productId/available",
  authMiddleware,
  sellerMiddleware,
  markAvailable
);
router.get("/dashboard", authMiddleware, sellerMiddleware, getDashboard);
router.get("/getSeller", authMiddleware, sellerMiddleware, getSellerDetails);
router.put("/accept/:orderId", authMiddleware, sellerMiddleware, acceptOrder);

export default router;
