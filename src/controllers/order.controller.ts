import { Response } from "express";
import { RequestExtend } from "../types/index.js";
import { Order } from "../models/order.model.js";
import { ISeller } from "../seller/seller.model.js";
import { Lorry } from "../lorry/lorry.model.js";
import { OrderStatus } from "../types/index.js";
import { getIO } from "../socket.js";

export const updateOrderStatus = async (req: RequestExtend, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({ message: "Order ID and status are required" });
      return;
    }

    const order = await Order.findById(orderId).populate("lorry");

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    if (order.status === OrderStatus.Delivered) {
      res.status(400).json({ message: "Order already completed" });
      return;
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

export const paymentStatus = async (req: RequestExtend, res: Response) => {
  try {
    const userId = req.userId;
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ message: "Order ID is required" });
      return;
    }
    const order = await Order.findById(orderId).populate<{ seller: ISeller }>(
      "seller"
    );
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (order.buyer.toString() !== userId) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }
    if (order.status === OrderStatus.Pending) {
      res.status(400).json({ message: "Order is not accepted" });
      return;
    }

    if (order.status === OrderStatus.Paid) {
      res.status(400).json({ message: "Order already paid" });
      return;
    }

    order.status = OrderStatus.Paid;
    await order.save();

    const nearestLorry = await Lorry.findOneAndUpdate(
      {
        gps: {
          $near: { $geometry: order.seller.location, $maxDistance: 50000 },
        },
        available: true,
      },
      {
        $set: { available: false, currentOrder: order._id },
      },
      { new: true }
    );

    if (nearestLorry) {
      order.lorry = nearestLorry._id;
      order.status = OrderStatus.Assign_Pending;
      await order.save();
      const io = getIO();
      io.to(order.seller._id.toString()).emit("paymentReceived", {
        orderId: order._id,
        buyerId: order.buyer,
        totalCost: order.totalCost,
      });
      io.to(userId).emit("orderUpdated", {
        orderId: order._id,
        status: order.status,
        lorry: nearestLorry
          ? {
              agencyName: nearestLorry.agencyName,
              vehicleNumber: nearestLorry.vehicleNumber,
            }
          : null,
      });
    }
    res.status(201).json({
      message: "Payment successful",
      order: {
        sellerDisplay: `${order.seller.city} Rice Mill #${order.seller.millName}`,
        bidPrice: order.bidPrice,
        quantity: order.quantity,
        transportCost: order.transportCost,
        totalCost: order.totalCost,
        status: order.status,
        lorryAssigned: nearestLorry
          ? {
              agencyName: nearestLorry.agencyName,
              vehicleNumber: nearestLorry.vehicleNumber,
              driverName: nearestLorry.driverName,
              driverPhone: nearestLorry.driverPhone,
            }
          : "No lorry assigned yet",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};
