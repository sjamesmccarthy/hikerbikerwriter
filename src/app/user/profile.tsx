"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import RecipeViewer from "../../components/RecipeViewer";

export default function UserProfilePage() {
  const { data: session, status } = useSession();

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
      {/* Header and layout from RecipeViewer */}
      <RecipeViewer />
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
          <p className="text-gray-600 mb-2">{session.user.email}</p>
          {/* Add more user info or actions here */}
        </div>
      </main>
      <RecipeViewer />
    </div>
  );
}
