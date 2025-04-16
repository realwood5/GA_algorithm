import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import client from "../db"; // Import your database client

export interface User {
  user_id: string;
  username: string;
  password: string; // Hashed password
}

// Function to find user by username
export const findUserByUsername = async (username: string): Promise<User | undefined> => {
  const result = await client.query("SELECT * FROM users WHERE username = $1", [username]);
  return result.rows[0]; // Return the first matching user or undefined
};

// Function to add a user
export const addUser = async (username: string, password: string): Promise<User> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user_id = uuidv4();

  // Insert the new user into the database
  const result = await client.query(
    "INSERT INTO users (user_id, username, password) VALUES ($1, $2, $3) RETURNING *",
    [user_id, username, hashedPassword]
  );

  return result.rows[0]; // Return the newly created user
};
