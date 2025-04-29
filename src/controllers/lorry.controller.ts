import { Request, Response } from "express";
import { ILorry, Lorry } from "../models/lorry.model.js";
import { Order, OrderStatus } from "../models/order.model.js";
import { RequestExtend } from "../types/index.js";

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

export const acceptJob = async (req: Request, res: Response) => {
  try {
    const { orderId, agencyId } = req.body;
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

// export const updateLorry = async (req: Request, res: Response) => {
//   try {
//     const { orderId } = req.params;
//     const { lorryNumber, location } = req.body;
//     const order = await Order.findById(orderId);
//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }
//     const lorry = await Lorry.findById(order.lorry);
//     if (!lorry) {
//       return res.status(404).json({ message: "No lorry agency assigned" });
//     }
//     // update agency details
//     lorry.location.coordinates = location.coordinates;
//     await lorry.save();
//     res.json({ order, lorry });
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { orderId, otp } = req.body;
    const order = await Order.findById(orderId);
    if (order && order.otp === otp) {
      order.status = OrderStatus.PickUpVerified;
      await order.save();
      res.json({ message: "OTP verified, pickup confirmed" });
      return;
    }
    res.status(400).json({ message: "Invalid OTP" });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const addLorry = async (req: RequestExtend, res: Response) => {
  try {
    const {
      agencyName,
      phone,
      gps,
      vehicleNumber,
      driverName,
      driverPhone,
      email,
    } = req.body;
    if (
      !agencyName ||
      !phone ||
      !email ||
      !gps ||
      !gps.coordinates ||
      !vehicleNumber ||
      !driverName ||
      !driverPhone
    ) {
      res.status(400).json({ message: "All fields are required" });
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
    const newLorry = await Lorry.create({
      agencyName,
      phone,
      email,
      gps: { type: "Point", coordinates: [+coordinates[0], +coordinates[1]] },
      vehicleNumber,
      driverName,
      driverPhone,
    });

    if (!newLorry) {
      res.status(400).json({ message: "Error creating lorry" });
      return;
    }

    res
      .status(201)
      .json({ message: "Lorry added successfully", lorry: newLorry });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error adding lorry",
      error: err,
    });
  }
};

export const getLorry = async (req: RequestExtend, res: Response) => {
  try {
    const lorry = await Lorry.findById(req.params.id);
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
    const lorry = await Lorry.findByIdAndDelete(req.params.id);
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
    const lorryId = req.params.id;

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
    const { lorryId } = req.params;
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
