import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { RequestExtend } from "../types/index.js";

const secret_key = process.env.JWT_SECRET!;
const admin_email = process.env.ADMIN_EMAIL!;

if (!secret_key) {
  throw new Error("Secret key not found");
}

if (!admin_email) {
  throw new Error("Admin email not found");
}

export const authMiddleware = (
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
    const decode = jwt.verify(token, secret_key);

    if (!decode) {
      res.status(401).json({
        message: "Invalid token",
        success: false,
      });
      return;
    }

    req.userId = (decode as jwt.JwtPayload).userId;
    req.role = (decode as jwt.JwtPayload).role;
    req.isAdmin =
      (decode as jwt.JwtPayload).email === admin_email ? true : false;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
};
