'use server';

import { dbConnect } from '@/lib/mongodb';
import User from '../models/User';
import Posts from '../models/Posts';
import { updateUserMetadata } from '@/lib/clerk';


export async function createUser(name, email, username, userId) {
    try {
    //Connecting database bruhhh
      await dbConnect();
  
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return { error: 'Username already exists' };
      }
      //Creating new user hehe
      const newUser = new User({
        clerkUserId: userId,
        name,
        email,
        username,
      });
  
      await newUser.save();
      await updateUserMetadata(userId, { username: newUser.username });
  
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      return { error: error.message };
    }
  }

  export async function createPost(authorId, title, content, imageUrls) {
    try {
      await dbConnect();
      const user = await User.findOne({ clerkUserId: authorId });
      if (!user) throw new Error("User not found");
  
      if (!authorId || !title || !content || imageUrls.length === 0) {
        return { error: "Author, content, and at least one image are required." };
      }
  
      const newPost = new Posts({
        author: user._id,
        title,
        content,
        images: imageUrls,
      });
  
      await newPost.save();
      return { success: true };
  
    } catch (error) {
      console.error("Error creating post:", error);
      return { error: error.message };
    }
  }

