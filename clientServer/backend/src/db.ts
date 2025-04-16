import { Client } from 'pg';
// src/database.ts
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize({
  dialect: "postgres",
  host: "localhost",
  username: "postgres",  // Match pg client user
  password: "123456789", // Match pg client password
  database: "mydatabase", // Match pg client database
  port: 5432,            // Match pg client port
  logging: false,        // Optional: disable logging for a cleaner output
});


// Create a new client instance
const client = new Client({
  user: 'postgres', // your database username
  host: 'localhost',
  database: 'mydatabase', // your database name
  password: '123456789', // your password
  port: 5432,
});

// Connect to the database
client.connect();

export default client;



  
