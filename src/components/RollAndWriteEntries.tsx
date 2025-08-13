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
} from "@mui/icons-material";

interface RollAndWriteEntry {
  id: string;
  content: string;
  dice1: number;
  dice2: number;
  createdAt: string;
  is_public?: boolean;
  by?: string;
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

            {/* Create New Entry Button - Only show when there are entries */}
            {!loadingEntries && entries.length > 0 && (
              <div className="w-3/4 mx-auto mb-6">
                <div className="w-full flex items-center justify-end">
                  <Link
                    href="/rollandwrite/roll?autoroll=true"
                    className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                  >
                    Roll Them Dice
                  </Link>
                </div>
              </div>
            )}

            {/* Entries List */}
            <div className="w-3/4 mx-auto">
              {loadingEntries ? (
                <div className="text-center text-gray-500 font-mono py-8">
                  Loading stories...
                </div>
              ) : entries.length === 0 ? (
                !session ? (
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
                ) : (
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
                )
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white border border-gray-200 rounded-xl p-3 text-left mb-4"
                  >
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-0">
                      {entry.content}
                    </p>

                    {entry.by && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {Boolean(entry.is_public) && (
                            <PublicIcon sx={{ fontSize: 16, color: "gray" }} />
                          )}
                          <span className="text-xs text-gray-500 font-mono">
                            By {entry.by}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <CasinoIcon
                              sx={{ fontSize: 16, color: "#6b7280" }}
                            />
                            <span className="text-sm text-gray-500 font-mono">
                              {entry.dice1} & {entry.dice2}
                            </span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500 font-mono">
                            {formatDate(entry.createdAt)}
                          </span>
                          {session && (
                            <>
                              <span className="text-gray-300">•</span>
                              <button
                                onClick={() => deleteEntry(entry.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete story"
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RollAndWriteEntries;
