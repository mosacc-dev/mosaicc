"use client"
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
    <div>
      <Link href={"/signup"}><button className="p-8 rounded-md text-white bg-slate-900 m-10">Go to Sign up Page</button></Link>

    </div>
    </>
  );
}
