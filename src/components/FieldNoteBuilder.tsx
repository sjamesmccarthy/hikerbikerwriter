"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { renderFooter } from "./shared/footerHelpers";
import { useSession } from "next-auth/react";
import FieldNoteForm from "./FieldNoteForm";

const FieldNoteBuilder: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: {
    title: string;
    content: string;
    tags?: string;
    mood?: string;
    images?: string[];
  }) => {
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/fieldnotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userEmail: session?.user?.email,
          userName: session?.user?.name,
        }),
      });

      if (res.ok) {
        // Redirect back to the field notes index
        router.push("/fieldnotes");
      }
    } catch (error) {
      console.error("Failed to create field note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/fieldnotes");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex-1">
        {/* Header */}
        <div className="flex items-center justify-between h-[61px] border-b border-gray-200 px-3">
          <div className="flex items-center space-x-2">
            <Link href="/fieldnotes">
              <button className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                <ArrowBackIcon sx={{ fontSize: 16 }} />
                Back to Field Notes
              </button>
            </Link>
          </div>

          {/* Action buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {session ? (
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
                Signed in as {session.user?.name}
              </span>
            ) : null}
          </div>
        </div>

        {/* Form */}
        <FieldNoteForm
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

export default FieldNoteBuilder;
