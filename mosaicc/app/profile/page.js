"use client";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { updateProfilePic, getProfilePic, getUserPosts } from "../actions/useraction";
import { useRouter } from "next/navigation";


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
        <div className="max-w-[80%] mx-auto p-6 bg-white shadow-lg rounded-md text-center">
            <h2 className="text-2xl font-semibold mb-4">Profile Page</h2>

            <label className="block w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-gray-300 cursor-pointer">
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

            {loading && <p className="text-gray-500 mt-2">Uploading...</p>}

            {/* User Posts Section */}
            <div className="flex flex-col items-center">
                <div className="grid grid-cols-3 gap-4 mt-6 w-full max-w-2xl">
                    {userPosts.length > 0 ? (
                        userPosts.map((post) => (
                            <div
                                key={post._id}
                                className="w-full h-32 bg-gray-300 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
                                onClick={() => router.push(`/home?post=${post._id}`)}
                                style={{
                                    backgroundImage: post.images.length > 0 ? `url(${post.images[0]})` : "none",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    backgroundColor: post.images.length === 0 ? "#e5e7eb" : "transparent",
                                }}
                            >
                                {post.images.length === 0 && (
                                    <p className="text-gray-700 text-sm">No Image</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No posts yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
