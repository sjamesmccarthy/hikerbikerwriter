"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowBack as ArrowBackIcon,
  Apps as AppsIcon,
  EditNote as EditNoteIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  Home as HomeIcon,
  MenuBook as FieldNotesIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DragHandleOutlinedIcon from "@mui/icons-material/DragHandleOutlined";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
} from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  renderMoodMenuItems,
  renderMoodMenuItemsWithSx,
} from "./shared/moodHelpers";

type Note = {
  id: number;
  slug: string;
  title: string;
  content: string;
  author: string;
  date: string;
  tags?: string;
  mood?: string;
  images?: string[];
};

const FieldNotes: React.FC = () => {
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const router = useRouter();

  // Helper function to get mood emoji
  const getMoodEmoji = (mood: string | undefined): string => {
    if (!mood) return "";
    switch (mood) {
      case "excited":
        return "🎉";
      case "happy":
        return "😊";
      case "reflective":
        return "🤔";
      case "inspired":
        return "💡";
      case "calm":
        return "�";
      case "adventurous":
        return "🏔️";
      default:
        return "";
    }
  };

  // Apps menu configuration
  const apps = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Md Editor", path: "/markdown", icon: EditNoteIcon },
    { name: "Brew Log", path: "/brewday", icon: LogIcon },
    { name: "Roll&Write", path: "/rollandwrite", icon: RollIcon },
    { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
    { name: "jM Galleries", path: "/jmgalleries", icon: PhotoCameraIcon },
  ];

  // Handle app selection from menu
  const handleAppSelect = (path: string) => {
    router.push(path);
    setIsAppsMenuOpen(false);
  };

  const [showFilters, setShowFilters] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const { data: session, status } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [activeTag, setActiveTag] = useState<string>("All");
  const [minimized, setMinimized] = useState(false);
  const [filterMood, setFilterMood] = useState("any");

  // Set minimized state based on screen size on initial load
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 640) {
        // 640px is sm breakpoint
        setMinimized(true);
      }
    };

    // Check on initial load
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    async function fetchNotes() {
      if (!session?.user?.email) return;

      setLoadingNotes(true);
      const res = await fetch(
        `/api/fieldnotes?userEmail=${encodeURIComponent(session.user.email)}`
      );
      const data = await res.json();
      setNotes(data);
      setLoadingNotes(false);
    }

    if (session?.user?.email) {
      fetchNotes();
    } else if (status !== "loading") {
      // If not loading and no session, stop showing loading notes
      setLoadingNotes(false);
    }
  }, [session, status]);

  // Filter notes by activeTag before rendering
  const filteredNotes = notes.filter((note) => {
    const tagMatch =
      activeTag === "All"
        ? true
        : note.tags
        ? note.tags
            .toLowerCase()
            .split(/[ ,]+/)
            .includes(activeTag.toLowerCase())
        : false;
    const moodMatch = filterMood === "any" ? true : note.mood === filterMood;
    return tagMatch && moodMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex-1">
        {/* Header */}
        <div className="flex items-center space-x-2 h-[61px] border-b border-gray-200 px-3">
          <Link href="/">
            <button className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer">
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
          </Link>

          <div className="h-4 w-px bg-gray-300" />

          {/* Apps Menu */}
          <div className="relative">
            <button
              onClick={() => setIsAppsMenuOpen(!isAppsMenuOpen)}
              className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
              aria-label="Apps Menu"
              aria-expanded={isAppsMenuOpen}
            >
              <AppsIcon sx={{ fontSize: 16 }} />
              Apps
            </button>

            {/* Apps Dropdown */}
            {isAppsMenuOpen && (
              <>
                <button
                  className="fixed inset-0 -z-10 cursor-default"
                  onClick={() => setIsAppsMenuOpen(false)}
                  aria-label="Close menu"
                  tabIndex={-1}
                />
                <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-sm rounded-md shadow-xl border border-white/30 min-w-[200px] overflow-hidden z-50">
                  {apps.map((app) => {
                    const IconComponent = app.icon;
                    return (
                      <button
                        key={app.path}
                        onClick={() => handleAppSelect(app.path)}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                      >
                        <IconComponent sx={{ fontSize: 20 }} />
                        <span className="text-sm font-medium">{app.name}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-gray-300" />

          <h3 className="text-lg font-semibold text-gray-800">Field Notes</h3>
        </div>

        {/* Auth UI - moved outside of centered content */}
        <div className="flex justify-center sm:justify-end px-3 py-2">
          {(() => {
            if (status === "loading") {
              return (
                <span className="font-mono text-gray-500 text-sm">
                  Loading...
                </span>
              );
            }
            if (!session) {
              return (
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
              );
            }
            return (
              <div className="flex items-center gap-2">
                <span className="font-mono text-blue-600 text-sm">
                  Signed in as {session.user?.name}
                </span>
                <span className="h-4 w-px bg-gray-300 mx-2" />
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-mono text-sm hover:bg-gray-300 transition cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            );
          })()}
        </div>

        {/* Horizontal gray line */}
        <div className="border-b border-gray-200 mb-6"></div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col px-0 py-6">
          {/* Intro - full width */}
          <div className="w-full px-6 mb-12 mt-0">
            <p className="text-gray-600 leading-relaxed font-mono text-center">
              <span className="text-2xl font-bold">
                a collection of thoughts
              </span>{" "}
              <br />
              about anything and everything but mostly about hiking, biking,
              writing, photography & brewing{" "}
            </p>
          </div>

          {/* Outer container for filter icon, filter bar, and entry container */}
          <div className="w-3/4 mx-auto">
            {/* Filter Icon Row - 75% width, filter icon always visible, add button only if logged in */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  size="small"
                  sx={{
                    color: "gray",
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  <FilterAltOutlinedIcon />
                </IconButton>
                <IconButton
                  onClick={() => setMinimized(!minimized)}
                  size="small"
                  sx={{ color: "gray" }}
                  aria-label="Minimize List"
                >
                  <DragHandleOutlinedIcon />
                </IconButton>
              </div>
              {session && (
                <Link href="/fieldnotes/builder">
                  <button className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer">
                    <EditNoteOutlinedIcon sx={{ fontSize: 16 }} />
                    New Field Note
                  </button>
                </Link>
              )}
            </div>

            {/* Filter Bar - now inside 75% container and under filter icon */}
            {showFilters && (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
                <div className="flex flex-col gap-3">
                  {/* Date and Mood Filters */}
                  <div className="flex flex-wrap gap-4 items-center">
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel
                        sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                      >
                        Date
                      </InputLabel>
                      <Select
                        defaultValue="all"
                        label="Date"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.875rem",
                          "& .MuiSelect-select": { fontFamily: "monospace" },
                        }}
                      >
                        <MenuItem
                          value="all"
                          sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                        >
                          All Time
                        </MenuItem>
                        <MenuItem
                          value="week"
                          sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                        >
                          This Week
                        </MenuItem>
                        <MenuItem
                          value="month"
                          sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                        >
                          This Month
                        </MenuItem>
                        <MenuItem
                          value="year"
                          sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                        >
                          This Year
                        </MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel
                        sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                      >
                        Mood
                      </InputLabel>
                      <Select
                        value={filterMood}
                        label="Mood"
                        onChange={(e) => setFilterMood(e.target.value)}
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.875rem",
                          "& .MuiSelect-select": { fontFamily: "monospace" },
                        }}
                      >
                        <MenuItem
                          value="any"
                          sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                        >
                          Any
                        </MenuItem>
                        {renderMoodMenuItemsWithSx(
                          { fontFamily: "monospace", fontSize: "0.875rem" },
                          false
                        )}
                      </Select>
                    </FormControl>
                  </div>

                  {/* Category Filters */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      "All",
                      "Hiking",
                      "Biking",
                      "Writing",
                      "Photography",
                      "Brewing",
                      "Filmstrips",
                      "Videos",
                      "Articles",
                      "Random",
                    ].map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        color={activeTag === tag ? "primary" : "default"}
                        variant={activeTag === tag ? "filled" : "outlined"}
                        size="small"
                        clickable
                        sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                        onClick={() => setActiveTag(tag)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes List - now conditionally rendered based on minimized state */}
            {!minimized ? (
              <div className="w-full mb-8">
                {loadingNotes ? (
                  <div className="text-center text-gray-400 font-mono py-8">
                    Loading notes...
                  </div>
                ) : !session ? (
                  <div className="text-center py-12">
                    <div className="flex justify-center mb-4">
                      <FieldNotesIcon sx={{ fontSize: 48, color: "#9CA3AF" }} />
                    </div>
                    <div className="text-gray-400 font-mono text-lg mb-4">
                      Field Notes
                    </div>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Sign in to view and create your personal field notes
                      collection.
                    </p>
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="text-center text-gray-400 font-mono py-8">
                    No field notes yet.
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 text-left mb-6"
                    >
                      {editId === note.id ? (
                        <div className="flex flex-col h-full w-full">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full font-bold text-gray-900 font-mono mb-3 px-2 py-1 border border-gray-300 rounded"
                          />
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full text-gray-700 font-mono mb-4 px-2 py-1 border border-gray-300 rounded flex-1"
                            rows={4}
                          />
                          <div className="flex gap-4 mb-4">
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <InputLabel>Mood</InputLabel>
                              <Select
                                value={editMood}
                                label="Mood"
                                onChange={(e) => setEditMood(e.target.value)}
                                sx={{
                                  fontFamily: "monospace",
                                  fontSize: "0.875rem",
                                }}
                              >
                                {renderMoodMenuItems()}
                              </Select>
                            </FormControl>
                            <input
                              type="text"
                              value={editTags}
                              onChange={(e) => setEditTags(e.target.value)}
                              placeholder="Tags (comma separated)"
                              className="flex-1 text-gray-700 font-mono px-2 py-1 border border-gray-300 rounded"
                            />
                          </div>

                          {/* Image Management */}
                          <div className="mb-4">
                            <div className="block text-sm font-medium text-gray-700 font-mono mb-2">
                              Images
                            </div>

                            {/* Existing Images */}
                            {editImages.length > 0 && (
                              <div className="mb-3">
                                <div className="flex flex-wrap gap-2">
                                  {editImages.map((image, index) => (
                                    <div
                                      key={`edit-${note.id}-${index}`}
                                      className="relative w-20 h-20 bg-gray-100 rounded border overflow-hidden"
                                    >
                                      <Image
                                        src={image}
                                        alt={`Edit thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        width={80}
                                        height={80}
                                      />
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          const newImages = [...editImages];
                                          newImages.splice(index, 1);
                                          setEditImages(newImages);
                                        }}
                                        sx={{
                                          position: "absolute",
                                          top: 4,
                                          right: 4,
                                          backgroundColor:
                                            "rgba(255, 255, 255, 0.8)",
                                          "&:hover": {
                                            backgroundColor:
                                              "rgba(255, 255, 255, 0.9)",
                                          },
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Add New Image */}
                            {editImages.length < 4 && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outlined"
                                  component="label"
                                  startIcon={<CloudUploadIcon />}
                                  size="small"
                                  sx={{
                                    fontSize: "12px",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  Upload Images
                                  <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          const base64 = event.target
                                            ?.result as string;
                                          setEditImages([
                                            ...editImages,
                                            base64,
                                          ]);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                      e.target.value = "";
                                    }}
                                  />
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 justify-end mb-2">
                            <button
                              className="px-3 py-1 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                              onClick={async () => {
                                try {
                                  console.log(
                                    "Starting inline edit update for note:",
                                    note.id
                                  );
                                  console.log("Edit data:", {
                                    id: note.id,
                                    title: editTitle,
                                    content: editContent,
                                    tags: editTags,
                                    mood: editMood,
                                    images: editImages,
                                    userEmail: session?.user?.email,
                                  });

                                  const res = await fetch("/api/fieldnotes", {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      id: note.id,
                                      title: editTitle,
                                      content: editContent,
                                      tags: editTags,
                                      mood: editMood,
                                      images: editImages,
                                      userEmail: session?.user?.email,
                                      userName: session?.user?.name,
                                    }),
                                  });

                                  console.log(
                                    "Response status:",
                                    res.status,
                                    res.ok
                                  );

                                  if (res.ok) {
                                    const updatedNote = await res.json();
                                    console.log(
                                      "Update successful, updated note:",
                                      updatedNote
                                    );
                                    setNotes(
                                      notes.map((n) =>
                                        n.id === note.id ? updatedNote : n
                                      )
                                    );
                                    setEditId(null);
                                    setEditTitle("");
                                    setEditContent("");
                                    setEditTags("");
                                    setEditMood("");
                                    setEditImages([]);
                                    console.log(
                                      "State cleared, exiting edit mode"
                                    );
                                  } else {
                                    const errorData = await res.json();
                                    console.error("Update error:", errorData);
                                    alert(
                                      `Error updating fieldnote: ${
                                        errorData.error || "Unknown error"
                                      }`
                                    );
                                  }
                                } catch (error) {
                                  console.error("Update error:", error);
                                  alert("Error updating fieldnote");
                                }
                              }}
                            >
                              Update
                            </button>
                            <button
                              className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-mono text-sm hover:bg-gray-300 transition"
                              onClick={() => {
                                setEditId(null);
                                setEditTitle("");
                                setEditContent("");
                                setEditTags("");
                                setEditMood("");
                                setEditImages([]);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Link
                            href={`/fieldnotes/${note.slug}`}
                            className="block rounded-lg p-2 -m-2 mb-2 transition-colors"
                          >
                            <h3 className="font-bold text-gray-900 font-mono mb-3 hover:text-blue-600 transition-colors">
                              {note.title}
                            </h3>
                          </Link>
                          <p className="text-gray-700 font-mono mb-4 line-clamp-3">
                            {note.content}
                          </p>

                          {/* Image thumbnails */}
                          {note.images && note.images.length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-2">
                                {note.images.map((image, index) => (
                                  <div
                                    key={`${note.id}-image-${index}`}
                                    className="w-16 h-16 bg-gray-100 rounded border overflow-hidden flex-shrink-0"
                                  >
                                    <Image
                                      src={image}
                                      alt={`Thumbnail ${index + 1}`}
                                      className="w-full h-full object-cover"
                                      width={64}
                                      height={64}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <hr className="border-gray-300 mb-4" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {note.mood && (
                                <span className="text-xl" title={note.mood}>
                                  {getMoodEmoji(note.mood)}
                                </span>
                              )}
                              <p className="text-sm text-gray-500 font-mono">
                                {new Date(note.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                            </div>
                            {session && (
                              <div className="flex gap-2">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  aria-label="Edit Entry"
                                  onClick={() => {
                                    setEditId(note.id);
                                    setEditTitle(note.title);
                                    setEditContent(note.content);
                                    setEditTags(note.tags || "");
                                    setEditMood(note.mood || "");
                                    setEditImages(note.images || []);
                                  }}
                                >
                                  <EditNoteOutlinedIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  aria-label="Delete Entry"
                                  onClick={async () => {
                                    const res = await fetch("/api/fieldnotes", {
                                      method: "DELETE",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        id: note.id,
                                        slug: note.slug,
                                        userEmail: session?.user?.email,
                                      }),
                                    });
                                    if (res.ok) {
                                      setNotes(
                                        notes.filter((n) => n.id !== note.id)
                                      );
                                    }
                                  }}
                                >
                                  <span
                                    style={{ fontSize: 18, fontWeight: "bold" }}
                                  >
                                    ×
                                  </span>
                                </IconButton>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="w-full mb-8">
                {filteredNotes.length === 0 ? (
                  <div className="text-center text-gray-400 font-mono py-8">
                    No field notes yet.
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <Link
                      key={note.id}
                      href={`/fieldnotes/${note.slug}`}
                      className="bg-white border border-gray-200 rounded-xl p-4 text-left mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between transition-colors"
                    >
                      <span className="font-bold text-gray-900 font-mono text-base hover:text-blue-600 transition-colors">
                        {note.title}
                      </span>
                      <span className="text-sm text-gray-500 font-mono">
                        {new Date(note.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

export default FieldNotes;
