import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBuyer extends Document {
  _id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
}

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
