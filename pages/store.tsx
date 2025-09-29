// pages/store.tsx
import React from "react";
import Link from "next/link";

const WORK_IN_PROGRESS = true;

export default function Store() {
  if (WORK_IN_PROGRESS) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-800 via-purple-900 to-indigo-950 text-white text-center px-4">
        <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">Store</h1>
        <p className="text-xl text-purple-200 mb-2">🚧 Work in Progress 🚧</p>
        <p className="max-w-md text-lg text-purple-300 leading-relaxed mb-8">
          The gallery shop is still under construction.  
          Soon you’ll be able to support, explore, and unlock exclusive content here.  
          Stay tuned!
        </p>

        <Link href="/gallery">
          <button className="px-6 py-3 bg-purple-700 hover:bg-purple-600 rounded-2xl shadow-lg transition duration-300 text-white font-semibold">
            ← Return to Gallery
          </button>
        </Link>
      </div>
    );
  }

  // your existing store code goes here
}
