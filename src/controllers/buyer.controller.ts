import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { TRANSPORT_RATE_PER_KM } from "../constants/index.js";
import { Buyer } from "../models/buyer.model.js";
import { Order, OrderStatus } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { ISeller, Seller } from "../models/seller.model.js";
import { RequestExtend } from "../types/index.js";
import { haversineKm } from "../utils/index.js";
import generateTokenAndCookie from "../utils/jwt.js";

export const registerBuyer = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    const existingBuyer = await Buyer.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingBuyer) {
      res.status(400).json({ message: "Buyer already exists" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const buyer = await Buyer.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });
    const token = generateTokenAndCookie(res, buyer._id, buyer.email, "buyer");
    res.status(201).json({
      message: "Buyer registered successfully",
      user: {
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

export const loginBuyer = async (req: Request, res: Response) => {
  try {
    const { email, password, phone } = req.body;
    if (!email && !phone) {
      res.status(400).json({ message: "Email or phone is required" });
      return;
    }
    if (!password) {
      res.status(400).json({ message: "Password is required" });
      return;
    }

    const buyer = await Buyer.findOne({ $or: [{ email }, { phone }] });
    if (!buyer) {
      res.status(404).json({ message: "Buyer not found" });
      return;
    }
    const isMatch = await bcrypt.compare(password, buyer.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
    const token = generateTokenAndCookie(res, buyer._id, buyer.email, "buyer");
    res.status(200).json({
      message: "Login successful",
      user: {
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { type, quantity } = req.query;
    if (!type || !quantity) {
      res.status(400).json({ message: "Type and quantity are required" });
      return;
    }

    const prods = await Product.find({
      type,
      available: true,
      quantity: { $gte: Number(quantity) },
    }).populate("seller");

    if (prods.length === 0) {
      res.status(200).json({ message: "No products found" });
      return;
    }

    const result = prods.map((p: any) => ({
      productId: p._id,
      sellerDisplay: `${p.seller.city} Rice Mill #${p.seller.millName}`,
      price: p.price * 1.05,
    }));

    res.status(200).json({
      message: "Products found",
      products: result,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

export const getProductDetails = async (req: RequestExtend, res: Response) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }

    const product = await Product.findById(productId).populate<{
      seller: ISeller;
    }>("seller");

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json({
      message: "Product details found",
      product: {
        sellerDisplay: `${product.seller.city} Rice Mill #${product.seller.millName}`,
        price: product.price,
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

export const getBuyerDetails = async (req: RequestExtend, res: Response) => {
  try {
    const userId = req.userId;

    const buyer = await Buyer.findById(userId).select("-password");

    if (!buyer) {
      res.status(404).json({ message: "Buyer not found" });
      return;
    }

    res.status(200).json({
      message: "Buyer details found",
      buyer: {
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
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

export const getRiceMillsNearby = async (req: RequestExtend, res: Response) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ message: "lat and lng are required" });
      return;
    }
    const buyerCoords: [number, number] = [+lng, +lat];

    const nearby: Array<ISeller & { distance: number }> =
      await Seller.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: buyerCoords },
            distanceField: "distance",
            spherical: true,
            maxDistance: +maxDistance,
          },
        },

        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "seller",
            as: "products",
          },
        },
        { $unwind: "$products" },
        {
          $match: {
            "products.available": true,
            "products.quantity": { $gt: 0 },
          },
        },
        {
          $project: {
            millName: 1,
            city: 1,
            coordinates: "$location.coordinates",
            productType: "$products.type",
            stock: "$products.quantity",
            basePrice: "$products.price",
            commission: { $multiply: ["$products.price", 0.05] },
            salePrice: {
              $add: [
                "$products.price",
                { $multiply: ["$products.price", 0.05] },
              ],
            },
            transportCost: {
              $multiply: [
                { $divide: ["$distance", 1000] },
                TRANSPORT_RATE_PER_KM,
              ],
            },
            distanceInMeter: "$distance",
          },
        },
      ]);

    res
      .status(200)
      .json({ message: "NearBy Mill", count: nearby.length, data: nearby });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const placeBid = async (req: RequestExtend, res: Response) => {
  try {
    const buyerId = req.userId;

    const { productId, bidPrice, quantity, buyerLat, buyerLng } = req.body;

    if (!productId || !bidPrice || !quantity || !buyerLat || !buyerLng) {
      res.status(400).json({
        message: "productId, bidPrice, buyerLat & buyerLng are required",
      });
      return;
    }
    if (bidPrice <= 0) {
      res.status(400).json({ message: "Bid price must be > 0" });
      return;
    }

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      res.status(404).json({ message: "Buyer not found" });
      return;
    }

    const product = await Product.findById(productId).populate("seller");

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (product.seller._id.equals(buyer._id)) {
      res.status(400).json({ message: "Cannot bid your own product" });
      return;
    }

    if (!product.available || product.quantity < quantity) {
      res.status(400).json({ message: "Product quantity not enough" });
      return;
    }

    if (bidPrice < product.price) {
      res.status(400).json({ message: "Bid < product price" });
      return;
    }

    const seller = await Seller.findById(product.seller._id);
    if (!seller) {
      res.status(404).json({ message: "Seller not found" });
      return;
    }
    const [slng, slat] = seller.location.coordinates;

    const distanceKm = haversineKm(+buyerLat, +buyerLng, slat, slng);

    const transportCost = distanceKm * 10;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const order = await Order.create({
      buyer: buyerId,
      seller: seller._id,
      product: productId,
      bidPrice,
      otp,
      buyerLocation: {
        type: "Point",
        coordinates: [+buyerLng, +buyerLat],
      },
      totalCost: bidPrice * quantity + transportCost,
      transportCost,
      quantity,
    });
    if (!order) {
      res.status(500).json({ message: "Failed to place order" });
      return;
    }

    //Todo: notify the seller

    res.status(201).json({
      sellerDisplay: `${seller.city} Rice Mill #${seller.millName}`,
      bidPrice,
      transportCost: order.transportCost,
      totalCost: order.totalCost,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

export const getAllOrderSummary = async (req: RequestExtend, res: Response) => {
  try {
    const userId = req.userId;

    const orders = await Order.find({ buyer: userId })
      .populate("buyer")
      .populate("seller", "city millName")
      .populate("product")
      .populate("lorry");

    if (orders.length === 0) {
      res.status(200).json({ message: "No orders found" });
      return;
    }
    const orderDetails = orders.map((order: any) => ({
      orderId: order._id,
      productId: order.product._id,
      sellerDisplay: `${order.seller.city} Rice Mill #${order.seller.millName}`,
      bidPrice: order.bidPrice,
      status: order.status,
    }));
    res.status(200).json({
      message: "Orders found",
      orders: orderDetails,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

// export const verifyOTP = async (req: Request, res: Response) => {
//   try {
//     const { orderId, otp } = req.body;
//     if (!orderId || !otp) {
//       res.status(400).json({ message: "Order ID and OTP are required" });
//       return;
//     }
//     const order = await Order.findById(orderId);
//     if (!order) {
//       res.status(404).json({ message: "Order not found" });
//       return;
//     }
//     if (order.status !== OrderStatus.Accepted) {
//       res.status(400).json({ message: "Order is not accepted" });
//       return;
//     }
//     if (order.otp !== otp) {
//       res.status(400).json({ message: "Invalid OTP" });
//       return;
//     }
//     order.status = OrderStatus.Pending_delivery;
//     await order.save();
//     res.status(200).json({ message: "Delivery confirmed" });
//     const product = await Product.findById(order.product);
//     if (!product) {
//       res.status(404).json({ message: "Product not found" });
//       return;
//     }
//     product.quantity -= 1;
//     await product.save();
//     const buyer = await Buyer.findById(order.buyer);
//     if (!buyer) {
//       res.status(404).json({ message: "Buyer not found" });
//       return;
//     }
//     const lorry = await Lorry.findById(order.lorry);
//     if (!lorry) {
//       res.status(404).json({ message: "Lorry not found" });
//       return;
//     }
//     lorry.status = LorryStatus.Available;
//     await lorry.save();
//     const orderDetails = {
//       orderId: order._id,
//       productId: product._id,
//       sellerDisplay: `${order.seller.city} Rice Mill #${order.seller.millName}`,
//       bidPrice: order.bidPrice,
//       status: order.status,
//     };
//     res.status(200).json({
//       message: "Delivery confirmed",
//       order: orderDetails,
//     });
//   } catch (err) {
//     res.status(500).json({
//       message: "Internal server error",
//       error: err,
//     });
//   }
// };

export const confirmDelivery = async (req: RequestExtend, res: Response) => {
  try {
    const userId = req.userId;
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ message: "Order ID is required" });
      return;
    }
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (!order.buyer.equals(userId)) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }
    if (order.status !== OrderStatus.PickUpVerified) {
      res.status(400).json({ message: "Order is not in delivery" });
      return;
    }
    order.status = OrderStatus.Delivered;
    await order.save();
    res.status(200).json({ message: "Delivery confirmed" });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};
