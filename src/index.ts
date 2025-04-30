import express from "express";
import http from "http";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import buyerRouter from "./buyer/buyer.routes.js";
import sellerRouter from "./seller/seller.routes.js";
import lorryRouter from "./lorry/lorry.routes.js";
import orderRouter from "./routes/order.routes.js";
import { initSocket } from "./socket.js";

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

const server = http.createServer(app);
initSocket(server);

connectDB()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
