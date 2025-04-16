import { Request, Response } from 'express';
import { addUser, findUserByUsername } from "../models/userModel";
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


// Zod schema for login validation
const LoginSchema = z.object({
  username: z.string().min(1).max(40), // Ensure username length is between 1 and 40
  password: z.string().min(8).max(128), // Ensure password length is between 8 and 128
});

export const login = async (req: Request, res: Response) => {
  try {
    // Validate the request body with Zod
    const validatedData = LoginSchema.safeParse(req.body);

    if (!validatedData.success) {
      console.log("Validation failed:", validatedData.error.errors);
      res.status(400).json({
        failed: true,
        code: "INVALID_DATA",
        errors: validatedData.error.errors, // Return detailed validation errors
      });
      return;
    }

    const { username, password } = validatedData.data;

    // Find user by username
    const existingUser = await findUserByUsername(username);
    if (!existingUser) {
      console.log("User not found");
      res.status(400).json({
        failed: true,
        code: "INCORRECT_CREDENTIALS",
      });
      return;
    }

    // Compare the provided password with the stored password (hashed)
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      console.log("Incorrect password");
      res.status(400).json({
        failed: true,
        code: "INCORRECT_CREDENTIALS",
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: existingUser.user_id, username: existingUser.username },
      process.env.JWT_SECRET_KEY as string, // Make sure you have a secret key in .env file
      { expiresIn: '1h' } // Optional: Set token expiration
    );

    // Send the response with the token
    res.status(200).json({
      failed: false,
      token,
      user_id: existingUser.user_id,
      username: existingUser.username,
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ failed: true, code: "INTERNAL_ERROR" });
  }
};

// Zod schema for validating the registration data (without email)
const UserCreationSchema = z.object({
  username: z.string().min(1).max(40), // Ensure username length is between 1 and 40
  password: z.string().min(8).max(128), // Ensure password length is between 8 and 128
});

export const register = async (req: Request, res: Response) => {
  try {
    // Validate the request body with Zod
    const validatedData = UserCreationSchema.safeParse(req.body);

    if (!validatedData.success) {
      console.log("Validation failed:", validatedData.error.errors);
      res.status(400).json({
        failed: true,
        code: "INVALID_DATA",
        errors: validatedData.error.errors, // Return detailed validation errors
      });
      return; // No need to return a value, just exit the function
    }

    const { username, password } = validatedData.data;

    // Check if the user already exists in the database
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      console.log("Username already taken");
      res.status(400).json({
        failed: true,
        code: "DUPLICATE_USERNAME",
      });
      return; // No need to return a value, just exit the function
    }

    // Create user in the database
    const newUser = await addUser(username, password);
    console.log("user created");

    res.status(201).json({
      failed: false,
      user_id: newUser.user_id,
    });
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ failed: true, code: "INTERNAL_ERROR" });
  }
};
