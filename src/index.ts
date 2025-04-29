import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import buyerRouter from "./routes/buyer.routes.js";
import sellerRouter from "./routes/seller.routes.js";
import lorryRouter from "./routes/lorry.routes.js";
import orderRouter from "./routes/order.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/v1/buyer", buyerRouter);
app.use("/api/v1/seller", sellerRouter);
app.use("/api/v1/lorry", lorryRouter);
app.use("/api/v1/order", orderRouter);

app.listen(port, () => {
  connectDB()
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
    });
  console.log(`Server is running at http://localhost:${port}`);
});
