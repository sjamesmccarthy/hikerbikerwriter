"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  Public as PublicIcon,
  IntegrationInstructions as DevToolsIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
  People as PeopleIcon,
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
  FormControlLabel,
  Switch,
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
  is_public?: boolean;
  shared_family?: boolean;
  share_with_family?: boolean;
  userEmail?: string;
};

interface AppMenuItem {
  name: string;
  path: string;
  icon?: React.ComponentType<{ sx?: { fontSize: number } }>;
  hasSubmenu?: boolean;
  submenu?: Array<{
    name: string;
    path: string;
    icon?: React.ComponentType<{ sx?: { fontSize: number } }>;
  }>;
}

const FieldNotes: React.FC = () => {
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const apps: AppMenuItem[] = [
    { name: "Home", path: "/", icon: HomeIcon },
    {
      name: "Dev Tools",
      path: "/utilities",
      icon: DevToolsIcon,
      hasSubmenu: true,
      submenu: [
        { name: "Md Editor", path: "/markdown", icon: EditNoteIcon },
        {
          name: "JSON Previewer",
          path: "/utilities/json-previewer",
          icon: CodeIcon,
        },
        {
          name: "Hex/RGB Code",
          path: "/utilities/hex-rgb-converter",
          icon: ColorIcon,
        },
        { name: "Lorem Ipsum", path: "/utilities/lorem-ipsum", icon: TextIcon },
        {
          name: "Network Utilities",
          path: "/utilities/network-tools",
          icon: NetworkIcon,
        },
      ],
    },
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
  const [editMakePublic, setEditMakePublic] = useState(false);
  const [editShareWithFamily, setEditShareWithFamily] = useState(false);
  const { data: session, status } = useSession();
  const [nameFromDB, setNameFromDB] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string>("All");
  const [minimized, setMinimized] = useState(false);
  const [filterMood, setFilterMood] = useState("any");
  const [sortBy, setSortBy] = useState("DESC"); // ASC, DESC, FAVORITE
  const [showFamilyOnly, setShowFamilyOnly] = useState(false);
  const [showPublicNotes, setShowPublicNotes] = useState(false);
  const [hasFamilyMembers, setHasFamilyMembers] = useState(false);
  const autoSwitchApplied = useRef(false);
  const [familyMembers, setFamilyMembers] = useState<
    Array<{ name: string; email: string; relationship: string }>
  >([]);
  const [selectedFamilyMember, setSelectedFamilyMember] =
    useState<string>("All");

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
        console.error("Error fetching user info:", error);
        setNameFromDB(session.user?.name ?? null);
      }
    }

    fetchUserName();
  }, [session?.user?.email, session?.user?.name]);

  useEffect(() => {
    async function fetchNotes() {
      setLoadingNotes(true);
      setDatabaseError(null); // Clear any previous errors

      let url = "/api/fieldnotes";
      if (session?.user?.email) {
        // Logged in user - fetch both their own notes and public notes
        url += `?userEmail=${encodeURIComponent(
          session.user.email
        )}&includePublic=true`;
      }
      // If not logged in, fetch public notes only (no userEmail parameter)

      try {
        const res = await fetch(url);

        if (!res.ok) {
          // Handle HTTP errors (like 500 for database connection issues)
          if (res.status === 500) {
            setDatabaseError(
              "Database connection error - Please check if the database is running"
            );
            setNotes([]);
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        // Ensure data is an array before setting it
        if (Array.isArray(data)) {
          setNotes(data);
          setDatabaseError(null); // Clear error on success
        } else {
          setDatabaseError("Invalid data format received from server");
          setNotes([]);
        }
      } catch (error) {
        console.error("Error fetching fieldnotes:", error);
        setDatabaseError(
          "Failed to connect to server - Please try again later"
        );
        setNotes([]);
      } finally {
        setLoadingNotes(false);
      }
    }

    // Always fetch notes once we know the session status
    if (status !== "loading") {
      fetchNotes();
    }
  }, [session, status]);

  // Auto-enable public filter if user has no field notes
  useEffect(() => {
    if (
      session?.user?.email &&
      notes.length > 0 &&
      !autoSwitchApplied.current
    ) {
      // Check if user has any of their own notes
      const userNotes = notes.filter(
        (note) => note.userEmail === session.user?.email
      );
      if (userNotes.length === 0) {
        setShowPublicNotes(true);
        autoSwitchApplied.current = true;
      }
    }
  }, [notes, session?.user?.email]);

  // Check if user has family members
  useEffect(() => {
    async function checkFamilyMembers() {
      if (session?.user?.email) {
        try {
          // Fetch family data to check if user has family members
          const res = await fetch(
            `/api/familyline?email=${encodeURIComponent(session.user.email)}`
          );
          if (res.ok) {
            const familyData = await res.json();
            // Parse the JSON data - it might be double-encoded
            let parsedJson = familyData?.json;
            if (typeof parsedJson === "string") {
              parsedJson = JSON.parse(parsedJson);
            }
            // Check if family data has people array with members
            const hasPeople =
              parsedJson?.people &&
              Array.isArray(parsedJson.people) &&
              parsedJson.people.length > 0;
            setHasFamilyMembers(hasPeople);

            // If user has family members, fetch the family members list
            if (hasPeople) {
              const membersRes = await fetch(
                `/api/family-members?email=${encodeURIComponent(
                  session.user.email
                )}`
              );
              if (membersRes.ok) {
                const members = await membersRes.json();
                setFamilyMembers(members);
              }
            }
          }
        } catch (error) {
          console.error("Error checking family members:", error);
          setHasFamilyMembers(false);
          setFamilyMembers([]);
        }
      } else {
        setHasFamilyMembers(false);
        setFamilyMembers([]);
      }
    }

    checkFamilyMembers();
  }, [session]);

  // Handle URL parameters for filters
  useEffect(() => {
    if (!searchParams) return;

    const familyParam = searchParams.get("family");
    const familyMemberParam = searchParams.get("familyMember");

    if (familyParam === "true" && hasFamilyMembers) {
      setShowFamilyOnly(true);

      // Set the family member if specified in URL
      if (familyMemberParam && familyMembers.length > 0) {
        const memberExists = familyMembers.some(
          (member) => member.name === familyMemberParam
        );
        if (memberExists) {
          setSelectedFamilyMember(familyMemberParam);
        }
      }
    }
  }, [searchParams, hasFamilyMembers, familyMembers]);

  // Filter and sort notes by activeTag before rendering - ensure notes is an array
  const filteredNotes = Array.isArray(notes)
    ? notes
        .filter((note) => {
          const tagMatch =
            activeTag === "All"
              ? true
              : note.tags
              ? note.tags
                  .toLowerCase()
                  .split(/[ ,]+/)
                  .includes(activeTag.toLowerCase())
              : false;
          const moodMatch =
            filterMood === "any" ? true : note.mood === filterMood;

          // Ownership filtering for logged-in users
          let ownershipMatch = true;
          if (session?.user?.email) {
            if (showPublicNotes) {
              // Show all public notes (including user's own public notes)
              ownershipMatch = Boolean(note.is_public);
            } else if (showFamilyOnly) {
              // When showing family notes, allow family shared notes OR user's own notes
              const isFamilyShared = Boolean(note.shared_family);
              const isUserOwned = note.userEmail === session.user.email;
              ownershipMatch = isFamilyShared || isUserOwned;
            } else {
              // Show user's own notes (default)
              ownershipMatch = note.userEmail === session.user.email;
            }
          } else {
            // For non-logged-in users, show only public notes
            ownershipMatch = Boolean(note.is_public);
          }

          let familyMatch = !showFamilyOnly;
          if (showFamilyOnly) {
            if (selectedFamilyMember === "All") {
              // Show all family notes (notes with shared_family enabled) but exclude logged-in user's notes
              familyMatch =
                Boolean(note.shared_family) &&
                note.userEmail !== session?.user?.email;
            } else {
              // Show notes from the selected family member
              const selectedMemberData = familyMembers.find(
                (member) => member.name === selectedFamilyMember
              );
              if (selectedMemberData) {
                familyMatch =
                  Boolean(note.shared_family) &&
                  note.userEmail === selectedMemberData.email;
              } else {
                familyMatch = false;
              }
            }
          }

          return tagMatch && moodMatch && ownershipMatch && familyMatch;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "ASC":
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            case "DESC":
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            case "FAVORITE":
              // TODO: Add favorites functionality to fieldnotes
              // For now, just sort by date descending
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            default:
              return new Date(b.date).getTime() - new Date(a.date).getTime();
          }
        })
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex-1">
        {/* Header */}
        <div className="flex items-center justify-between h-[61px] border-b border-gray-200 px-3">
          <div className="flex items-center space-x-2">
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
                    onClick={() => {
                      setIsAppsMenuOpen(false);
                      setOpenSubmenu(null);
                    }}
                    aria-label="Close menu"
                    tabIndex={-1}
                  />
                  <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-sm rounded-md shadow-xl border border-white/30 min-w-[200px] overflow-hidden z-50">
                    {apps.map((app) => {
                      const IconComponent = app.icon;
                      const hasSubmenu = app.hasSubmenu && app.submenu;
                      const isSubmenuOpen = openSubmenu === app.name;

                      return (
                        <div key={app.path}>
                          <button
                            onClick={() => {
                              if (hasSubmenu) {
                                setOpenSubmenu(isSubmenuOpen ? null : app.name);
                              } else {
                                handleAppSelect(app.path);
                              }
                            }}
                            className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                          >
                            {IconComponent && (
                              <IconComponent sx={{ fontSize: 20 }} />
                            )}
                            <span className="text-sm font-medium flex-1">
                              {app.name}
                            </span>
                            {hasSubmenu && (
                              <ExpandMoreIcon
                                sx={{
                                  fontSize: 16,
                                  transform: isSubmenuOpen
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                  transition: "transform 0.2s ease",
                                }}
                              />
                            )}
                          </button>

                          {hasSubmenu && isSubmenuOpen && (
                            <div className="bg-gray-50 border-t border-gray-200">
                              {app.submenu?.map((subItem, index) => {
                                const SubIconComponent = subItem.icon;
                                return (
                                  <button
                                    key={`${app.name}-${index}`}
                                    onClick={() =>
                                      handleAppSelect(subItem.path)
                                    }
                                    className="w-full px-8 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 cursor-pointer flex items-center gap-2"
                                  >
                                    {SubIconComponent && (
                                      <SubIconComponent sx={{ fontSize: 16 }} />
                                    )}
                                    {subItem.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="h-4 w-px bg-gray-300" />

            <h3 className="text-lg font-semibold text-gray-800">Field Notes</h3>
          </div>

          {/* Desktop Auth UI */}
          <div className="hidden sm:flex items-center gap-2 pr-4">
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
              );
            })()}
          </div>
        </div>

        {/* Mobile Auth UI */}
        {session && (
          <div className="sm:hidden px-3 py-2 border-b border-gray-200 flex justify-center">
            <div className="flex items-center space-x-2">
              {session.user?.image && (
                <Link href="/user/profile">
                  <Image
                    src={session.user.image}
                    alt={session.user?.name || "User profile"}
                    width={24}
                    height={24}
                    className="rounded-full cursor-pointer hover:shadow-md border border-gray-300"
                  />
                </Link>
              )}
              <span className="text-gray-700 font-mono text-sm">
                {nameFromDB ? `Signed in as ${nameFromDB}` : ""}
              </span>
            </div>
          </div>
        )}

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
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Show loading state globally - not dependent on minimized state */}
            {loadingNotes ? (
              <div className="flex-1 flex flex-col px-0 py-0">
                {/* Loading skeleton for filter section */}
                <div className="w-full flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Loading skeleton for filter bar */}
                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                      <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex gap-2">
                        <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-28 h-10 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    {/* Category filters skeleton */}
                    <div className="hidden sm:flex flex-wrap gap-2">
                      {Array.from({ length: 10 }, (_, index) => (
                        <div
                          key={`category-skeleton-${index + 1}`}
                          className="h-8 bg-gray-200 rounded-full animate-pulse"
                          style={{ width: `${60 + (index % 4) * 20}px` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Loading skeleton for field notes */}
                <div className="w-full mb-8">
                  {Array.from({ length: 6 }, (_, index) => (
                    <div
                      key={`fieldnote-skeleton-${index + 1}`}
                      className="bg-white border border-gray-200 rounded-xl p-6 text-left mb-6"
                    >
                      {/* Skeleton title */}
                      <div className="space-y-2 mb-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      </div>

                      {/* Skeleton content */}
                      <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      </div>

                      {/* Skeleton image thumbnails (sometimes visible) */}
                      {index % 3 === 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {Array.from(
                              { length: 2 + (index % 3) },
                              (_, imgIndex) => (
                                <div
                                  key={`image-skeleton-${index}-${
                                    imgIndex + 1
                                  }`}
                                  className="w-16 h-16 bg-gray-200 rounded animate-pulse"
                                ></div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Skeleton separator */}
                      <div className="w-full h-px bg-gray-200 mb-4"></div>

                      {/* Skeleton footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col space-y-2">
                          {/* Author and date skeleton */}
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                          </div>
                          {/* Mood skeleton (sometimes visible) */}
                          {index % 2 === 0 && (
                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                          )}
                        </div>
                        {/* Action buttons skeleton */}
                        <div className="hidden sm:flex gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Filter Icon Row - filter icon always visible, add button only if logged in */}
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
                      {/* Date, Mood, and Sort Filters */}
                      <div className="flex flex-col gap-3">
                        {/* Mobile layout with responsive rows */}
                        <div className="flex flex-col gap-3">
                          {/* First row: Date, Mood, Sort By on left, Public/Family filters on right (desktop only) */}
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-4">
                            {/* Left side: Date, Mood, Sort By filters */}
                            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                              <FormControl
                                size="small"
                                className="flex-1 md:flex-none"
                                sx={{ minWidth: { xs: 0, md: 120 } }}
                              >
                                <InputLabel
                                  sx={{
                                    fontFamily: "monospace",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  Date
                                </InputLabel>
                                <Select
                                  defaultValue="all"
                                  label="Date"
                                  sx={{
                                    fontFamily: "monospace",
                                    fontSize: "0.875rem",
                                    "& .MuiSelect-select": {
                                      fontFamily: "monospace",
                                    },
                                  }}
                                >
                                  <MenuItem
                                    value="all"
                                    sx={{
                                      fontFamily: "monospace",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    All Time
                                  </MenuItem>
                                  <MenuItem
                                    value="week"
                                    sx={{
                                      fontFamily: "monospace",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    This Week
                                  </MenuItem>
                                  <MenuItem
                                    value="month"
                                    sx={{
                                      fontFamily: "monospace",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    This Month
                                  </MenuItem>
                                  <MenuItem
                                    value="year"
                                    sx={{
                                      fontFamily: "monospace",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    This Year
                                  </MenuItem>
                                </Select>
                              </FormControl>

                              <FormControl
                                size="small"
                                className="flex-1 md:flex-none"
                                sx={{ minWidth: { xs: 0, md: 120 } }}
                              >
                                <InputLabel
                                  sx={{
                                    fontFamily: "monospace",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  Mood
                                </InputLabel>
                                <Select
                                  value={filterMood}
                                  label="Mood"
                                  onChange={(e) =>
                                    setFilterMood(e.target.value)
                                  }
                                  sx={{
                                    fontFamily: "monospace",
                                    fontSize: "0.875rem",
                                    "& .MuiSelect-select": {
                                      fontFamily: "monospace",
                                    },
                                  }}
                                >
                                  <MenuItem
                                    value="any"
                                    sx={{
                                      fontFamily: "monospace",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    Any
                                  </MenuItem>
                                  {renderMoodMenuItemsWithSx(
                                    {
                                      fontFamily: "monospace",
                                      fontSize: "0.875rem",
                                    },
                                    false
                                  )}
                                </Select>
                              </FormControl>

                              <FormControl
                                size="small"
                                className="flex-1 md:flex-none"
                                sx={{ minWidth: { xs: 0, md: 120 } }}
                              >
                                <InputLabel
                                  sx={{
                                    fontFamily: "monospace",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  Sort By
                                </InputLabel>
                                <Select
                                  value={sortBy}
                                  label="Sort By"
                                  onChange={(e) => setSortBy(e.target.value)}
                                  sx={{
                                    fontFamily: "monospace",
                                    fontSize: "0.875rem",
                                    "& .MuiSelect-select": {
                                      fontFamily: "monospace",
                                    },
                                  }}
                                >
                                  <MenuItem
                                    value="DESC"
                                    sx={{
                                      fontFamily: "monospace",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    Newest First
                                  </MenuItem>
                                  <MenuItem
                                    value="ASC"
                                    sx={{
                                      fontFamily: "monospace",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    Oldest First
                                  </MenuItem>
                                  <MenuItem
                                    value="FAVORITE"
                                    sx={{
                                      fontFamily: "monospace",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    Favorites First
                                  </MenuItem>
                                </Select>
                              </FormControl>
                            </div>

                            {/* Right side: Public and Family filters (desktop only) */}
                            <div className="hidden md:flex md:items-center gap-2">
                              {/* Public filter */}
                              {session?.user?.email && (
                                <button
                                  onClick={() =>
                                    setShowPublicNotes(!showPublicNotes)
                                  }
                                  className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                                    showPublicNotes
                                      ? "bg-green-100 text-green-700 border border-green-300"
                                      : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                                  }`}
                                  style={{ fontFamily: "monospace" }}
                                >
                                  <PublicIcon sx={{ fontSize: 16 }} />
                                  Public
                                </button>
                              )}

                              {/* Family filters */}
                              {session?.user?.email && hasFamilyMembers && (
                                <button
                                  onClick={() => {
                                    const newFamily = !showFamilyOnly;
                                    setShowFamilyOnly(newFamily);
                                    if (!newFamily) {
                                      // Reset family member selection when turning off family filter
                                      setSelectedFamilyMember("All");
                                    }
                                  }}
                                  className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                                    showFamilyOnly
                                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                                      : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                                  }`}
                                  style={{ fontFamily: "monospace" }}
                                >
                                  <PeopleIcon sx={{ fontSize: 16 }} />
                                  Family Only
                                </button>
                              )}

                              {/* Family member select dropdown */}
                              {session?.user?.email &&
                                hasFamilyMembers &&
                                showFamilyOnly &&
                                familyMembers.length > 0 && (
                                  <FormControl
                                    size="small"
                                    sx={{ minWidth: 160 }}
                                  >
                                    <InputLabel
                                      sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.875rem",
                                      }}
                                    >
                                      Family Member
                                    </InputLabel>
                                    <Select
                                      value={selectedFamilyMember}
                                      label="Family Member"
                                      onChange={(e) => {
                                        const newFamilyMember = e.target.value;
                                        setSelectedFamilyMember(
                                          newFamilyMember
                                        );
                                      }}
                                      sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.875rem",
                                        "& .MuiSelect-select": {
                                          fontFamily: "monospace",
                                        },
                                      }}
                                    >
                                      <MenuItem value="All">
                                        <div className="flex items-center">
                                          <PeopleIcon
                                            sx={{ fontSize: 16, mr: 1 }}
                                          />
                                          <span
                                            style={{ fontFamily: "monospace" }}
                                          >
                                            All Family
                                          </span>
                                        </div>
                                      </MenuItem>
                                      {familyMembers.map((member) => (
                                        <MenuItem
                                          key={member.email}
                                          value={member.name}
                                        >
                                          <div className="flex items-center">
                                            <span
                                              style={{
                                                fontFamily: "monospace",
                                              }}
                                            >
                                              {member.name}
                                            </span>
                                            {member.relationship && (
                                              <span
                                                className="ml-2 text-xs text-gray-500"
                                                style={{
                                                  fontFamily: "monospace",
                                                }}
                                              >
                                                ({member.relationship})
                                              </span>
                                            )}
                                          </div>
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                )}
                            </div>
                          </div>

                          {/* Second row: Public and Family filters (mobile only) */}
                          <div className="flex flex-col md:hidden gap-2">
                            {/* Public filter */}
                            {session?.user?.email && (
                              <button
                                onClick={() =>
                                  setShowPublicNotes(!showPublicNotes)
                                }
                                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                                  showPublicNotes
                                    ? "bg-green-100 text-green-700 border border-green-300"
                                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                                }`}
                                style={{ fontFamily: "monospace" }}
                              >
                                <PublicIcon sx={{ fontSize: 16 }} />
                                Public
                              </button>
                            )}

                            {/* Family filters */}
                            {session?.user?.email && hasFamilyMembers && (
                              <>
                                {/* Family Only button - full width when no family members or not active */}
                                {(!showFamilyOnly ||
                                  familyMembers.length === 0) && (
                                  <button
                                    onClick={() => {
                                      const newFamily = !showFamilyOnly;
                                      setShowFamilyOnly(newFamily);
                                      if (!newFamily) {
                                        // Reset family member selection when turning off family filter
                                        setSelectedFamilyMember("All");
                                      }
                                    }}
                                    className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                                      showFamilyOnly
                                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                                        : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                                    }`}
                                    style={{ fontFamily: "monospace" }}
                                  >
                                    <PeopleIcon sx={{ fontSize: 16 }} />
                                    Family Only
                                  </button>
                                )}

                                {/* Family Only button and select on same row when active and has members */}
                                {showFamilyOnly && familyMembers.length > 0 && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        const newFamily = !showFamilyOnly;
                                        setShowFamilyOnly(newFamily);
                                        if (!newFamily) {
                                          // Reset family member selection when turning off family filter
                                          setSelectedFamilyMember("All");
                                        }
                                      }}
                                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                                        showFamilyOnly
                                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                                          : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                                      }`}
                                      style={{ fontFamily: "monospace" }}
                                    >
                                      <PeopleIcon sx={{ fontSize: 16 }} />
                                      Family Only
                                    </button>

                                    <FormControl
                                      size="small"
                                      className="flex-1"
                                      sx={{ minWidth: 0 }}
                                    >
                                      <InputLabel
                                        sx={{
                                          fontFamily: "monospace",
                                          fontSize: "0.875rem",
                                        }}
                                      >
                                        Family Member
                                      </InputLabel>
                                      <Select
                                        value={selectedFamilyMember}
                                        label="Family Member"
                                        onChange={(e) => {
                                          const newFamilyMember =
                                            e.target.value;
                                          setSelectedFamilyMember(
                                            newFamilyMember
                                          );
                                        }}
                                        sx={{
                                          fontFamily: "monospace",
                                          fontSize: "0.875rem",
                                          "& .MuiSelect-select": {
                                            fontFamily: "monospace",
                                          },
                                        }}
                                      >
                                        <MenuItem value="All">
                                          <div className="flex items-center">
                                            <PeopleIcon
                                              sx={{ fontSize: 16, mr: 1 }}
                                            />
                                            <span
                                              style={{
                                                fontFamily: "monospace",
                                              }}
                                            >
                                              All Family
                                            </span>
                                          </div>
                                        </MenuItem>
                                        {familyMembers.map((member) => (
                                          <MenuItem
                                            key={member.email}
                                            value={member.name}
                                          >
                                            <div className="flex items-center">
                                              <span
                                                style={{
                                                  fontFamily: "monospace",
                                                }}
                                              >
                                                {member.name}
                                              </span>
                                              {member.relationship && (
                                                <span
                                                  className="ml-2 text-xs text-gray-500"
                                                  style={{
                                                    fontFamily: "monospace",
                                                  }}
                                                >
                                                  ({member.relationship})
                                                </span>
                                              )}
                                            </div>
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Category Filters - Hidden on mobile */}
                      <div className="hidden sm:flex flex-wrap gap-2">
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
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.875rem",
                            }}
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
                    {/* Intro text showing current view context */}
                    {session?.user?.email && showFamilyOnly && (
                      <div className="mx-4 mb-4 text-center">
                        <p
                          className="text-sm text-gray-600"
                          style={{ fontFamily: "monospace" }}
                        >
                          {selectedFamilyMember === "All"
                            ? "Showing all family field notes"
                            : `Showing field notes from ${selectedFamilyMember}`}
                        </p>
                      </div>
                    )}

                    {databaseError ? (
                      <div className="mx-4 mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-red-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                              Database Connection Error
                            </h3>
                            <div className="mt-1 text-sm text-red-700">
                              {databaseError}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : !loadingNotes &&
                      !session &&
                      filteredNotes.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="flex justify-center mb-4">
                          <FieldNotesIcon
                            sx={{ fontSize: 48, color: "#9CA3AF" }}
                          />
                        </div>
                        <div className="text-gray-400 font-mono text-lg mb-4">
                          Field Notes
                        </div>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Sign in to view and create your personal field notes
                          collection.
                        </p>
                      </div>
                    ) : !loadingNotes && filteredNotes.length === 0 ? (
                      <div className="text-center text-gray-400 font-mono py-8">
                        {session
                          ? "No field notes yet."
                          : "No public field notes available."}
                      </div>
                    ) : (
                      filteredNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-white border border-gray-200 rounded-xl p-6 text-left mb-6"
                        >
                          {editId === note.id ? (
                            <div className="flex flex-col h-full w-full">
                              {/* Title */}
                              <div className="mb-3">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full font-bold text-gray-900 font-mono px-2 py-1 border border-gray-300 rounded"
                                />
                              </div>

                              {/* Visibility Controls */}
                              <div className="flex flex-wrap gap-1 sm:gap-4 mb-3">
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={editMakePublic}
                                      onChange={(e) =>
                                        setEditMakePublic(e.target.checked)
                                      }
                                      color="primary"
                                      size="small"
                                    />
                                  }
                                  label="Make Public"
                                  sx={{
                                    minWidth: "140px",
                                    fontSize: "0.875rem",
                                  }}
                                />
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={editShareWithFamily}
                                      onChange={(e) =>
                                        setEditShareWithFamily(e.target.checked)
                                      }
                                      color="primary"
                                      size="small"
                                    />
                                  }
                                  label="Share with Family"
                                  sx={{
                                    minWidth: "160px",
                                    fontSize: "0.875rem",
                                  }}
                                />
                              </div>
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full text-gray-700 font-mono mb-4 px-2 py-1 border border-gray-300 rounded flex-1"
                                rows={4}
                              />
                              <div className="flex gap-4 mb-4">
                                <FormControl
                                  size="small"
                                  sx={{ minWidth: 120 }}
                                >
                                  <InputLabel>Mood</InputLabel>
                                  <Select
                                    value={editMood}
                                    label="Mood"
                                    onChange={(e) =>
                                      setEditMood(e.target.value)
                                    }
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

                              <div className="flex gap-2 justify-center sm:justify-end mb-2">
                                <button
                                  className="w-1/2 sm:w-auto px-3 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
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
                                        is_public: editMakePublic,
                                        userEmail: session?.user?.email,
                                      });

                                      const res = await fetch(
                                        "/api/fieldnotes",
                                        {
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
                                            is_public: editMakePublic,
                                            shared_family: editShareWithFamily,
                                            userEmail: session?.user?.email,
                                            userName: session?.user?.name,
                                          }),
                                        }
                                      );

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
                                        setEditMakePublic(false);
                                        console.log(
                                          "State cleared, exiting edit mode"
                                        );
                                      } else {
                                        const errorData = await res
                                          .json()
                                          .catch(() => ({
                                            error: "Connection error",
                                          }));
                                        console.error(
                                          "Update error:",
                                          errorData
                                        );
                                        if (res.status === 500) {
                                          setDatabaseError(
                                            "Database connection error during update - Please check if the database is running"
                                          );
                                        } else {
                                          alert(
                                            `Error updating fieldnote: ${
                                              errorData.error || "Unknown error"
                                            }`
                                          );
                                        }
                                      }
                                    } catch (error) {
                                      console.error("Update error:", error);
                                      setDatabaseError(
                                        "Failed to connect to server during update"
                                      );
                                    }
                                  }}
                                >
                                  Update
                                </button>
                                <button
                                  className="w-1/2 sm:w-auto px-3 py-2 rounded bg-gray-200 text-gray-800 font-mono text-sm hover:bg-gray-300 transition"
                                  onClick={() => {
                                    setEditId(null);
                                    setEditTitle("");
                                    setEditContent("");
                                    setEditTags("");
                                    setEditMood("");
                                    setEditImages([]);
                                    setEditMakePublic(false);
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
                                className="block rounded-lg transition-colors"
                              >
                                <h3 className="font-bold text-gray-900 font-mono mb-1 hover:text-blue-600 transition-colors">
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
                                {/* Left side: author + date, then mood */}
                                <div className="flex flex-col">
                                  <p className="text-sm text-gray-500 font-mono mt-0 mb-0 flex items-center gap-1">
                                    {note.is_public && (
                                      <PublicIcon
                                        sx={{ fontSize: 16, color: "gray" }}
                                      />
                                    )}
                                    {note.shared_family && (
                                      <PeopleIcon
                                        sx={{
                                          fontSize: 16,
                                          color:
                                            showFamilyOnly &&
                                            note.shared_family &&
                                            note.userEmail !==
                                              session?.user?.email
                                              ? "#3b82f6"
                                              : "gray",
                                        }}
                                      />
                                    )}
                                    <span
                                      className={
                                        showFamilyOnly &&
                                        note.shared_family &&
                                        note.userEmail !== session?.user?.email
                                          ? "text-blue-600 hidden sm:inline"
                                          : "text-gray-500 hidden sm:inline"
                                      }
                                    >
                                      {/* Use "Shared by" for family shared notes, otherwise "By" */}
                                      {showFamilyOnly &&
                                      note.shared_family &&
                                      note.userEmail !== session?.user?.email
                                        ? "Shared by"
                                        : "By"}
                                    </span>{" "}
                                    <span
                                      className={
                                        showFamilyOnly &&
                                        note.shared_family &&
                                        note.userEmail !== session?.user?.email
                                          ? "text-blue-600"
                                          : "text-gray-500"
                                      }
                                    >
                                      {
                                        // For shared_family notes from other family members, use the family member's name
                                        showFamilyOnly &&
                                        note.shared_family &&
                                        note.userEmail !== session?.user?.email
                                          ? familyMembers.find(
                                              (member) =>
                                                member.email === note.userEmail
                                            )?.name || "Family Member"
                                          : note.author
                                      }
                                    </span>{" "}
                                    on
                                    <span className="hidden sm:inline">
                                      {new Date(note.date).toLocaleDateString(
                                        "en-US",
                                        {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        }
                                      )}
                                    </span>
                                    <span className="sm:hidden">
                                      {new Date(note.date).toLocaleDateString(
                                        "en-US",
                                        {
                                          year: "numeric",
                                          month: "2-digit",
                                          day: "2-digit",
                                        }
                                      )}
                                    </span>
                                  </p>
                                  {note.mood && (
                                    <p className="text-sm text-gray-500 font-mono mt-1 mb-0">
                                      Feeling {getMoodEmoji(note.mood)}{" "}
                                      {note.mood}
                                    </p>
                                  )}

                                  {/* Mobile edit/delete icons - under mood section */}
                                  {session &&
                                    note.userEmail === session.user?.email && (
                                      <div className="flex gap-2 mt-2 sm:hidden">
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
                                            setEditMakePublic(
                                              note.is_public || false
                                            );
                                            setEditShareWithFamily(
                                              note.share_with_family ||
                                                note.shared_family ||
                                                false
                                            );
                                          }}
                                        >
                                          <EditNoteOutlinedIcon />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          aria-label="Delete Entry"
                                          sx={{ color: "gray" }}
                                          onClick={async () => {
                                            try {
                                              const res = await fetch(
                                                "/api/fieldnotes",
                                                {
                                                  method: "DELETE",
                                                  headers: {
                                                    "Content-Type":
                                                      "application/json",
                                                  },
                                                  body: JSON.stringify({
                                                    id: note.id,
                                                    slug: note.slug,
                                                    userEmail:
                                                      session?.user?.email,
                                                  }),
                                                }
                                              );
                                              if (res.ok) {
                                                setNotes(
                                                  notes.filter(
                                                    (n) => n.id !== note.id
                                                  )
                                                );
                                              } else if (res.status === 500) {
                                                setDatabaseError(
                                                  "Database connection error during delete - Please check if the database is running"
                                                );
                                              } else {
                                                const errorData = await res
                                                  .json()
                                                  .catch(() => ({
                                                    error: "Delete failed",
                                                  }));
                                                alert(
                                                  `Error deleting fieldnote: ${
                                                    errorData.error ||
                                                    "Unknown error"
                                                  }`
                                                );
                                              }
                                            } catch (error) {
                                              console.error(
                                                "Delete error:",
                                                error
                                              );
                                              setDatabaseError(
                                                "Failed to connect to server during delete"
                                              );
                                            }
                                          }}
                                        >
                                          <DeleteIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      </div>
                                    )}
                                </div>

                                {/* Desktop edit/delete icons - right side */}
                                {session &&
                                  note.userEmail === session.user?.email && (
                                    <div className="hidden sm:flex gap-2">
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
                                          setEditMakePublic(
                                            note.is_public || false
                                          );
                                          setEditShareWithFamily(
                                            note.share_with_family ||
                                              note.shared_family ||
                                              false
                                          );
                                        }}
                                      >
                                        <EditNoteOutlinedIcon />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        aria-label="Delete Entry"
                                        sx={{ color: "gray" }}
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(
                                              "/api/fieldnotes",
                                              {
                                                method: "DELETE",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  id: note.id,
                                                  slug: note.slug,
                                                  userEmail:
                                                    session?.user?.email,
                                                }),
                                              }
                                            );
                                            if (res.ok) {
                                              setNotes(
                                                notes.filter(
                                                  (n) => n.id !== note.id
                                                )
                                              );
                                            } else if (res.status === 500) {
                                              setDatabaseError(
                                                "Database connection error during delete - Please check if the database is running"
                                              );
                                            } else {
                                              const errorData = await res
                                                .json()
                                                .catch(() => ({
                                                  error: "Delete failed",
                                                }));
                                              alert(
                                                `Error deleting fieldnote: ${
                                                  errorData.error ||
                                                  "Unknown error"
                                                }`
                                              );
                                            }
                                          } catch (error) {
                                            console.error(
                                              "Delete error:",
                                              error
                                            );
                                            setDatabaseError(
                                              "Failed to connect to server during delete"
                                            );
                                          }
                                        }}
                                      >
                                        <DeleteIcon sx={{ fontSize: 16 }} />
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
                    {!loadingNotes && filteredNotes.length === 0 ? (
                      <div className="text-center text-gray-400 font-mono py-8">
                        No field notes yet.
                      </div>
                    ) : (
                      filteredNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-white border border-gray-200 rounded-xl p-4 text-left mb-4 transition-colors"
                        >
                          <Link
                            href={`/fieldnotes/${note.slug}`}
                            className="block transition-colors"
                          >
                            <span className="font-bold text-gray-900 font-mono text-base hover:text-blue-600 transition-colors">
                              {note.title}
                            </span>
                          </Link>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 font-mono flex items-center gap-1">
                                {note.is_public && (
                                  <PublicIcon
                                    sx={{ fontSize: 16, color: "gray" }}
                                  />
                                )}
                                {note.shared_family && (
                                  <PeopleIcon
                                    sx={{
                                      fontSize: 16,
                                      color:
                                        showFamilyOnly &&
                                        note.shared_family &&
                                        note.userEmail !== session?.user?.email
                                          ? "#3b82f6"
                                          : "gray",
                                    }}
                                  />
                                )}
                                <span
                                  className={
                                    showFamilyOnly &&
                                    note.shared_family &&
                                    note.userEmail !== session?.user?.email
                                      ? "text-blue-600 hidden sm:inline"
                                      : "text-gray-500 hidden sm:inline"
                                  }
                                >
                                  {/* Use "Shared by" for family shared notes, otherwise "By" */}
                                  {showFamilyOnly &&
                                  note.shared_family &&
                                  note.userEmail !== session?.user?.email
                                    ? "Shared by"
                                    : "By"}
                                </span>{" "}
                                <span
                                  className={
                                    showFamilyOnly &&
                                    note.shared_family &&
                                    note.userEmail !== session?.user?.email
                                      ? "text-blue-600"
                                      : "text-gray-500"
                                  }
                                >
                                  {
                                    // For shared_family notes from other family members, use the family member's name
                                    showFamilyOnly &&
                                    note.shared_family &&
                                    note.userEmail !== session?.user?.email
                                      ? familyMembers.find(
                                          (member) =>
                                            member.email === note.userEmail
                                        )?.name || "Family Member"
                                      : note.author
                                  }
                                </span>{" "}
                                on
                                <span className="hidden sm:inline">
                                  {new Date(note.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )}
                                </span>
                                <span className="sm:hidden">
                                  {new Date(note.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    }
                                  )}
                                </span>
                              </span>
                              {note.mood && (
                                <span className="text-sm text-gray-500 font-mono mt-1">
                                  Feeling {getMoodEmoji(note.mood)} {note.mood}
                                </span>
                              )}
                            </div>

                            {session &&
                              note.userEmail === session.user?.email && (
                                <div className="hidden sm:flex gap-2">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    aria-label="Edit Entry"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditId(note.id);
                                      setEditTitle(note.title);
                                      setEditContent(note.content);
                                      setEditTags(note.tags || "");
                                      setEditMood(note.mood || "");
                                      setEditImages(note.images || []);
                                      setEditMakePublic(
                                        note.is_public || false
                                      );
                                      setEditShareWithFamily(
                                        note.share_with_family ||
                                          note.shared_family ||
                                          false
                                      );
                                      // Switch to expanded view to show the edit form
                                      setMinimized(false);
                                    }}
                                  >
                                    <EditNoteOutlinedIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    aria-label="Delete Entry"
                                    sx={{ color: "gray" }}
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      try {
                                        const res = await fetch(
                                          "/api/fieldnotes",
                                          {
                                            method: "DELETE",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                            },
                                            body: JSON.stringify({
                                              id: note.id,
                                              slug: note.slug,
                                              userEmail: session?.user?.email,
                                            }),
                                          }
                                        );
                                        if (res.ok) {
                                          setNotes(
                                            notes.filter(
                                              (n) => n.id !== note.id
                                            )
                                          );
                                        } else if (res.status === 500) {
                                          setDatabaseError(
                                            "Database connection error during delete - Please check if the database is running"
                                          );
                                        } else {
                                          const errorData = await res
                                            .json()
                                            .catch(() => ({
                                              error: "Delete failed",
                                            }));
                                          alert(
                                            `Error deleting fieldnote: ${
                                              errorData.error || "Unknown error"
                                            }`
                                          );
                                        }
                                      } catch (error) {
                                        console.error("Delete error:", error);
                                        setDatabaseError(
                                          "Failed to connect to server during delete"
                                        );
                                      }
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </div>
                              )}

                            {/* Remove mobile edit button in minimized view - users can click title to navigate */}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

// Helper function to generate URLs with family filter parameters
// Examples:
// generateFieldNotesFilterURL({ family: true }) => "/fieldnotes?family=true"
// generateFieldNotesFilterURL({ family: true, familyMember: "John Doe" }) => "/fieldnotes?family=true&familyMember=John%20Doe"
export const generateFieldNotesFilterURL = (options: {
  family?: boolean;
  familyMember?: string;
  basePath?: string;
}) => {
  const params = new URLSearchParams();
  if (options.family) {
    params.set("family", "true");
    if (options.familyMember && options.familyMember !== "All") {
      params.set("familyMember", options.familyMember);
    }
  }

  const basePath = options.basePath || "/fieldnotes";
  return params.toString() ? `${basePath}?${params.toString()}` : basePath;
};

export default FieldNotes;
