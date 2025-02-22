"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { getPosts, toggleLike, createComment, toggleCommentLike } from "../actions/useraction";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import { FaRobot } from "react-icons/fa";
import { Navigation, Pagination } from "swiper/modules";
import SummaryButton from "../components/SummaryButton";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function Home() {
    const { user, isLoaded } = useUser();
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    const fetchPosts = async () => {
        try {
            const result = await getPosts();
            if (result.success) {
                setPosts(result.posts.map(post => ({
                    ...post,
                    likes: post.likes.map(id => id.toString())
                })));

                // Check if the URL has a postId and set selectedPost
                const postId = searchParams.get("post");
                if (postId) {
                    const post = result.posts.find(p => p._id === postId);
                    if (post) setSelectedPost(post);
                } else {
                    setSelectedPost(null);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/signup");
            return;
        }
        const postId = searchParams.get("post");
        user && fetchPosts(postId);
    }, [user, isLoaded, searchParams.get("post")]);

    const handleLike = async (postId) => {
        if (!user) return;
        const originalPosts = [...posts];

        setPosts(posts.map(post => {
            if (post._id === postId) {
                const isLiked = post.likes.includes(user.id);
                return {
                    ...post,
                    likes: isLiked
                        ? post.likes.filter(id => id !== user.id)
                        : [...post.likes, user.id]
                };
            }
            return post;
        }));

        if (selectedPost && selectedPost._id === postId) {
            const isLiked = selectedPost.likes.includes(user.id);
            setSelectedPost({
                ...selectedPost,
                likes: isLiked
                    ? selectedPost.likes.filter(id => id !== user.id)
                    : [...selectedPost.likes, user.id]
            });
        }

        try {
            const result = await toggleLike(postId, user.id);
            if (result.error) throw result.error;

            setPosts(posts.map(post =>
                post._id === postId ? { ...post, likes: result.likes } : post
            ));

            if (selectedPost && selectedPost._id === postId) {
                setSelectedPost({ ...selectedPost, likes: result.likes });
            }
        } catch (error) {
            setPosts(originalPosts);
            alert(error.message || "Failed to update like");
        }
    };

    const handleComments = (post) => {
        setSelectedPost(post);
        router.push(`?post=${post._id}`, undefined, { shallow: true });
    };

    const goBackToHome = () => {
        setSelectedPost(null);
        router.push("/home", undefined, { shallow: true });
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
                <Link href={"/"}><h1 className="text-2xl font-bold text-gray-800">DISGRAM</h1></Link>
                <div className="flex gap-10 items-center">

                    <Link href={'/profile'}><button className="flex flex-col items-center gap-1 hover:text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-xs">Profile</span>
                    </button>
                    </Link>

                    <Link href={'/chatbot'}><button className="flex flex-col items-center gap-1 hover:text-blue-600">
                        <FaRobot/>
                        <span className="text-xs">Chatbot</span>
                    </button>
                    </Link>
                </div>
                {selectedPost && (
                    <button onClick={goBackToHome} className="text-blue-500">
                        Back to Home
                    </button>
                )}
            </header>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* show selected post onlyy */}
                {selectedPost ? (
                    <PostComponent
                        post={selectedPost}
                        handleLike={handleLike}
                        isSingleView={true}
                    />
                ) : (
                    posts.map((post) => (

                        <PostComponent
                            key={post._id}
                            post={post}
                            handleLike={handleLike}
                            handleComments={handleComments}
                        />


                    ))
                )}
            </div>
            <Link href="/createpost" className="fixed bottom-16 right-6">
                <button className="w-14 h-14 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center text-white transition-transform hover:scale-105">
                    <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </button>
            </Link>
        </div>
    );
}

function PostComponent({ post, handleLike, handleComments, isSingleView }) {
    const { user } = useUser();
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState(post.comments || []);

    useEffect(() => {
        setComments(post.comments || []);
    }, [post]);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;

        try {
            const result = await createComment(post._id, user.id, newComment);
            if (result.error) throw result.error;

            setComments(prev => [...prev, result.comment]);
            setNewComment('');
        } catch (error) {
            alert(error.message || 'Failed to post comment');
        }
    };

    const handleCommentLike = async (commentId) => {
        if (!user) return;
        const originalComments = [...comments];

        // Optimistic update
        setComments(comments.map(comment => comment._id === commentId ? {
            ...comment,
            likes: comment.likes.includes(user.id)
                ? comment.likes.filter(id => id !== user.id)
                : [...comment.likes, user.id]
        } : comment));

        try {
            const result = await toggleCommentLike(post._id, commentId, user.id);
            if (result.error) throw result.error;

            // Update with actual server state
            setComments(comments.map(comment => comment._id === commentId ? {
                ...comment,
                likes: result.likes
            } : comment));
        } catch (error) {
            setComments(originalComments);
            alert(error.message || "Failed to update like");
        }
    };

    return (
        <>
            <article className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                        {post.author.profilepic && (
                            <img
                                src={post.author.profilepic}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            {post.author.username}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        </p>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {post.title}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
                </div>

                {post.images?.length > 0 && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                        <Swiper
                            modules={[Navigation, Pagination]}
                            navigation
                            pagination={{ clickable: true }}
                            className="rounded-lg"
                        >
                            {post.images.map((img, index) => (
                                <SwiperSlide key={index}>
                                    <div className="aspect-video bg-gray-100">
                                        <img
                                            src={img}
                                            alt={`Post image ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                )}

                <div className="flex items-center gap-6 text-gray-600">
                    <button
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-2 transition-colors ${post.likes.includes(user?.id)
                            ? "text-red-500"
                            : "text-gray-600 hover:text-red-500"
                            }`}
                    >
                        ❤️ <span>{post.likes.length}</span>
                    </button>

                    {!isSingleView && (
                        <button onClick={() => handleComments(post)} className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                            💬 <span>{comments.length}</span>
                        </button>
                    )}
                    <SummaryButton content={post.content} />


                </div>

                {/* Comments section */}
                {isSingleView && (
                    <div className="mt-4">
                        {/* Comment form */}
                        <form onSubmit={handleSubmitComment} className="mb-4">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full p-2 border rounded-lg"
                            />
                            <button
                                type="submit"
                                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
                            >
                                Post Comment
                            </button>
                        </form>

                        {/* Comments list */}
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <div key={comment._id} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        {comment.author.profilepic ? (
                                            <img
                                                src={comment.author.profilepic}
                                                alt="Profile"
                                                className="w-8 h-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                                        )}
                                        <div>
                                            <span className="font-semibold">{comment.author.username}</span>
                                            <span className="text-xs text-gray-500 ml-2">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-gray-800">{comment.content}</p>
                                    <button
                                        onClick={() => handleCommentLike(comment._id)}
                                        className={`mt-2 flex items-center gap-1 ${comment.likes.includes(user?.id) ? 'text-red-500' : 'text-gray-600'}`}
                                    >
                                        ❤️ {comment.likes.length}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </article>
        </>
    );
}