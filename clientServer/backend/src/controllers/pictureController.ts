import { Request, Response } from 'express';
import Picture from '../models/pictureModel';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from 'jsonwebtoken';
import { RequestHandler } from 'express';

import { AuthenticatedRequest, AuthenticatedUser } from '../middleware/authMiddleware';

export const createPicture: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { name, picture_data } = req.body;
    const user = (req as AuthenticatedRequest).user as AuthenticatedUser; // Explicit cast

    console.log("its a hit");

    if (!user) {
      console.error("User is not authenticated");
      res.json({ failed: true, error: 'NOT_AUTHENTICATED' });
      return;
    }

    console.log("User authenticated:", user);

    if (typeof name !== 'string' || !Array.isArray(picture_data)) {
      console.error("Invalid data:", { name, picture_data });
      res.json({ failed: true, error: 'INVALID_DATA' });
      return;
    }

    if (!picture_data.every(row => Array.isArray(row) && row.every(cell => typeof cell === 'string'))) {
      console.error("Invalid picture_data format:", picture_data);
      res.json({ failed: true, error: 'BAD_PICTURE_DATA' });
      return;
    }

    console.log("Data is valid, creating picture...");

    const picture = await Picture.create({
      name,
      picture_data,
      author: { user_id: user.user_id, username: user.username },
    });

    console.log("Picture created:", picture);

    // Ensure the response format exactly matches what the frontend expects
    console.log(picture.picture_data);
    
    res.json({
      failed: false,
      data: {
        picture: {
          
          author: {
            user_id: picture.author.user_id.toString(), // Ensure it's a string
            username: picture.author.username, // Already a string
          },
          created_at: picture.created_at, // Timestamp
          updated_at: picture.updated_at, // Timestamp

          picture_id: picture.picture_id.toString(), // Ensure it's a string
          name: picture.name, // Already a string
          picture_data: picture.picture_data as string[][], // Ensure it's a 2D array of color strings
          // likes: picture.likes, // Number of likes
          // dislikes: picture.dislikes, // Number of dislikes
          // comments: picture.comments, // Assuming it's an array of comment objects
        }
      }
    });
    
    
    
  } catch (error) {
    console.error("Error creating picture:", error);
    res.json({
      failed: true,
      error: 'BAD_PICTURE_DATA',
      details: error instanceof Error ? error.message : error,
    });
  }
}; 



// Get paginated list of pictures
export const getPictures = async (req: Request, res: Response) => {
  console.log("get pictures hit!");
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 25);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const authorId = req.query.author as string;
    const olderFirst = req.query.older_first === 'true';

    const whereClause: any = {};
    if (authorId) whereClause["author.user_id"] = authorId;

    // Fetch total count of pictures for pagination
    const totalPictures = await Picture.count({ where: whereClause });

    // Fetch paginated pictures, including the author field
    const pictures = await Picture.findAll({
      where: whereClause,
      order: [['created_at', olderFirst ? 'ASC' : 'DESC']],
      limit,
      offset: (page - 1) * limit,
      attributes: [
        'picture_id', 
        'name', 
        'picture_data', 
        'author', 
        'created_at', 
        'updated_at', 
        'likes', 
        'comments_jsonb'
      ], // Explicitly include fields
    });

    res.json({
      pictures: pictures.map((picture) => ({
        ...picture.toJSON(),
        author: {
          user_id: picture.author?.user_id, // Ensure nested author is handled
          username: picture.author?.username,
        },
      })),
      total: totalPictures,
      page,
      perPage: limit,
      totalPages: Math.ceil(totalPictures / limit),
    });
  } catch (error) {
    console.error(error);
    res.json({ failed: true, error: 'INTERNAL_ERROR' });
  }
};



// Get a single picture by ID
export const getPictureById: RequestHandler = async (req, res): Promise<void> => {
  console.log("its a hit");

  try {
    const { pictureId } = req.params;
    const picture = await Picture.findByPk(pictureId);

    if (!picture) {
      res.json({ failed: true, error: 'NO_SUCH_ENTITY' });
      return;
    }

    res.json({ failed: false, picture });
  } catch (error) {
    res.json({ failed: true, error: 'INTERNAL_ERROR' });
  }
};
// Update picture
export const updatePicture: RequestHandler = async (req, res): Promise<void> => {
  console.log("updatePictureHit");
  try {
    const { pictureId } = req.params;
    const user = (req as AuthenticatedRequest).user as AuthenticatedUser;
    const { name, pictureData } = req.body; // Extract the new name and grid data

    if (!user) {
      res.json({ failed: true, error: 'NOT_AUTHENTICATED' });
      return;
    }

    const picture = await Picture.findByPk(pictureId);
    if (!picture) {
      res.json({ failed: true, error: 'NO_SUCH_ENTITY' });
      return;
    }

    if (picture.author.user_id !== user.user_id) {
      res.json({ failed: true, error: 'NOT_YOURS' });
      return;
    }

    // Validate the new picture data
    if (
      !Array.isArray(pictureData) ||
      !pictureData.every(row => Array.isArray(row) && row.length <= 24) ||
      pictureData.length > 24
    ) {
      res.json({ failed: true, error: 'INVALID_PICTURE_DATA' });
      return;
    }

    // Update the picture with the new data
    await picture.update({
      name: name || picture.name,
      picture_data: pictureData, // Assuming `picture_data` is the column name
      updated_at: new Date().toISOString(),
    });

    res.json({ failed: false });
  } catch (error) {
    console.error('Error in updatePicture:', error);
    res.json({ failed: true, error: 'INVALID_DATA' });
  }
};


