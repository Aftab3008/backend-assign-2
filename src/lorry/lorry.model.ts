import mongoose, { Model, Schema } from "mongoose";
import { ILorry } from "../types/index.js";

const LorrySchema: Schema<ILorry> = new Schema(
  {
    agencyName: { type: String, required: true },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^\+91\d{10}$/.test(v),
        message: (props: any) =>
          `${props.value} is not a valid Indian phone number!`,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => v.length >= 6,
        message: () => `Password must be at least 6 characters long!`,
      },
    },
    gps: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (arr: number[]) =>
            arr.length === 2 && arr.every((n) => typeof n === "number"),
          message: () =>
            `Coordinates must be an array of two numbers [longitude, latitude]!`,
        },
      },
    },
    available: { type: Boolean, default: true },
    vehicleNumber: { type: String, required: true },
    driverName: { type: String, required: true },
    driverPhone: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^\+91\d{10}$/.test(v),
        message: (props: any) =>
          `${props.value} is not a valid Indian phone number!`,
      },
    },
    currentOrder: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);

LorrySchema.index({ gps: "2dsphere" });

export const Lorry: Model<ILorry> = mongoose.model<ILorry>(
  "Lorry",
  LorrySchema
);
