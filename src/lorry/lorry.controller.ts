import { Request, Response } from "express";
import { Lorry } from "../lorry/lorry.model.js";
import { Order } from "../models/order.model.js";
import { ISeller } from "../seller/seller.model.js";
import { ILorry, OrderStatus, RequestExtend } from "../types/index.js";
import generateTokenAndCookie from "../utils/jwt.js";
import bcrypt from "bcryptjs";
import validator from "validator";

export const registerLorry = async (req: RequestExtend, res: Response) => {
  try {
    const {
      agencyName,
      phone,
      gps,
      vehicleNumber,
      driverName,
      driverPhone,
      email,
      password,
    } = req.body;
    if (
      !agencyName ||
      !phone ||
      !email ||
      !gps ||
      !gps.coordinates ||
      !vehicleNumber ||
      !driverName ||
      !password ||
      !driverPhone
    ) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (!validator.isEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }
    if (!validator.isMobilePhone(phone, "any", { strictMode: false })) {
      res.status(400).json({ message: "Invalid phone number" });
      return;
    }
    if (!validator.isMobilePhone(driverPhone, "any", { strictMode: false })) {
      res.status(400).json({ message: "Invalid driver phone number" });
      return;
    }
    if (!validator.isLength(password, { min: 6 })) {
      res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
      return;
    }
    if (!validator.isLength(vehicleNumber, { min: 1 })) {
      res.status(400).json({ message: "Vehicle number is required" });
      return;
    }
    const { coordinates } = gps;
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      res.status(400).json({ message: "Invalid GPS coordinates" });
      return;
    }

    const existing = await Lorry.findOne({ agencyName, phone });
    if (existing) {
      res.status(400).json({ message: "Lorry already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newLorry = await Lorry.create({
      agencyName,
      phone,
      email,
      gps: { type: "Point", coordinates: [+coordinates[0], +coordinates[1]] },
      vehicleNumber,
      driverName,
      driverPhone,
      password: hashedPassword,
    });

    if (!newLorry) {
      res.status(400).json({ message: "Error creating lorry" });
      return;
    }

    const token = generateTokenAndCookie(
      res,
      newLorry._id.toString(),
      newLorry.email,
      "lorry"
    );

    res.status(201).json({
      message: "Lorry added successfully",
      lorry: {
        agencyName: newLorry.agencyName,
        vehicleNumber: newLorry.vehicleNumber,
        driverName: newLorry.driverName,
        driverPhone: newLorry.driverPhone,
        email: newLorry.email,
        phone: newLorry.phone,
        gps: newLorry.gps,
        available: newLorry.available,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error adding lorry",
      error: err,
    });
  }
};

export const loginLorry = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }
    if (!validator.isEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }
    if (!validator.isLength(password, { min: 6 })) {
      res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
      return;
    }
    const lorry = await Lorry.findOne({ email });
    if (!lorry) {
      res.status(404).json({ message: "Lorry not found" });
      return;
    }

    const isMatch = await bcrypt.compare(password, lorry.password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateTokenAndCookie(
      res,
      lorry._id.toString(),
      lorry.email,
      "lorry"
    );

    res.status(200).json({
      message: "Login successful",
      lorry: {
        agencyName: lorry.agencyName,
        vehicleNumber: lorry.vehicleNumber,
        driverName: lorry.driverName,
        driverPhone: lorry.driverPhone,
        email: lorry.email,
        phone: lorry.phone,
        gps: lorry.gps,
        available: lorry.available,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error logging in",
      error: err,
    });
  }
};

export const getAvailableJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await Order.find({ status: OrderStatus.Accepted });
    res.status(200).json({
      message: "Available jobs",
      jobs,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching jobs",
      error: err,
    });
  }
};

export const acceptJob = async (req: RequestExtend, res: Response) => {
  try {
    const agencyId = req.userId;
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate<{ lorry: ILorry }>(
      "lorry"
    );
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (order.lorry?._id.toString() !== agencyId) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }
    if (order.status === OrderStatus.Assigned) {
      res.status(400).json({ message: "Order already accepted" });
      return;
    }

    if (!order.lorry) {
      res.status(500).json({ message: "Lorry information missing" });
      return;
    }
    order.status = OrderStatus.Assigned;
    await order.save();

    res.status(200).json({
      message: "Job accepted successfully",
      order: {
        lorry: {
          agencyName: order.lorry.agencyName,
          vehicleNumber: order.lorry.vehicleNumber,
          driverName: order.lorry.driverName,
          driverPhone: order.lorry.driverPhone,
        },
        status: order.status,
        transportCost: order.transportCost,
        totalCost: order.totalCost,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Error accepting job",
      error: err,
    });
  }
};

