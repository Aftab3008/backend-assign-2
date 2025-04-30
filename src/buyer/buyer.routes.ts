import { Router } from "express";
import {
  confirmDelivery,
  getAllOrderSummary,
  getBuyerDetails,
  getProductDetails,
  getRiceMillsNearby,
  loginBuyer,
  placeBid,
  registerBuyer,
  searchProducts,
} from "../buyer/buyer.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { buyerMiddleware } from "../middleware/buyer.middleware.js";

const buyerRouter = Router();

buyerRouter.post("/register", registerBuyer);
buyerRouter.post("/login", loginBuyer);
buyerRouter.get("/search", authMiddleware, searchProducts);
buyerRouter.get("/search/:productId", authMiddleware, getProductDetails);
buyerRouter.get("/nearby", authMiddleware, getRiceMillsNearby);
buyerRouter.post("/bid", authMiddleware, buyerMiddleware, placeBid);
buyerRouter.get("/order", authMiddleware, getAllOrderSummary);
buyerRouter.get("/getBuyer", authMiddleware, buyerMiddleware, getBuyerDetails);
buyerRouter.put(
  "/confirmOrder",
  authMiddleware,
  buyerMiddleware,
  confirmDelivery
);

export default buyerRouter;
