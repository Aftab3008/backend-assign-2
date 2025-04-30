import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getAvailableJobs,
  acceptJob,
  verifyOtp,
  getLorry,
  getAllLorries,
  deleteLorry,
  updateLorryDetails,
  updateLorryLocation,
  registerLorry,
  loginLorry,
  rejectJob,
} from "../lorry/lorry.controller.js";
import { lorryMiddleware } from "../middleware/lorry.middleware.js";

const lorryRouter = Router();

lorryRouter.post("/register", registerLorry);
lorryRouter.post("/login", loginLorry);
lorryRouter.get("/available-jobs", authMiddleware, getAvailableJobs);
lorryRouter.put("/:orderId/accept", authMiddleware, lorryMiddleware, acceptJob);
lorryRouter.put("/:orderId/reject", authMiddleware, lorryMiddleware, rejectJob);
lorryRouter.put(
  "/verify-otp/:orderId",
  authMiddleware,
  lorryMiddleware,
  verifyOtp
);
lorryRouter.get("/get-lorry/:agencyId", authMiddleware, getLorry);
lorryRouter.get("/get-all-lorries", authMiddleware, getAllLorries);
lorryRouter.delete(
  "/delete-lorry",
  authMiddleware,
  lorryMiddleware,
  deleteLorry
);
lorryRouter.put(
  "/update-lorry",
  authMiddleware,
  lorryMiddleware,
  updateLorryDetails
);
lorryRouter.put(
  "/update-location/:orderId",
  authMiddleware,
  lorryMiddleware,
  updateLorryLocation
);

export default lorryRouter;
