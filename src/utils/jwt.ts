import { Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret_key = process.env.JWT_SECRET!;
const jwtExpiry = parseInt(process.env.JWT_EXPIRES!);

if (!secret_key) {
  throw new Error("JWT_SECRET is not defined");
}

if (!jwtExpiry) {
  throw new Error("JWT_EXPIRES is not defined");
}

const JWT_OPTIONS = {
  expiresIn: jwtExpiry * 24 * 60 * 60 * 1000,
};

const generateTokenAndCookie = (
  res: Response,
  id: String,
  email: String,
  role: String
) => {
  const token = jwt.sign(
    { userId: id, email: email, role: role },
    secret_key,
    JWT_OPTIONS
  );

  const maxAge = JWT_OPTIONS.expiresIn;

  res.cookie("token", token, {
    // httpOnly: true,
    // secure: true,
    // sameSite: "none",
    path: "/",
    maxAge: maxAge,
  });

  return token;
};

export default generateTokenAndCookie;