// Delete picture
export const deletePicture: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { pictureId } = req.params;
    const user = (req as AuthenticatedRequest).user as AuthenticatedUser;

    if (!user) {
      res.json({ failed: true, error: 'NOT_AUTHENTICATED' });
      return;
    }

    const picture = await Picture.findByPk(pictureId);
    if (!picture) {
      res.json({ failed: true, error: 'NO_SUCH_ENTITY' });
      return;
    }

    if (picture.author.user_id !== user.user_id) {
      res.json({ failed: true, error: 'NOT_YOURS' });
      return;
    }

    await picture.destroy();
    res.json({ failed: false });
  } catch (error) {
    res.json({ failed: true, error: 'INTERNAL_ERROR' });
  }
};

// Like a picture
// Like a picture
export const likePicture: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { pictureId } = req.params;
    const user = (req as AuthenticatedRequest).user as AuthenticatedUser; // Explicit cast

    console.log("its a hit");

    if (!user) {
      console.error("User is not authenticated");
      res.json({ failed: true, error: "NOT_AUTHENTICATED" });
      return;
    }

    const picture = await Picture.findByPk(pictureId);

    if (!picture) {
      console.error("Picture not found:", pictureId);
      res.json({ failed: true, error: "NO_SUCH_ENTITY" });
      return;
    }

    // Check if the user has already liked the picture by looking for the user_id in the likes_jsonb array
    const userAlreadyLiked = picture.likes_jsonb && picture.likes_jsonb.includes(user.user_id);

    if (userAlreadyLiked) {
      console.error("User already liked this picture:", { pictureId, userId: user.user_id });
      res.json({ failed: true, error: "ALREADY_LIKED" });
      return;
    }

    // Add the user's ID to the likes_jsonb array and increment the like count (likes column)
    await picture.update({
      likes_jsonb: [...(picture.likes_jsonb || []), user.user_id], // Add user_id to the array
      likes: (picture.likes || 0) + 1, // Increment the like count
    });

    console.log("Picture liked successfully:", { pictureId, userId: user.user_id });

    res.json({ failed: false, message: "Picture liked successfully!" });
  } catch (error) {
    console.error("Error liking picture:", error);
    res.json({ failed: true, error: "INTERNAL_ERROR" });
  }
};



export const postComment: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { pictureId } = req.params;  // Get pictureId from the URL params
    const { comment_text } = req.body;  // Get the comment text from the body

    const user = (req as AuthenticatedRequest).user as AuthenticatedUser;  // Get the authenticated user

    if (!comment_text) {
      console.error("No comment text provided");
      res.json({ failed: true, error: "NO_COMMENT_TEXT" });
      return;
    }

    const picture = await Picture.findByPk(pictureId);

    if (!picture) {
      console.error("Picture not found:", pictureId);
      res.json({ failed: true, error: "NO_SUCH_ENTITY" });
      return;
    }

    // Create a new comment object
    const newComment = {
      username: user.username,
      comment_text,
      timestamp: new Date(),
    };

    // Update the picture with the new comment
    await picture.update({
      comments_jsonb: [...(picture.comments_jsonb || []), newComment],  // Add the new comment
    });

    console.log("Comment added successfully:", { pictureId, userId: user.user_id });

    res.json({ failed: false, message: "Comment added successfully!" });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.json({ failed: true, error: "INTERNAL_ERROR" });
  }
};



export const getPicturesByAuthor = async (req: Request, res: Response) => {
  try {
    const { authorId } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 25);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const olderFirst = req.query.older_first === 'true';

    const whereClause = { "author.user_id": authorId };

    // Fetch total count of pictures for pagination
    const totalPictures = await Picture.count({ where: whereClause });

    // Fetch paginated pictures
    const pictures = await Picture.findAll({
      where: whereClause,
      order: [['created_at', olderFirst ? 'ASC' : 'DESC']],
      limit,
      offset: (page - 1) * limit,
      attributes: [
        'picture_id',
        'name',
        'picture_data',
        'author',
        'created_at',
        'updated_at',
        'likes',
        'comments_jsonb',
      ],
    });

    res.json({
      pictures: pictures.map((picture) => ({
        ...picture.toJSON(),
        author: {
          user_id: picture.author?.user_id,
          username: picture.author?.username,
        },
      })),
      total: totalPictures,
      page,
      perPage: limit,
      totalPages: Math.ceil(totalPictures / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ failed: true, error: 'INTERNAL_ERROR' });
  }
};





