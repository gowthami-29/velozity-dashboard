import type { Response } from "express";
import prisma from "../utils/prisma.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export const createClient = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { name, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Client name is required",
      });
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Client created successfully",
      client,
    });
  } catch (error) {
    console.error("Create client error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};