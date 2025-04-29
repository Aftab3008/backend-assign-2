import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProduct extends Document {
  seller: mongoose.Types.ObjectId;
  type: string;
  quantity: number;
  price: number;
  available: boolean;
}

const ProductSchema: Schema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    type: { type: String, required: true },
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
