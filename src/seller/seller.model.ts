import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISeller extends Document {
  _id: string;
  millName: string;
  name: string;
  email: string;
  password: string;
  city: string;
  location: { type: "Point"; coordinates: [number, number] };
}

const SellerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    millName: { type: String, required: true },
    city: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
  },
  { timestamps: true }
);

SellerSchema.index({ location: "2dsphere" });

export const Seller: Model<ISeller> = mongoose.model<ISeller>(
  "Seller",
  SellerSchema
);