export const rejectJob = async (req: RequestExtend, res: Response) => {
  try {
    const agencyId = req.userId;
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate<{
      lorry: ILorry;
      seller: ISeller;
    }>("lorry", "seller");
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (order.lorry?._id.toString() !== agencyId) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }
    if (order.status === OrderStatus.Rejected) {
      res.status(400).json({ message: "Order already rejected" });
      return;
    }
    if (!order.lorry) {
      res.status(500).json({ message: "Lorry information missing" });
      return;
    }

    const lorry = await Lorry.findById(agencyId);
    if (!lorry) {
      res.status(404).json({ message: "Lorry not found" });
      return;
    }
    const newNearbyLorry = await Lorry.findOneAndUpdate(
      {
        _id: { $ne: agencyId },
        available: true,
        gps: {
          $near: {
            $geometry: order.seller.location,
            $maxDistance: 5000,
          },
        },
      },
      { $set: { available: true } },
      { new: true }
    );
    if (!newNearbyLorry) {
      res.status(404).json({ message: "No nearby lorry found" });
      return;
    }
    order.lorry = newNearbyLorry._id as any;
    order.status = OrderStatus.Assign_Pending;
    await order.save();

    res.status(200).json({
      message: "Job rejected and reassigned successfully",
      newLorry: {
        agencyName: newNearbyLorry.agencyName,
        vehicleNumber: newNearbyLorry.vehicleNumber,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Error rejecting job",
      error: err,
    });
  }
};

export const verifyOtp = async (req: RequestExtend, res: Response) => {
  try {
    const agencyId = req.userId;
    const { orderId } = req.params;
    const { otp } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (order.lorry?.toString() !== agencyId) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }
    if (order.otp === otp) {
      order.status = OrderStatus.PickUpVerified;
      await order.save();
      res.status(200).json({ message: "OTP verified, pickup confirmed" });
      return;
    }
    res.status(400).json({ message: "Invalid OTP" });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getLorry = async (req: RequestExtend, res: Response) => {
  try {
    const agencyId = req.params.agencyId;
    if (!agencyId) {
      res.status(400).json({ message: "Lorry ID is required" });
      return;
    }
    const lorry = await Lorry.findById(agencyId);
    if (!lorry) {
      res.status(404).json({ message: "Lorry not found" });
      return;
    }
    res.status(200).json({
      message: "Lorry found",
      lorry,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

export const getAllLorries = async (req: RequestExtend, res: Response) => {
  try {
    const lorries = await Lorry.find();
    res.status(200).json({
      message: "Lorries found",
      lorries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching lorries",
      error: err,
    });
  }
};

export const deleteLorry = async (req: RequestExtend, res: Response) => {
  try {
    const agencyId = req.userId;
    if (!agencyId) {
      res.status(400).json({ message: "Lorry ID is required" });
      return;
    }
    const lorry = await Lorry.findByIdAndDelete(agencyId);
    if (!lorry) {
      res.status(404).json({ message: "Lorry not found" });
      return;
    }
    res.status(200).json({
      message: "Lorry deleted successfully",
      lorry,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error deleting lorry",
      error: err,
    });
  }
};

export const updateLorryDetails = async (req: RequestExtend, res: Response) => {
  try {
    const lorryId = req.userId;

    const lorry = await Lorry.findByIdAndUpdate(
      lorryId,
      { ...req.body },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!lorry) {
      res.status(404).json({ message: "Lorry not found" });
      return;
    }
    res.status(200).json({
      message: "Lorry updated successfully",
      lorry,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error updating lorry",
      error: err,
    });
  }
};

export const updateLorryLocation = async (
  req: RequestExtend,
  res: Response
) => {
  try {
    const lorryId = req.userId;
    const { orderId } = req.params;
    const { location } = req.body;
    if (!orderId || !location) {
      res.status(400).json({ message: "Order ID and location are required" });
      return;
    }
    const order = await Order.findById(orderId).populate("lorry");
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (!order.lorry) {
      res.status(404).json({ message: "No lorry agency assigned" });
      return;
    }
    const lorry = await Lorry.findById(lorryId);
    if (!lorry) {
      res.status(404).json({ message: "Lorry agency not found" });
      return;
    }
    if (lorry.currentOrder && lorry.currentOrder.toString() !== orderId) {
      res
        .status(400)
        .json({ message: "Lorry is already assigned to another order" });
      return;
    }
    lorry.gps.coordinates = location.coordinates;
    await lorry.save();
    res.status(201).json({
      message: "Lorry location updated successfully",
      order: {
        lorry: {
          agencyName: lorry.agencyName,
          vehicleNumber: lorry.vehicleNumber,
          driverName: lorry.driverName,
          driverPhone: lorry.driverPhone,
        },
        status: order.status,
        transportCost: order.transportCost,
        totalCost: order.totalCost,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: " Internal server error",
      error: err,
    });
  }
};
