import mongoose, { Model, Schema } from "mongoose";
import { IBuyer } from "../types/index.js";

const BuyerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export const Buyer: Model<IBuyer> = mongoose.model<IBuyer>(
  "Buyer",
  BuyerSchema
);
