import mongoose, { Document, Model, Schema } from "mongoose";

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

const OrderSchema: Schema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "Buyer", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    lorry: { type: Schema.Types.ObjectId, ref: "Lorry" },
    bidPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    transportCost: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.Pending,
    },
    otp: { type: String },
    buyerLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true }
);

OrderSchema.index({ buyerLocation: "2dsphere" });

export const Order: Model<IOrder> = mongoose.model<IOrder>(
  "Order",
  OrderSchema
);
