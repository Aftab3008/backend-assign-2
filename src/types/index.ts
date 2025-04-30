import { Request } from "express";
import mongoose from "mongoose";

export interface RequestExtend extends Request {
  userId?: string;
  role?: "buyer" | "seller" | "lorry";
  isAdmin?: boolean;
}

export interface IBuyer extends Document {
  _id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface ILorry extends Document {
  _id: mongoose.Types.ObjectId;
  agencyName: string;
  phone: string;
  email: string;
  password: string;
  gps: {
    type: "Point";
    coordinates: [number, number];
  };
  available: boolean;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  currentOrder?: mongoose.Types.ObjectId;
}

export enum OrderStatus {
  Pending = "Pending",
  Accepted = "Accepted",
  Rejected = "Rejected",
  Cancelled = "Cancelled",
  Paid = "Paid",
  Assigned = "Assigned",
  Assign_Pending = "Assign Pending",
  PickUpVerified = "Pickup Verified",
  InTransit = "In Transit",
  Pending_delivery = "Pending Delivery",
  Delivered = "Delivered",
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  lorry?: mongoose.Types.ObjectId;
  bidPrice: number;
  quantity: number;
  status: OrderStatus;
  totalCost: number;
  transportCost: number;
  otp?: string;
  buyerLocation: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface IProduct extends Document {
  seller: mongoose.Types.ObjectId;
  type: string;
  quantity: number;
  price: number;
  available: boolean;
}
