"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import {
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";
import { useSession, signIn, signOut } from "next-auth/react";
import FieldNoteForm from "./FieldNoteForm";

type FieldNote = {
  id: number;
  slug: string;
  title: string;
  content: string;
  author: string;
  date: string;
  tags?: string;
  type?: string;
  mood?: string;
  images?: string[];
  is_public?: boolean;
  shared_family?: boolean;
  userEmail?: string;
};

interface FieldNoteDetailProps {
  slug: string;
}

const FieldNoteDetail: React.FC<FieldNoteDetailProps> = ({ slug }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [fieldNote, setFieldNote] = useState<FieldNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nameFromDB, setNameFromDB] = useState<string | null>(null);

  // Fetch user's database name
  useEffect(() => {
    async function fetchUserName() {
      if (!session?.user?.email) {
        setNameFromDB(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/userinfo?email=${encodeURIComponent(session.user.email)}`
        );
        if (response.ok) {
          const data = await response.json();
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

  useEffect(() => {
    async function fetchFieldNote() {
      if (status === "loading") {
        setLoading(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("Fetching field note with session:", {
          status,
          isAuthenticated: !!session,
          userEmail: session?.user?.email,
          slug,
        });

        const params = new URLSearchParams();
        if (status === "authenticated" && session?.user?.email) {
          params.set("userEmail", session.user.email);
        }
        const queryString = params.toString();
        let url = `/api/fieldnotes/${slug}`;
        if (queryString) {
          url += `?${queryString}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          const errorData = await res.json();
          console.error("API Error:", {
            status: res.status,
            error: errorData,
            url: url,
            userEmail: session?.user?.email,
          });
          if (res.status === 404) {
            setError(`Field note not found - ${errorData.error || ""}`);
          } else {
            setError(`Failed to load field note - ${errorData.error || ""}`);
          }
          return;
        }
        const data = await res.json();
        console.log("Field note data received:", {
          fieldNoteUserEmail: data.userEmail,
          sessionUserEmail: session?.user?.email,
          canEdit: data.userEmail === session?.user?.email,
          hasSession: !!session,
        });
        setFieldNote(data);
      } catch (error) {
        console.error("Failed to load field note:", error);
        setError("Failed to load field note");
      } finally {
        setLoading(false);
      }
    }

    fetchFieldNote();
  }, [slug, session, status]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleFormSubmit = async (formData: {
    title: string;
    content: string;
    tags?: string;
    mood?: string;
    type?: string;
    images?: string[];
    is_public?: boolean;
    shared_family?: boolean;
  }) => {
    if (!fieldNote) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/fieldnotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: fieldNote.id,
          userEmail: session?.user?.email,
          userName: session?.user?.name,
          ...formData,
          shared_family: formData.shared_family, // Ensure consistent field name
        }),
      });

      if (res.ok) {
        const updatedFieldNote = await res.json();
        setFieldNote(updatedFieldNote);
        setIsEditing(false);

        // If slug changed, redirect to new URL
        if (updatedFieldNote.slug !== slug) {
          router.push(`/fieldnotes/${updatedFieldNote.slug}`);
        }
      } else {
        const errorData = await res.json();
        console.error("Update error:", errorData);
        alert(
          `Error updating fieldnote: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Failed to update field note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!fieldNote) return;

    try {
      const res = await fetch("/api/fieldnotes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: fieldNote.id,
          userEmail: session?.user?.email,
        }),
      });

      if (res.ok) {
        router.push("/fieldnotes");
      } else {
        const errorData = await res.json();
        console.error("Delete error:", errorData);
        alert(
          `Error deleting fieldnote: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Failed to delete field note:", err);
    }
  };

  const formatTags = (tags: string) => {
    if (!tags) return [];
    return tags.split(/[ ,]+/).filter((tag) => tag.trim().length > 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: { [key: string]: string } = {
      excited: "🎉",
      happy: "😊",
      reflective: "🤔",
      inspired: "💡",
      calm: "😌",
      adventurous: "🏔️",
    };
    return moodEmojis[mood] || "";
  };

  const openImageModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const goToNextImage = () => {
    if (fieldNote?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % fieldNote.images!.length);
    }
  };

  const goToPreviousImage = () => {
    if (fieldNote?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? fieldNote.images!.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading field note...</div>
      </div>
    );
  }

  if (error || !fieldNote) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="max-xl bg-white flex-1">
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link
                  href="/fieldnotes"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowBackIcon className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-lg font-medium text-gray-900">
                    Field Note Not Found
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 text-center">
            <p className="text-gray-500 mb-4">{error}</p>
            <Link
              href="/fieldnotes"
              className="text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              ← Back to Field Notes
            </Link>
          </div>
        </div>
        {renderFooter()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex-1">
        {/* Header */}
        <div className="flex items-center justify-between h-[61px] border-b border-gray-200 px-3">
          <div className="flex items-center space-x-3">
            <Link href="/fieldnotes">
              <button className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer">
                <ArrowBackIcon sx={{ fontSize: 16 }} />
                Back to Field Notes
              </button>
            </Link>
            {/* <div>
              <h1 className="text-lg font-medium text-gray-900">
                {isEditing ? "Edit Field Note" : fieldNote.title}
              </h1>
            </div> */}
          </div>

          {/* Desktop Auth UI */}
          <div className="hidden sm:flex items-center gap-2 pr-4">
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
                        className="rounded-full border border-gray-300 cursor-pointer hover:scale-105 transition"
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
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 rounded bg-gray-600 text-white font-mono text-sm hover:bg-gray-700 transition"
                >
                  Sign Up
                </Link>
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => signIn("google")}
                  className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                >
                  Sign in with Google
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Auth UI - Only visible on mobile */}
        {session && (
          <div className="sm:hidden px-3 py-2 border-b border-gray-200 flex justify-center">
            <span className="flex items-center gap-2 font-mono text-blue-600 text-sm">
              {session.user?.image && (
                <Link href="/user/profile">
                  <Image
                    src={session.user.image}
                    alt={session.user?.name || "User profile"}
                    width={28}
                    height={28}
                    className="rounded-full border border-gray-300 cursor-pointer hover:scale-105 transition"
                  />
                </Link>
              )}
              {nameFromDB ? `Signed in as ${nameFromDB}` : ""}
            </span>
          </div>
        )}

        {/* Content */}
        {isEditing ? (
          <FieldNoteForm
            initialData={fieldNote}
            isEditing={true}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="p-4 pt-12 max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {fieldNote.title}
              </h1>

              {/* Metadata */}
              <div className="space-y-1 text-sm text-gray-500 mb-6">
                <div>
                  By {fieldNote.author} on {formatDate(fieldNote.date)}
                </div>
                {fieldNote.mood && (
                  <div className="flex items-center gap-2">
                    <span>Feeling</span>
                    <span className="text-lg">
                      {getMoodEmoji(fieldNote.mood)}
                    </span>
                    <span>{fieldNote.mood}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="prose max-w-none">
                {fieldNote.type === "ShortStory" ? (
                  <div className="text-gray-800 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {fieldNote.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {fieldNote.content}
                  </div>
                )}
              </div>

              {/* Images */}
              {fieldNote.images && fieldNote.images.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {fieldNote.images.map((image, index) => (
                    <Image
                      key={`image-${fieldNote.id}-${index}`}
                      src={image}
                      alt={`Field note photo ${index + 1}`}
                      width={96}
                      height={96}
                      className="h-24 w-24 object-cover rounded-lg border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openImageModal(index)}
                    />
                  ))}
                </div>
              )}

              {/* Tags and Action Icons - Desktop version */}
              {(formatTags(fieldNote.tags || "").length > 0 ||
                (session &&
                  !isEditing &&
                  fieldNote.userEmail === session.user?.email)) && (
                <div className="hidden md:block">
                  <hr className="border-gray-200" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-wrap gap-2">
                      {formatTags(fieldNote.tags || "").map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          className="bg-gray-50"
                        />
                      ))}
                    </div>
                    {session &&
                      !isEditing &&
                      fieldNote.userEmail === session.user?.email && (
                        <div className="flex items-center space-x-2 ml-4">
                          <IconButton onClick={handleEdit} size="small">
                            <EditIcon className="w-5 h-5" />
                          </IconButton>
                          <IconButton
                            onClick={() => setIsDeleteDialogOpen(true)}
                            size="small"
                            className="bg-gray-50"
                          >
                            <DeleteIcon className="w-5 h-5" />
                          </IconButton>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Mobile-only action icons */}
              {session &&
                !isEditing &&
                fieldNote.userEmail === session.user?.email && (
                  <div className="md:hidden">
                    <hr className="border-gray-200" />
                    <div className="flex justify-end pt-4">
                      <div className="flex items-center space-x-2">
                        <IconButton onClick={handleEdit} size="small">
                          <EditIcon className="w-5 h-5" />
                        </IconButton>
                        <IconButton
                          onClick={() => setIsDeleteDialogOpen(true)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon className="w-5 h-5" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Image Modal */}
        <Dialog
          open={isImageModalOpen}
          onClose={closeImageModal}
          maxWidth="lg"
          fullWidth
          slotProps={{
            paper: {
              style: {
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                boxShadow: "none",
                borderRadius: 0,
              },
            },
          }}
        >
          <div className="relative">
            {/* Close Button */}
            <IconButton
              onClick={closeImageModal}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 10,
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Navigation Buttons */}
            {fieldNote?.images && fieldNote.images.length > 1 && (
              <>
                <IconButton
                  onClick={goToPreviousImage}
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "white",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    zIndex: 10,
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  onClick={goToNextImage}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "white",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    zIndex: 10,
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}

            {/* Image */}
            {fieldNote?.images?.[currentImageIndex] && (
              <div className="flex justify-center items-center p-4">
                <Image
                  src={fieldNote.images[currentImageIndex]}
                  alt={`Field note photo ${currentImageIndex + 1}`}
                  width={800}
                  height={600}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
            )}

            {/* Image Counter */}
            {fieldNote?.images && fieldNote.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
                {currentImageIndex + 1} / {fieldNote.images.length}
              </div>
            )}
          </div>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Field Note</DialogTitle>
          <DialogContent>
            <p>
              Are you sure you want to delete &ldquo;{fieldNote.title}&rdquo;?
              This action cannot be undone.
            </p>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>

      {/* Footer */}
      {renderFooter()}
    </div>
  );
};

// Fixed syntax issues
export default FieldNoteDetail;
