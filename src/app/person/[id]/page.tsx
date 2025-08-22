"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowBack as ArrowBackIcon,
  Apps as AppsIcon,
  EditNote as EditNoteIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  Home as HomeIcon,
  IntegrationInstructions as DevToolsIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
} from "@mui/icons-material";
import { Tabs, Tab, Box } from "@mui/material";
import { renderFooter } from "@/components/shared/footerHelpers";
import { useSession, signIn, signOut } from "next-auth/react";

interface PersonData {
  person_id: string;
  name: string;
  relation: string;
  network_level: number;
  gender?: string;
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`person-tabpanel-${index}`}
      aria-labelledby={`person-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `person-tab-${index}`,
    "aria-controls": `person-tabpanel-${index}`,
  };
}

export default function PersonPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [personData, setPersonData] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Apps menu configuration (same as FieldNotes)
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

  // Fetch person data
  useEffect(() => {
    async function fetchPersonData() {
      if (!params?.id || !session?.user?.email) {
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/person/${params.id}?email=${encodeURIComponent(
            session.user.email
          )}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `HTTP ${response.status}: Failed to fetch person data`
          );
        }

        const data = await response.json();
        setPersonData(data);
      } catch (err) {
        console.error("Error fetching person data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchPersonData();
  }, [params?.id, session?.user?.email]);

  // Get network level text based on the JSON data
  const getNetworkLevelText = (level: number) => {
    switch (level) {
      case 1:
        return "Immediate Family";
      case 2:
        return "Extended Family";
      case 3:
        return "Colleague";
      case 4:
        return "Acquaintance";
      default:
        return "Unknown";
    }
  };

  // Capitalize first letter of each word
  const capitalizeRelationship = (relationship: string) => {
    return relationship
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please sign in to view person details</p>
          <button
            onClick={() => signIn("google")}
            className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (error || !personData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Person not found"}</p>
          <Link href="/user/profile">
            <button className="px-4 py-2 rounded bg-gray-600 text-white font-mono text-sm hover:bg-gray-700 transition">
              Back to Profile
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex-1">
        {/* Header - same structure as FieldNotes */}
        <div className="flex items-center space-x-2 h-[61px] border-b border-gray-200 px-3">
          <Link href="/user/profile">
            <button className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer">
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              <span className="hidden sm:inline">Back to Profile</span>
            </button>
          </Link>

          <div className="h-4 w-px bg-gray-300" />

          {/* Apps Menu */}
          <div className="relative">
            <button
              onClick={() => setIsAppsMenuOpen(!isAppsMenuOpen)}
              onBlur={() => {
                // Small delay to allow menu item clicks to register
                setTimeout(() => setIsAppsMenuOpen(false), 150);
              }}
              className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
            >
              <AppsIcon sx={{ fontSize: 16 }} />
              <span className="hidden sm:inline">Apps</span>
            </button>

            {isAppsMenuOpen && (
              <>
                <button
                  className="fixed inset-0 z-40 bg-transparent border-none cursor-default"
                  onClick={() => setIsAppsMenuOpen(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsAppsMenuOpen(false);
                    }
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

          <h3 className="text-lg font-semibold text-gray-800">Person</h3>
        </div>

        {/* Auth UI */}
        <div className="flex justify-center sm:justify-end px-3 py-2">
          {(() => {
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col px-0 py-6">
          {/* Person Info - Centered */}
          <div className="w-full px-6 mb-12 mt-0 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {personData.name}
            </h1>
            <p className="text-lg text-gray-600">
              {getNetworkLevelText(personData.network_level)} (
              {capitalizeRelationship(personData.relation)})
            </p>
          </div>

          {/* Tabs */}
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={activeTab}
                onChange={(event, newValue) => setActiveTab(newValue)}
                aria-label="person tabs"
                centered
              >
                <Tab label="Profile" {...a11yProps(0)} />
                <Tab label="Discovery" {...a11yProps(1)} />
                <Tab label="Artifacts" {...a11yProps(2)} />
              </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
              <div className="text-center text-gray-600">
                <p>Things being shared coming soon...</p>
              </div>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <div className="text-center text-gray-600">
                <p>Shared discoveries and interests coming soon...</p>
              </div>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <div className="text-center text-gray-600">
                <p>Shared photos, notes, and memories coming soon...</p>
              </div>
            </TabPanel>
          </div>
        </div>
      </div>

      {/* Footer - same as FieldNotes */}
      {renderFooter("integrated")}
    </div>
  );
}
