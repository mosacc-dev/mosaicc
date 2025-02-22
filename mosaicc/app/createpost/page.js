"use client";
import { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { useUser } from "@clerk/nextjs";
import { createPost } from "../actions/useraction";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const userId = user?.id;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/signup");
    }
  }, [user, isLoaded, router]);

  const handleImageUpload = async (e) => {
    const selectedImages = Array.from(e.target.files);

    if (selectedImages.length + imageFiles.length > 3) {
      alert("You can only upload a maximum of 3 images.");
      return;
    }

    const compressedImages = [];
    const newPreviews = [];

    for (const image of selectedImages) {
      if (image.size > 4.5 * 1024 * 1024) {
        alert(`"${image.name}" is too large! Please upload images under 4.5MB.`);
        continue;
      }

      try {
        const compressedImage = await imageCompression(image, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        compressedImages.push(compressedImage);
        newPreviews.push(URL.createObjectURL(compressedImage));
      } catch (error) {
        console.error("Compression error:", error);
      }
    }

    setImageFiles([...imageFiles, ...compressedImages]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content || imageFiles.length === 0) {
      alert("Please fill in all fields and upload at least one image.");
      return;
    }

    setLoading(true);

    try {
      const uploadedImageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Image upload failed");

          const { url } = await response.json();
          return url;
        })
      );

      const result = await createPost(userId, title, content, uploadedImageUrls);
      if (result.error) {
        alert("Failed to create post: " + result.error);
      } else {
        alert("Post created successfully!");
        setTitle("");
        setContent("");
        setImageFiles([]);
        setImagePreviews([]);
        router.push("/home");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload images.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-2xl rounded-lg space-y-6">
      <h2 className="text-3xl font-bold text-center text-gray-800">Create a Post</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Post Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          placeholder="Post Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows="4"
        ></textarea>

        <label className="flex flex-col items-center justify-center w-full px-4 py-3 text-white bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700">
          Upload Images (Max 3)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {imagePreviews.map((src, index) => (
              <img key={index} src={src} alt="preview" className="w-24 h-24 object-cover rounded-lg shadow" />
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 transition-all"
        >
          {loading ? "Uploading..." : "Create Post"}
        </button>
      </form>

      <div className="text-center">
        <Link href="/home">
          <button className="mt-4 px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition-all">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}