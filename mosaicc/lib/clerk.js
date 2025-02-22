import { clerkClient } from '@clerk/nextjs/server';

export async function updateUserMetadata(userId, metadata) {
  try {
    const client = await clerkClient()
    const updatedUser = await client.users.updateUser(userId, {
      publicMetadata: metadata
    });
    return updatedUser;
  } catch (error) {
    console.error('Error updating user metadata:', error);
    throw new Error('Failed to update user metadata');
  }
}