"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createUser } from "../actions/useraction";
import { Loader2 } from "lucide-react";

const Page = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    setError("");
    try {
      if (!username) {
        throw new Error("Username is required");
      }

      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) {
        throw new Error("No verified email found");
      }

      const result = await createUser(user?.fullName, email, username, user?.id);
      
      if (result?.error) {
        throw new Error(result.error);
      }
      // Push to home page
      router.push("/home");
    } catch (error) {
      console.log(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/signup");
    }
    if (user?.publicMetadata?.username) {
      router.push("/home");
    }
  }, [user, isLoaded, router]);

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-400 to-indigo-600 p-6">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-96 text-center transition transform hover:scale-105">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">Enter Your Username</h1>
        <input
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
        />
        <div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <button
          onClick={handleUpdate}
          disabled={loading}
          className={`mt-4 w-full bg-blue-500 text-white py-3 rounded-lg font-medium text-lg transition flex items-center justify-center gap-2 ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default Page;
