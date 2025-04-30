import { Request, Response } from "express";
import { Seller } from "../seller/seller.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import generateTokenAndCookie from "../utils/jwt.js";
import { RequestExtend } from "../types/index.js";
import { OrderStatus } from "../types/index.js";
import { getIO } from "../socket.js";

export const registerSeller = async (req: Request, res: Response) => {
  try {
    const { name, email, password, city, location, millName } = req.body;
    const { lat, lng } = location;
    if (!name || !email || !password || !city || !location || !millName) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    if (!lat || !lng) {
      res.status(400).json({ message: "Location coordinates are required" });
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
    if (!validator.isLength(name, { min: 3 })) {
      res.status(400).json({ message: "Name must be at least 3 characters" });
      return;
    }
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      res.status(400).json({ message: "Email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const seller = await Seller.create({
      name,
      email,
      password: hashedPassword,
      city,
      location: {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      millName,
    });
    const token = generateTokenAndCookie(
      res,
      seller._id,
      seller.email,
      "seller"
    );
    res.status(201).json({
      message: "Seller registered successfully",
      user: {
        name: seller.name,
        email: seller.email,
        city: seller.city,
        location: seller.location,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

export const loginSeller = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    if (!validator.isEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }
    const seller = await Seller.findOne({ email });
    if (!seller) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }
    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }
    const token = generateTokenAndCookie(
      res,
      seller._id,
      seller.email,
      "seller"
    );
    res.status(200).json({
      message: "Login successful",
      user: {
        name: seller.name,
        email: seller.email,
        city: seller.city,
        location: seller.location,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

export const addProduct = async (req: RequestExtend, res: Response) => {
  try {
    const userId = req.userId;
    const { type, quantity, price } = req.body;

    if (!type || !quantity || !price) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    if (!validator.isLength(type, { min: 3 })) {
      res.status(400).json({ message: "Type must be at least 3 characters" });
      return;
    }
    const product = await Product.create({
      seller: userId,
      type: type.toLowerCase(),
      quantity: +quantity,
      price: +price * 1.05,
    });
    res.status(201).json({
      message: "Product added successfully",
      product: {
        _id: product._id,
        type: product.type,
        quantity: product.quantity,
        price: product.price,
        available: product.available,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

export const editProduct = async (req: RequestExtend, res: Response) => {
  try {
    const productId = req.params.productId;
    if (!productId) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }

    let existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (existingProduct.seller.toString() !== req.userId) {
      res.status(403).json({ message: "Unauthorized Access" });
      return;
    }

    existingProduct = await Product.findByIdAndUpdate(
      productId,
      { ...req.body },
      {
        new: true,
        runValidators: true,
      }
    );
    res.status(200).json({
      message: "Product updated successfully",
      data: existingProduct,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

export const markAvailable = async (req: RequestExtend, res: Response) => {
  try {
    const productId = req.params.productId;
    if (!productId) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }
    let existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (existingProduct.seller.toString() !== req.userId) {
      res.status(403).json({ message: "Unauthorized Access" });
      return;
    }
    if (existingProduct.available) {
      res.status(400).json({ message: "Product is already available" });
      return;
    }
    const updated = await Product.findByIdAndUpdate(
      productId,
      { available: true },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      message: "Product marked as available",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

export const getDashboard = async (req: RequestExtend, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    const existingSeller = await Seller.findById(userId);
    if (!existingSeller) {
      res.status(404).json({ message: "Seller not found" });
      return;
    }
    const products = await Product.find({ seller: userId })
      .populate("seller", "name email city location")
      .select("type quantity price available createdAt updatedAt");
    if (!products) {
      res.status(404).json({ message: "No products found" });
      return;
    }
    const orders = await Order.find({ seller: userId })
      .populate("buyer", "name email phone")
      .populate("product", "type quantity price available")
      .select("buyer product quantity totalPrice status createdAt updatedAt");
    if (!orders) {
      res.status(404).json({ message: "No orders found" });
      return;
    }
    res.status(200).json({
      message: "Dashboard data retrieved successfully",
      seller: {
        name: existingSeller.name,
        email: existingSeller.email,
        city: existingSeller.city,
        location: existingSeller.location,
      },
      products: products,
      orders: orders,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getSellerDetails = async (req: RequestExtend, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    const existingSeller = await Seller.findById(userId);
    if (!existingSeller) {
      res.status(404).json({ message: "Seller not found" });
      return;
    }
    res.status(200).json({
      message: "Seller details retrieved successfully",
      seller: {
        _id: existingSeller._id,
        millName: existingSeller.millName,
        name: existingSeller.name,
        email: existingSeller.email,
        city: existingSeller.city,
        location: existingSeller.location,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};

export const acceptOrder = async (req: RequestExtend, res: Response) => {
  try {
    const orderId = req.params.orderId;
    if (!orderId) {
      res.status(400).json({ message: "Order ID is required" });
      return;
    }
    const existingOrder = await Order.findById(orderId);

    if (!existingOrder) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (existingOrder.seller.toString() !== req.userId) {
      res.status(403).json({ message: "Unauthorized Access" });
      return;
    }

    const product = await Product.findById(existingOrder.product);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (product.quantity < existingOrder.quantity || !product.available) {
      res.status(400).json({
        message: "Insufficient quantity or unavailable",
      });
      return;
    }

    existingOrder.status = OrderStatus.Accepted;
    product.quantity -= existingOrder.quantity;
    product.available = product.quantity > 0;
    await existingOrder.save();
    await product.save();

    const io = getIO();
    io.to(existingOrder.buyer.toString()).emit("orderAccepted", {
      orderId: existingOrder._id,
      status: existingOrder.status,
    });

    res.status(200).json({
      message: "Order accepted successfully",
      order: existingOrder,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
};
