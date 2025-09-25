"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { renderFooter } from "./shared/footerHelpers";
import { useSession, signOut } from "next-auth/react";
import CreativeWritingForm from "./CreativeWritingForm";

const CreativeWritingBuilder: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameFromDB, setNameFromDB] = useState<string | null>(null);

  // Fetch user's name from database
  useEffect(() => {
    async function fetchUserName() {
      if (!session?.user?.email) {
        setNameFromDB(null);
        return;
      }

      try {
        const res = await fetch(
          `/api/userinfo?email=${encodeURIComponent(session.user.email)}`
        );
        if (res.ok) {
          const data = await res.json();
          setNameFromDB(data.name ?? session.user?.name ?? null);
        } else {
          setNameFromDB(session.user?.name ?? null);
        }
      } catch (error) {
        setNameFromDB(session.user?.name ?? null);
      }
    }

    fetchUserName();
  }, [session]);

  const handleSubmit = async (formData: {
    title: string;
    content: string;
    tags?: string;
    mood?: string;
    type?: string;
    images?: string[];
  }) => {
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/creativewriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userEmail: session?.user?.email,
          userName: session?.user?.name,
        }),
      });

      if (res.ok) {
        // Redirect back to the creative writing index
        router.push("/creativewriting");
      }
    } catch (error) {
      console.error("Failed to create field note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/creativewriting");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex-1">
        {/* Header */}
        <div className="flex items-center justify-between h-[61px] border-b border-gray-200 px-3">
          <div className="flex items-center space-x-2">
            <Link href="/creativewriting">
              <button className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer">
                <ArrowBackIcon sx={{ fontSize: 16 }} />
                <span className="hidden sm:inline">
                  Back to Creative Writing
                </span>
              </button>
            </Link>
          </div>

          {/* Action buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {session ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2 font-mono text-blue-600 text-sm">
                  {session.user?.image && (
                    <Link href="/user/profile">
                      <Image
                        src={session.user.image}
                        alt={session.user?.name || "User profile"}
                        width={28}
                        height={28}
                        className="rounded-full border border-gray-300 transition"
                      />
                    </Link>
                  )}
                  {nameFromDB ? `Signed in as ${nameFromDB}` : ""}
                </span>
                <span className="h-4 w-px bg-gray-300 mx-2" />
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-mono text-sm hover:bg-gray-300 transition cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Auth UI */}
        {session && (
          <div className="sm:hidden px-3 py-2 border-b border-gray-200 flex justify-center">
            <div className="flex items-center space-x-2">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-gray-700 font-mono text-sm">
                {nameFromDB ? `Signed in as ${nameFromDB}` : ""}
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <CreativeWritingForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Footer */}
      {renderFooter()}
    </div>
  );
};

export default CreativeWritingBuilder;
