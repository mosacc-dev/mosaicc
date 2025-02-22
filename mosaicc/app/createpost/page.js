"use client";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import { useUser } from "@clerk/nextjs";
import { createPost } from "../actions/useraction";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user,isLoaded } = useUser()
  const router = useRouter()
  const userId = user?.id

    useEffect(() => {
      if (isLoaded && !user) {
        router.push('/signup');
      }

    }, [user, isLoaded, router]);


  // Handle Image Upload with Compression
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

  // Handle Form Submission ,Only Uploads Images and max(3) at a time storage issues
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content || imageFiles.length === 0) {
      alert("Please fill in all fields and upload at least one image.");
      return;
    }

    setLoading(true);

    try {
      // Upload each image to Vercel Blob
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
          return url; // Get the uploaded image URL
        })
      );

      const result = await createPost(userId, title, content, uploadedImageUrls);
      if (result.error) {
        alert("Failed to create post: " + result.error);
      } else {
        alert("Post created successfully!");
        setTitle("");
        setContent("")
        setImageFiles([]);
        setImagePreviews([]);
        router.push('/home');
      }

    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload images.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-md">
      <h2 className="text-2xl font-semibold mb-4">Create a Post</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <input
          type="text"
          placeholder="Post Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-md"
        />

        {/* Content */}
        <textarea
          placeholder="Post Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded-md"
          rows="4"
        ></textarea>

        {/* Images */}
        <label className="flex items-center justify-center w-full px-4 py-2 text-white bg-green-500 rounded-md cursor-pointer hover:bg-green-600">
          Upload Images (Max 3)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        {/* Previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-semibold">Selected Images:</p>
            <div className="flex space-x-2">
              {imagePreviews.map((src, index) => (
                <img key={index} src={src} alt="preview" className="w-20 h-20 object-cover rounded-md" />
              ))}
            </div>
          </div>
        )}

        {/* Create Post Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800"
        >
          {loading ? "Uploading..." : "Create Post"}
        </button>
      </form>
    </div>
  );
}
