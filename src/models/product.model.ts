import mongoose, { Model, Schema } from "mongoose";
import { IProduct } from "../types/index.js";

const ProductSchema: Schema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    type: { type: String, required: true, set: (v: string) => v.toLowerCase() },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    available: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Product: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  ProductSchema
);
