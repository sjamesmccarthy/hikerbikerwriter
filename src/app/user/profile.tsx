"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-lg text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!session.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            User information is unavailable.
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto p-8">
        <div className="flex flex-col items-center">
          <Image
            src={session.user.image ?? ""}
            alt={session.user.name || "User profile"}
            width={96}
            height={96}
            className="rounded-full border border-gray-300 mb-4"
          />
          <h1 className="text-2xl font-bold mb-2">{session.user.name}</h1>
          <p className="text-gray-600 mb-4">{session.user.email}</p>

          {/* Add Person Button */}
          <button
            onClick={() => {
              console.log("Current showSearch:", showSearch);
              setShowSearch(!showSearch);
              console.log("New showSearch value:", !showSearch);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors mb-4"
          >
            {showSearch ? "Hide Search" : "Add Person"}
          </button>

          {/* Search Container */}
          {showSearch && (
            <div className="mt-6 w-full max-w-md bg-white p-6 rounded-lg shadow-md">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a person..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    // TODO: Implement search functionality
                    console.log("Searching for:", searchQuery);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Find
                </button>
              </div>

              {/* Search Results will go here */}
              <div className="mt-4">
                {/* TODO: Add search results display */}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
