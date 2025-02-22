"use client"
import React from 'react'
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createUser } from '../actions/useraction';
import { useEffect, useState } from 'react';
//HEY:))
const Page = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    try {
      if (!username) {
        throw new Error('Username is required');
      }

      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) {
        throw new Error('No verified email found');
      }

      const result = await createUser(user?.fullName, email, username,user?.id);
      
      if (result?.error) {
        throw new Error(result.error);
      }
      //PUSH TO HOME PAGE
      router.push('/home');
    } catch (error) {
      console.log(error)
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/signup');
    }
    
    // If user exists but already has username redirect home
    if (user?.publicMetadata?.username) {
      router.push('/home');
    }
  }, [user, isLoaded, router]);

  if (!isLoaded || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-80 text-center">
        <h1 className="text-xl font-semibold mb-4">Enter Your Username</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <button 
          onClick={handleUpdate}
          disabled={loading}
          className={`mt-4 w-full bg-blue-500 text-white py-2 rounded-lg transition ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
        >
          {loading ? 'Creating...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
//What do you call a chicken father?
//Chicken-ke-bab
//What do you call a chicken mother?
//Your time to guess:)

export default Page;