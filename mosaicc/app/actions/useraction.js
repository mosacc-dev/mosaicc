'use server';

import { dbConnect } from '@/lib/mongodb';
import User from '../models/User';
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