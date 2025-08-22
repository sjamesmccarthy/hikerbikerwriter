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
  Folder as FolderIcon,
  Casino as CasinoIcon,
  StickyNote2 as StickyNote2Icon,
  CreateNewFolder as CreateNewFolderIcon,
  GroupWorkOutlined as GroupWorkOutlinedIcon,
} from "@mui/icons-material";
import { Tabs, Tab, Box, Select, MenuItem, FormControl } from "@mui/material";
import { renderFooter } from "@/components/shared/footerHelpers";
import { useSession, signIn, signOut } from "next-auth/react";
import peopleNetworksData from "@/data/people-networks.json";

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
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
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
  const [relationshipFilter, setRelationshipFilter] = useState<string>("all");
  const [showFamilyTree, setShowFamilyTree] = useState(false);

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
                <Tab label="People" {...a11yProps(3)} />
              </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
              {/* <div className="text-center text-gray-600 mb-6">
                <h3 className="text-lg font-semibold mb-6">
                  Profile
                </h3>
              </div> */}

              {/* Activities Grid */}
              <div className="flex justify-center py-8">
                <div className="grid grid-cols-3 gap-8 md:gap-12">
                  {/* Roll And Write */}
                  <div className="flex flex-col items-center cursor-pointer hover:opacity-75 transition-opacity">
                    <div className="mb-3 relative">
                      <CasinoIcon
                        sx={{
                          fontSize: 60,
                          color: "#9C27B0",
                        }}
                      />
                      <span
                        className="absolute -top-2 -right-2"
                        style={{
                          background: "#000",
                          color: "#fff",
                          borderRadius: "50%",
                          padding: "0",
                          fontWeight: "bold",
                          minWidth: "24px",
                          fontSize: "0.75rem",
                          height: "24px",
                          width: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        }}
                      >
                        7
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Roll & Write
                    </span>
                  </div>

                  {/* Field Notes */}
                  <div className="flex flex-col items-center cursor-pointer hover:opacity-75 transition-opacity">
                    <div className="mb-3 relative">
                      <StickyNote2Icon
                        sx={{
                          fontSize: 60,
                          color: "#FF9800",
                        }}
                      />
                      <span
                        className="absolute -top-2 -right-2"
                        style={{
                          background: "#000",
                          color: "#fff",
                          borderRadius: "50%",
                          padding: "0",
                          fontWeight: "bold",
                          minWidth: "24px",
                          fontSize: "0.75rem",
                          height: "24px",
                          width: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        }}
                      >
                        12
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Field Notes
                    </span>
                  </div>

                  {/* Recipes */}
                  <div className="flex flex-col items-center cursor-pointer hover:opacity-75 transition-opacity">
                    <div className="mb-3 relative">
                      <RestaurantIcon
                        sx={{
                          fontSize: 60,
                          color: "#4CAF50",
                        }}
                      />
                      <span
                        className="absolute -top-2 -right-2"
                        style={{
                          background: "#000",
                          color: "#fff",
                          borderRadius: "50%",
                          padding: "0",
                          fontWeight: "bold",
                          minWidth: "24px",
                          fontSize: "0.75rem",
                          height: "24px",
                          width: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        }}
                      >
                        5
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Recipes
                    </span>
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <div className="text-center text-gray-800 pt-8 pb-4">
                <p>
                  We discovered some people that{" "}
                  <span className="font-semibold">you and Stacey McCarthy</span>{" "}
                  may have a connection with.
                </p>
              </div>

              {/* Sample People Card */}
              <div className="bg-white rounded-lg shadow p-4 w-full">
                {/* Profile info and icons row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-full mr-4"
                      style={{
                        boxShadow: "0 0 0 0 transparent",
                        border: "none",
                        background: "none",
                      }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <circle cx="16" cy="16" r="16" fill="#3F51B5" />
                        <text
                          x="16"
                          y="21"
                          textAnchor="middle"
                          fontSize="16"
                          fill="#fff"
                          fontFamily="Arial"
                        >
                          J
                        </text>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-800">
                        John Smith
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        Immediate Family (Brother)
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 sm:mt-0 flex gap-2">
                    <button
                      onClick={() => alert("Ignore functionality coming soon!")}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() =>
                        alert("Connect functionality coming soon!")
                      }
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              {/* Header with Add Button */}

              {/* Folder Grid */}
              <div className="flex justify-center py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                  {/* Photos Folder */}
                  <div className="flex flex-col items-center cursor-pointer hover:opacity-75 transition-opacity">
                    <div className="mb-3">
                      <FolderIcon
                        sx={{
                          fontSize: 60,
                          color: "#FFA726",
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Photos
                    </span>
                  </div>

                  {/* Web Clippings Folder */}
                  <div className="flex flex-col items-center cursor-pointer hover:opacity-75 transition-opacity">
                    <div className="mb-3">
                      <FolderIcon
                        sx={{
                          fontSize: 60,
                          color: "#42A5F5",
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Web Clippings
                    </span>
                  </div>

                  {/* Notes Folder */}
                  <div className="flex flex-col items-center cursor-pointer hover:opacity-75 transition-opacity">
                    <div className="mb-3">
                      <FolderIcon
                        sx={{
                          fontSize: 60,
                          color: "#66BB6A",
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Notes
                    </span>
                  </div>

                  {/* Add New Folder */}
                  <div className="flex flex-col items-center cursor-pointer hover:opacity-75 transition-opacity">
                    <div className="mb-3">
                      <CreateNewFolderIcon
                        sx={{
                          fontSize: 60,
                          color: "#9E9E9E",
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Add New Folder
                    </span>
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <div className="w-full mx-auto py-8">
                {/* Filter Section */}
                <div className="mb-6 flex justify-between items-center">
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                      value={relationshipFilter}
                      onChange={(e) => setRelationshipFilter(e.target.value)}
                      displayEmpty
                      sx={{
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "#d1d5db",
                          },
                          "&:hover fieldset": {
                            borderColor: "#9ca3af",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#3b82f6",
                          },
                        },
                      }}
                    >
                      <MenuItem value="all">All Relationships</MenuItem>
                      {peopleNetworksData.network.map((network) => (
                        <MenuItem key={network.type} value={network.type}>
                          {network.type.charAt(0).toUpperCase() +
                            network.type.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Family Tree Icon */}
                  <button
                    onClick={() => setShowFamilyTree(!showFamilyTree)}
                    className="p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Toggle Family Tree"
                  >
                    <GroupWorkOutlinedIcon
                      sx={{
                        fontSize: 24,
                        color: showFamilyTree ? "#3b82f6" : "#6b7280",
                      }}
                    />
                  </button>
                </div>

                {/* Family Tree Visualization */}
                {showFamilyTree && (
                  <div className="mb-6 bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                      <div className="text-gray-600">
                        {/* Concentric Network Layout - 3 Rings */}
                        <div className="relative w-[48rem] h-[48rem] mx-auto mb-8">
                          {/* Ring Borders */}
                          {/* Outermost Ring - Colleagues/Acquaintances */}
                          <div className="absolute inset-0 border-2 border-gray-300 rounded-full z-10"></div>
                          {/* Middle Ring - Extended Family/Friends */}
                          <div className="absolute inset-16 border-2 border-orange-300 rounded-full z-10"></div>
                          {/* Inner Ring - Immediate Family */}
                          <div className="absolute inset-40 border-4 border-blue-400 rounded-full bg-blue-50 z-10"></div>

                          {/* People Positioned Relative to Main Container - All Same Size */}

                          {/* Outermost Ring - Colleagues/Acquaintances */}
                          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 group z-30">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold cursor-pointer hover:scale-110 transition-transform">
                              C
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                              Carol Davis - Colleague
                            </div>
                          </div>
                          <div className="absolute bottom-12 right-12 group z-30">
                            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold cursor-pointer hover:scale-110 transition-transform">
                              A
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                              Alice Johnson - Acquaintance
                            </div>
                          </div>
                          <div className="absolute left-12 top-1/2 transform -translate-y-1/2 group z-30">
                            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold cursor-pointer hover:scale-110 transition-transform">
                              N
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                              Nancy Brown - Neighbor
                            </div>
                          </div>

                          {/* Middle Ring - Extended Family/Friends */}
                          <div className="absolute top-28 left-1/2 transform -translate-x-1/2 group z-30">
                            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold cursor-pointer hover:scale-110 transition-transform">
                              F
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                              Frank Miller - Friend
                            </div>
                          </div>
                          <div className="absolute bottom-28 right-28 group z-30">
                            <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold cursor-pointer hover:scale-110 transition-transform">
                              E
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                              Emma McCarthy - Extended Family
                            </div>
                          </div>

                          {/* Inner Ring - Immediate Family */}
                          {/* Center - You */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group z-30">
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold ring-4 ring-blue-200 cursor-pointer hover:scale-105 transition-transform">
                              S
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                              Stacey McCarthy - You
                            </div>
                          </div>

                          {/* Immediate Family Members around center */}
                          <div className="absolute top-48 left-1/2 transform -translate-x-1/2 group z-30">
                            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold cursor-pointer hover:scale-110 transition-transform">
                              J
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                              John McCarthy - Brother
                            </div>
                          </div>
                          <div className="absolute bottom-48 left-1/2 transform -translate-x-1/2 group z-30">
                            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold cursor-pointer hover:scale-110 transition-transform">
                              M
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                              Mary McCarthy - Mother
                            </div>
                          </div>
                        </div>

                        {/* Network Level Labels - Three Rings */}
                        <div className="flex justify-center px-4">
                          <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs max-w-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                              <span>Immediate Family</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              <span>Extended/Friends</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                              <span>Colleagues/Acquaintances</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sample People Card */}
                <div className="bg-white rounded-lg shadow p-4 w-full">
                  {/* Profile info and icons row */}
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <div className="flex items-center">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-full mr-4"
                        style={{
                          boxShadow: "0 0 0 0 transparent",
                          border: "none",
                          background: "none",
                        }}
                      >
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 32 32"
                          fill="none"
                        >
                          <circle cx="16" cy="16" r="16" fill="#3F51B5" />
                          <text
                            x="16"
                            y="21"
                            textAnchor="middle"
                            fontSize="16"
                            fill="#fff"
                            fontFamily="Arial"
                          >
                            J
                          </text>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-800">
                          John Smith
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          Immediate Family (Brother)
                        </div>
                      </div>
                    </div>

                    {/* Icons section */}
                    <div className="flex flex-row items-center gap-4 mt-4 sm:mt-0 justify-end sm:ml-auto">
                      <div className="relative flex items-center">
                        <CasinoIcon
                          fontSize="medium"
                          style={{ color: "#757575" }}
                        />
                        <span
                          className="absolute -top-2 -right-2"
                          style={{
                            background: "#000",
                            color: "#fff",
                            borderRadius: "50%",
                            padding: "0",
                            fontWeight: "bold",
                            minWidth: "20px",
                            fontSize: "0.7rem",
                            height: "20px",
                            width: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          }}
                        >
                          3
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <StickyNote2Icon
                          fontSize="medium"
                          style={{ color: "#757575" }}
                        />
                        <span
                          className="absolute -top-2 -right-2"
                          style={{
                            background: "#000",
                            color: "#fff",
                            borderRadius: "50%",
                            padding: "0",
                            fontWeight: "bold",
                            minWidth: "20px",
                            fontSize: "0.7rem",
                            height: "20px",
                            width: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          }}
                        >
                          5
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <RestaurantIcon
                          fontSize="medium"
                          style={{ color: "#757575" }}
                        />
                        <span
                          className="absolute -top-2 -right-2"
                          style={{
                            background: "#000",
                            color: "#fff",
                            borderRadius: "50%",
                            padding: "0",
                            fontWeight: "bold",
                            minWidth: "20px",
                            fontSize: "0.7rem",
                            height: "20px",
                            width: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          }}
                        >
                          2
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-gray-500 text-sm mt-6">
                  <p>Showing mutual connections and shared relationships</p>
                </div>
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
