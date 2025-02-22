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
    //Just creating post
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

export async function getPosts() {
  try {
    await dbConnect();

    const posts = await Posts.find()
      .populate('author', 'username profilepic clerkUserId')
      .populate('comments.author', 'username profilepic clerkUserId')
      .sort({ createdAt: -1 })
      .lean()
      .transform(docs => docs.map(doc => ({
        ...doc,
        _id: doc._id.toString(),
        likes: doc.likes.map(id => id.toString()),
        author: {
          ...doc.author,
          _id: doc.author._id.toString(),
          clerkUserId: doc.author.clerkUserId
        },
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        comments: doc.comments.map(comment => ({
          ...comment,
          _id: comment._id.toString(),
          author: {
            ...comment.author,
            _id: comment.author._id.toString(),
            clerkUserId: comment.author.clerkUserId
          },
          likes: comment.likes.map(id => id.toString()),
          createdAt: comment.createdAt.toISOString()
        }))
      })));

    return { success: true, posts };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { error: error.message };
  }
}


export async function toggleLike(postId, clerkUserId) {
  try {
    await dbConnect();
    const user = await User.findOne({ clerkUserId });
    if (!user) return { error: "User not found" };

    const post = await Posts.findById(postId);
    if (!post) return { error: "Post not found" };

    const hasLiked = post.likes.some(id => id.equals(user._id));

    if (hasLiked) {
      post.likes.pull(user._id);
    } else {
      post.likes.push(user._id);
    }

    await post.save();
    return {
      success: true,
      likes: post.likes.map(id => id.toString())
    };
  } catch (error) {
    console.error("Like error:", error);
    return { error: "Failed to update like" };
  }
}

export async function createComment(postId, clerkUserId, content) {
  try {
    await dbConnect();
    const user = await User.findOne({ clerkUserId });
    if (!user) throw new Error("User not found");

    const post = await Posts.findById(postId);
    if (!post) throw new Error("Post not found");

    const newComment = {
      author: user._id,
      content,
      likes: []
    };

    post.comments.push(newComment);
    await post.save();

    return {
      success: true,
      comment: {
        ...newComment,
        _id: post.comments[post.comments.length - 1]._id.toString(),
        author: {
          _id: user._id.toString(),
          username: user.username,
          profilepic: user.profilepic,
          clerkUserId: user.clerkUserId
        },
        createdAt: new Date().toISOString(),
        likes: []
      }
    };
  } catch (error) {
    console.error("Error creating comment:", error);
    return { error: error.message };
  }
}

export async function toggleCommentLike(postId, commentId, clerkUserId) {
  try {
    await dbConnect();
    const user = await User.findOne({ clerkUserId });
    if (!user) return { error: "User not found" };

    const post = await Posts.findById(postId);
    if (!post) return { error: "Post not found" };

    const comment = post.comments.id(commentId);
    if (!comment) return { error: "Comment not found" };

    const hasLiked = comment.likes.some(id => id.equals(user._id));

    if (hasLiked) {
      comment.likes.pull(user._id);
    } else {
      comment.likes.push(user._id);
    }

    await post.save();

    return {
      success: true,
      likes: comment.likes.map(id => id.toString())
    };
  } catch (error) {
    console.error("Comment like error:", error);
    return { error: "Failed to update comment like" };
  }
}
export const updateProfilePic = async (userId, profilePicUrl) => {
  try {
    if (!userId || !profilePicUrl) {
      throw new Error("User ID and profile picture URL are required.");
    }

    const user = await User.findOneAndUpdate(
      { clerkUserId: userId },
      { profilepic: profilePicUrl },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found.");
    }

  } catch (error) {
    console.error("Error updating profile picture:", error);
    throw error;
  }
};

export const getProfilePic = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    const user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      throw new Error("User not found.");
    }

    return user.profilepic || ""; // Return profilepic or an empty string if not set
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    throw error;
  }
};

export const getUserPosts = async (clerkUserId) => {
  try {
    // First, find the MongoDB User ID using Clerk's user ID
    const user = await User.findOne({ clerkUserId: clerkUserId }).select("_id");
    if (!user) throw new Error("User not found");

    // Now, fetch posts using the MongoDB ObjectId
    const posts = await Posts.find({ author: user._id }).select("_id title images").lean()
    const formattedPosts = posts.map(post => ({
      ...post,
      _id: post._id.toString()
    }));

    return formattedPosts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
};



