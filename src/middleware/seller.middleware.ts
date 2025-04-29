import { NextFunction, Response } from "express";
import { RequestExtend } from "../types/index.js";

export const sellerMiddleware = (
  req: RequestExtend,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({
        message: "User unauthorized",
        success: false,
      });
      return;
    }
    if (!req.userId) {
      res.status(401).json({
        message: "User unauthorized",
        success: false,
      });
      return;
    }

    if (req.role !== "seller") {
      res.status(401).json({
        message: "User unauthorized",
        success: false,
      });
      return;
    }

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
};
