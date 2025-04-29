import { Request } from "express";

export interface RequestExtend extends Request {
  userId?: string;
  role?: "buyer" | "seller" | "lorry";
  isAdmin?: boolean;
}
