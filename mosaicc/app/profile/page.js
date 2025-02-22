"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { updateProfilePic, getProfilePic, getUserPosts } from "../actions/useraction";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
    const [profilePic, setProfilePic] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userPosts, setUserPosts] = useState([]);
    const { user, isLoaded } = useUser();
    const userId = user?.id;
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && user) {
            fetchProfilePic(user.id);
            fetchUserPosts(user.id);
        }
    }, [user, isLoaded]);

    const fetchProfilePic = async (userId) => {
        try {
            const pic = await getProfilePic(userId);
            setProfilePic(pic);
        } catch (error) {
            console.error("Failed to fetch profile picture:", error);
        }
    };

    const fetchUserPosts = async (userId) => {
        try {
            const posts = await getUserPosts(userId);
            setUserPosts(posts);
        } catch (error) {
            console.error("Failed to fetch user posts:", error);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 4.5 * 1024 * 1024) {
            alert("Image is too large! Please upload images under 4.5MB.");
            return;
        }

        try {
            setLoading(true);
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            });

            const formData = new FormData();
            formData.append("file", compressedFile);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Image upload failed");

            const { url } = await response.json();
            setProfilePic(url);
            await updateProfilePic(userId, url);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload image.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-center mb-4">Profile Page
<div className="m-4">
            <UserButton />

</div>
            </h2>
            <hr className="mb-4" />
            
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
                <label className="block w-32 h-32 rounded-full border-4 border-gray-300 overflow-hidden cursor-pointer mb-4">
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={profilePic ? {
                            backgroundImage: `url(${profilePic})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        } : { backgroundColor: "#e5e7eb" }}
                    />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={loading} />
                </label>
                {loading && <p className="text-gray-500">Uploading...</p>}
            </div>
            
            <hr className="my-6" />
            
            {/* User Posts Section */}
            <h3 className="text-lg font-semibold text-center mb-4">Your Posts</h3>
            <div className="grid grid-cols-3 gap-4">
                {userPosts.length > 0 ? (
                    userPosts.map((post) => (
                        <div
                            key={post._id}
                            className="w-full h-32 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden shadow-sm hover:shadow-md transition"
                            onClick={() => router.push(`/home?post=${post._id}`)}
                            style={{
                                backgroundImage: post.images.length > 0 ? `url(${post.images[0]})` : "none",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        >
                            {post.images.length === 0 && (
                                <p className="text-gray-700 text-sm">No Image</p>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 col-span-3 text-center">No posts yet.</p>
                )}
            </div>
            <Link href={"/home"}>< div className="mt-5">
                <button className="p-5 rounded-md bg-black text-white align-middle">Back to Home</button>
            </div>
            </Link>
        </div>
    );
}