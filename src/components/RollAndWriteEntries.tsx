"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  ArrowBack as ArrowBackIcon,
  Apps as AppsIcon,
  Casino as CasinoIcon,
  Delete as DeleteIcon,
  Public as PublicIcon,
  Home as HomeIcon,
  EditNote as EditNoteIcon,
  Assignment as LogIcon,
  StickyNote2 as FieldNotesIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  IntegrationInstructions as DevToolsIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
} from "@mui/icons-material";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";

interface RollAndWriteEntry {
  id: string;
  content: string;
  dice1: number;
  dice2: number;
  createdAt: string;
  is_public?: boolean;
  by?: string;
  favorite: number;
}

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

const RollAndWriteEntries: React.FC = () => {
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [entries, setEntries] = useState<RollAndWriteEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, favorited
  const { data: session, status } = useSession();
  const router = useRouter();

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
    { name: "Field Notes", path: "/fieldnotes", icon: FieldNotesIcon },
    { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
    { name: "jM Galleries", path: "/jmgalleries", icon: PhotoCameraIcon },
  ];

  // Handle app selection from menu
  const handleAppSelect = (path: string) => {
    router.push(path);
    setIsAppsMenuOpen(false);
    setOpenSubmenu(null);
  };

  // Fetch entries from API
  useEffect(() => {
    async function fetchEntries() {
      try {
        setLoadingEntries(true);
        const params = new URLSearchParams();
        if (session?.user?.email) {
          params.set("userEmail", session.user.email);
        }
        const queryString = params.toString();
        let url = "/api/rollnwrite";
        if (queryString) {
          url += `?${queryString}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        } else {
          console.error("Failed to fetch entries:", res.status);
        }
      } catch (error) {
        console.error("Error fetching entries:", error);
      } finally {
        setLoadingEntries(false);
      }
    }

    if (status !== "loading") {
      fetchEntries();
    }
  }, [session, status]);

  // Load user favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`rollnwrite_favorites`);
      if (saved) {
        setUserFavorites(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error("Error loading favorites from localStorage:", error);
    }
  }, []);

  // Delete entry
  const deleteEntry = async (id: string) => {
    if (confirm("Delete this entry?")) {
      if (!session) {
        return;
      }

      try {
        const response = await fetch(`/api/rollnwrite?id=${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          setEntries((prev) => prev.filter((entry) => entry.id !== id));
        } else {
          alert("Failed to delete entry");
        }
      } catch (error) {
        console.error("Error deleting entry:", error);
        alert("Failed to delete entry");
      }
    }
  };

  // Toggle favorite
  const toggleFavorite = async (id: string, currentFavorites: number) => {
    try {
      // Check if user has already favorited this entry
      const userHasFavorited = userFavorites.has(id);
      const newFavoriteCount = userHasFavorited
        ? currentFavorites - 1
        : currentFavorites + 1;

      const response = await fetch(`/api/rollnwrite?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          favorite: newFavoriteCount,
        }),
      });

      if (response.ok) {
        // Update the entry in the local state
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === id ? { ...entry, favorite: newFavoriteCount } : entry
          )
        );

        // Update user favorites tracking
        const newUserFavorites = new Set(userFavorites);
        if (userHasFavorited) {
          newUserFavorites.delete(id);
        } else {
          newUserFavorites.add(id);
        }
        setUserFavorites(newUserFavorites);

        // Store in localStorage to persist across sessions
        localStorage.setItem(
          `rollnwrite_favorites`,
          JSON.stringify(Array.from(newUserFavorites))
        );
      } else {
        alert("Failed to update favorite");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorite");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex flex-1">
        <div className="flex flex-col w-full">
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

            <h3 className="text-lg font-semibold text-gray-800">
              Roll And Write
            </h3>
          </div>

          {/* Auth UI */}
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
                      Sign In With Google
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
            {/* Intro */}
            <div className="w-full px-6 mb-12 mt-0">
              <p className="text-gray-600 leading-relaxed font-mono text-center">
                <span className="text-2xl font-bold">roll & write stories</span>{" "}
                <br />
                creative writing prompts based on dice rolls
              </p>
            </div>

            {/* Filter and Create New Entry Button - Only show when there are entries */}
            {!loadingEntries && entries.length > 0 && (
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="w-full flex items-center justify-between">
                  {/* Filter dropdown on the left */}
                  <div className="flex items-center">
                    <FormControl size="small" sx={{ minWidth: 140 }}>
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
                          value="newest"
                          sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                        >
                          Newest
                        </MenuItem>
                        <MenuItem
                          value="oldest"
                          sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                        >
                          Oldest
                        </MenuItem>
                        <MenuItem
                          value="favorited"
                          sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                        >
                          Most Favorited
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </div>

                  {/* Roll Them Dice button on the right */}
                  <div>
                    <Link
                      href="/rollandwrite/roll?autoroll=true"
                      className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                    >
                      Roll Them Dice
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Entries List */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {loadingEntries ? (
                <div className="text-center text-gray-500 font-mono py-8">
                  Loading stories...
                </div>
              ) : entries.length === 0 ? (
                (() => {
                  let noEntriesContent;
                  if (!session) {
                    noEntriesContent = (
                      <div className="text-center py-12">
                        <div className="mb-6">
                          <CasinoIcon sx={{ fontSize: 64, color: "#9ca3af" }} />
                        </div>
                        <div className="text-gray-400 font-mono text-lg mb-2">
                          Sorry, there are no public stories right now.
                        </div>
                        <div className="text-gray-400 font-mono text-lg mb-6">
                          Sign in to create and view your own stories.
                        </div>
                        <Link
                          href="/rollandwrite/roll?autoroll=true"
                          className="inline-block px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                        >
                          Roll Them Dice
                        </Link>
                      </div>
                    );
                  } else {
                    noEntriesContent = (
                      <div className="text-center py-12">
                        <div className="mb-6">
                          <CasinoIcon sx={{ fontSize: 64, color: "#9ca3af" }} />
                        </div>
                        <div className="text-gray-400 font-mono text-lg mb-6">
                          No stories yet. Create your first one!
                        </div>
                        <Link
                          href="/rollandwrite/roll?autoroll=true"
                          className="inline-block px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                        >
                          Roll Them Dice
                        </Link>
                      </div>
                    );
                  }
                  return noEntriesContent;
                })()
              ) : (
                (() => {
                  // Sort entries based on selected sort option
                  const sortedEntries = [...entries].sort((a, b) => {
                    switch (sortBy) {
                      case "oldest":
                        return (
                          new Date(a.createdAt).getTime() -
                          new Date(b.createdAt).getTime()
                        );
                      case "favorited":
                        return b.favorite - a.favorite;
                      case "newest":
                      default:
                        return (
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                        );
                    }
                  });

                  return sortedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white border border-gray-200 rounded-xl p-3 text-left mb-4 relative"
                    >
                      {/* Favorite heart icon in upper-right corner */}
                      <button
                        onClick={() => toggleFavorite(entry.id, entry.favorite)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors touch-manipulation flex items-center gap-1 cursor-pointer"
                        title="Add to favorites"
                        style={{ minWidth: "40px", minHeight: "32px" }}
                      >
                        <FavoriteIcon
                          sx={{
                            fontSize: 16,
                            color: entry.favorite > 0 ? "red" : "gray",
                          }}
                        />
                        {entry.favorite > 0 && (
                          <span className="text-xs font-mono text-gray-500">
                            {entry.favorite}
                          </span>
                        )}
                      </button>

                      {/* Header with dice only */}
                      <div className="flex items-center gap-1 mb-3 pr-12">
                        <CasinoIcon sx={{ fontSize: 16, color: "#6b7280" }} />
                        <span className="text-sm text-gray-500 font-mono">
                          {entry.dice1} & {entry.dice2} / {entry.dice1}
                          {entry.dice2} Words
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-0">
                        {entry.content}
                      </p>

                      {/* Footer with author info and/or delete button */}
                      {(entry.by || session) && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          {entry.by ? (
                            <div className="flex items-center gap-3">
                              {Boolean(entry.is_public) && (
                                <PublicIcon
                                  sx={{ fontSize: 16, color: "gray" }}
                                />
                              )}
                              <span className="text-xs text-gray-500 font-mono">
                                By {entry.by}
                              </span>
                              <span className="text-xs text-gray-500 font-mono">
                                on {formatDate(entry.createdAt)}
                              </span>
                            </div>
                          ) : (
                            <div></div>
                          )}
                          {session && (
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors touch-manipulation"
                              title="Delete story"
                              style={{ minWidth: "40px", minHeight: "40px" }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

export default RollAndWriteEntries;
