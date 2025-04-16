import { sequelize } from '../db'; // Import the sequelize instance
import { DataTypes, Model } from 'sequelize';
import { z } from 'zod';

// Zod schema for validating Picture data
const PictureSchema = z.object({
  name: z
    .string()
    .min(1, 'Name must have at least 1 character')
    .max(40, 'Name must have no more than 40 characters'),
  picture_data: z
    .array(z.array(z.string().regex(/^#([0-9A-F]{6}|[0-9A-F]{3})$/i))) // Array of color strings in #rgb or #rrggbb format
    .min(1, 'Picture data must have at least 1 row')
    .max(24, 'Picture data cannot exceed 24 rows')
    .refine((matrix) => matrix.every(row => row.length === matrix.length), 'Picture data must be a square matrix'),
  author: z.object({
    user_id: z.string(),
    username: z.string(),
  }),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  likes: z.number().int().nonnegative().optional(), // Add validation for likes
  likes_jsonb: z.array(z.string()).optional(), // Add validation for likes_jsonb (array of user IDs)
  comments_jsonb: z.array(
    z.object({
      user_id: z.string(),
      comment_text: z.string().max(256),
      created_at: z.string(),
    })
  ).optional(), // Add validation for comments_jsonb (array of comment objects)
});

class Picture extends Model {
  picture_id!: string;
  name!: string;
  picture_data!: string[][];
  author!: { user_id: string; username: string };
  created_at!: string;
  updated_at!: string;
  likes!: number; // Add likes field to the model
  likes_jsonb!: string[]; // Add likes_jsonb field to the model (array of user IDs)
  comments_jsonb!: Array<{ user_id: string; comment_text: string; created_at: string }>; // Add comments_jsonb field to the model

  // Static method for validating the input using Zod
  static validatePictureData(data: any) {
    try {
      // Validate the data against the Zod schema
      PictureSchema.parse(data);
    } catch (e) {
      if (e instanceof z.ZodError) {
        // Handle validation errors
        throw new Error(`Invalid data: ${e.errors.map(error => error.message).join(', ')}`);
      }
      throw e;
    }
  }
}

Picture.init(
  {
    picture_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 40],
      },
    },
    picture_data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    author: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // Default to 0
      validate: {
        min: 0, // Ensure likes cannot be negative
      },
    },
    likes_jsonb: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [], // Default to an empty array
    },
    comments_jsonb: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [], // Default to an empty array
    },
  },
  {
    sequelize, // Use the imported sequelize instance here
    modelName: 'Picture',
    tableName: 'pictures',
    timestamps: false, // Disable automatic timestamps since we manage them manually
  }
);

export default Picture;
