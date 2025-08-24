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
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string>("All");
  const [minimized, setMinimized] = useState(false);
  const [filterMood, setFilterMood] = useState("any");
  const [sortBy, setSortBy] = useState("DESC"); // ASC, DESC, FAVORITE
  const [showFamilyOnly, setShowFamilyOnly] = useState(false);
  const [hasFamilyMembers, setHasFamilyMembers] = useState(false);
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

  useEffect(() => {
    async function fetchNotes() {
      setLoadingNotes(true);
      setDatabaseError(null); // Clear any previous errors

      let url = "/api/fieldnotes";
      if (session?.user?.email) {
        // Logged in user - fetch their notes
        url += `?userEmail=${encodeURIComponent(session.user.email)}`;
      }
      // If not logged in, fetch public notes (no userEmail parameter)

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

          let familyMatch = !showFamilyOnly;
          if (showFamilyOnly) {
            if (selectedFamilyMember === "All") {
              // Show all family notes (notes with shared_family enabled)
              familyMatch = Boolean(note.shared_family);
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

          return tagMatch && moodMatch && familyMatch;
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
                                  onClick={() => handleAppSelect(subItem.path)}
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
        {/* <div className="border-b border-gray-200 mb-6"></div> */}

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
                  {/* Date, Mood, and Sort Filters */}
                  <div className="flex flex-wrap gap-4 items-center justify-between">
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
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.875rem",
                            }}
                          >
                            Any
                          </MenuItem>
                          {renderMoodMenuItemsWithSx(
                            { fontFamily: "monospace", fontSize: "0.875rem" },
                            false
                          )}
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel
                          sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
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
                            "& .MuiSelect-select": { fontFamily: "monospace" },
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

                    {/* Right-aligned family filters */}
                    {session?.user?.email && hasFamilyMembers && (
                      <div className="flex items-center gap-2">
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

                        {/* Family member select dropdown */}
                        {showFamilyOnly && familyMembers.length > 0 && (
                          <FormControl size="small" sx={{ minWidth: 160 }}>
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
                                setSelectedFamilyMember(newFamilyMember);
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
                                  <PeopleIcon sx={{ fontSize: 16, mr: 1 }} />
                                  <span style={{ fontFamily: "monospace" }}>
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
                                    <span style={{ fontFamily: "monospace" }}>
                                      {member.name}
                                    </span>
                                    {member.relationship && (
                                      <span
                                        className="ml-2 text-xs text-gray-500"
                                        style={{ fontFamily: "monospace" }}
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
                    )}
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
                ) : databaseError ? (
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
                ) : !session && filteredNotes.length === 0 ? (
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
                              sx={{ minWidth: "140px", fontSize: "0.875rem" }}
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
                              sx={{ minWidth: "160px", fontSize: "0.875rem" }}
                            />
                          </div>
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
                                    is_public: editMakePublic,
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
                                      is_public: editMakePublic,
                                      shared_family: editShareWithFamily,
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
                                    console.error("Update error:", errorData);
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
                              className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-mono text-sm hover:bg-gray-300 transition"
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
                            <h3 className="font-bold text-gray-900 font-mono mb-1 hover:text-blue-600 transition-colors flex items-center gap-2">
                              {note.is_public && (
                                <PublicIcon
                                  sx={{ fontSize: 16, color: "gray" }}
                                />
                              )}
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
                              <p className="text-sm text-gray-500 font-mono mt-0 mb-0">
                                {note.author && `By ${note.author} on `}
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
                                  Feeling {getMoodEmoji(note.mood)} {note.mood}
                                </p>
                              )}
                            </div>

                            {/* Right side: edit/delete icons */}
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
                                    setEditMakePublic(note.is_public || false);
                                    setEditShareWithFamily(
                                      note.share_with_family ||
                                        note.shared_family ||
                                        false
                                    );
                                  }}
                                >
                                  {/* <EditNoteOutlinedIcon /> */}
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
                                            "Content-Type": "application/json",
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
                                          notes.filter((n) => n.id !== note.id)
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
                                  {/* <DeleteIcon sx={{ fontSize: 16 }} /> */}
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
                    <div
                      key={note.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 text-left mb-4 transition-colors"
                    >
                      <Link
                        href={`/fieldnotes/${note.slug}`}
                        className="block transition-colors"
                      >
                        <span className="font-bold text-gray-900 font-mono text-base hover:text-blue-600 transition-colors flex items-center gap-2">
                          {note.is_public && (
                            <PublicIcon sx={{ fontSize: 16, color: "gray" }} />
                          )}
                          {note.title}
                        </span>
                      </Link>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 font-mono">
                            {note.author && `By ${note.author} on `}
                            <span className="hidden sm:inline">
                              {new Date(note.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                            <span className="sm:hidden">
                              {new Date(note.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              })}
                            </span>
                          </span>
                          {note.mood && (
                            <span className="text-sm text-gray-500 font-mono mt-1">
                              Feeling {getMoodEmoji(note.mood)} {note.mood}
                            </span>
                          )}
                        </div>

                        {session && (
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
                                setEditMakePublic(note.is_public || false);
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
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
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
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

export default FieldNotes;
