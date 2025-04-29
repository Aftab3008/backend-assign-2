import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getAvailableJobs,
  acceptJob,
  verifyOtp,
  addLorry,
  getLorry,
  getAllLorries,
  deleteLorry,
  updateLorryDetails,
  updateLorryLocation,
} from "../controllers/lorry.controller.js";

const lorryRouter = Router();

// Middleware to check if the user is authenticated
lorryRouter.get("/available-jobs", authMiddleware, getAvailableJobs);
lorryRouter.put("/accept-job", authMiddleware, acceptJob);
lorryRouter.post("/verify-otp", authMiddleware, verifyOtp);
lorryRouter.post("/add-lorry", authMiddleware, addLorry);
lorryRouter.get("/get-lorry/:id", authMiddleware, getLorry);
lorryRouter.get("/get-all-lorries", authMiddleware, getAllLorries);
lorryRouter.delete("/delete-lorry/:id", authMiddleware, deleteLorry);
lorryRouter.put("/update-lorry/:id", authMiddleware, updateLorryDetails);
lorryRouter.put("/update-location/:id", authMiddleware, updateLorryLocation);

export default lorryRouter;
