"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Link href="/signup">
        <button className="px-6 py-3 text-lg font-semibold text-white bg-slate-900 rounded-lg shadow-md transition-transform transform hover:scale-105 hover:bg-slate-800">
          Go to Sign Up Page
        </button>
      </Link>
    </div>
  );
}
