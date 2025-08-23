"use client";

import React, { useState } from "react";
import { Button, TextField, MenuItem } from "@mui/material";
import { useSession, signIn, signOut } from "next-auth/react";
import { Session } from "next-auth";
import Image from "next/image";

// Import type definitions for our JSON data
interface Relationship {
  type: string;
}

interface Network {
  type: string;
  level: number;
}

// Import the JSON data
import relationshipsData from "@/data/relationships.json";
import networksData from "@/data/people-networks.json";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PeopleSuggestions } from "@/components/PeopleSuggestions";
import { renderFooter } from "@/components/shared/footerHelpers";

// MUI Icons
import PublicIcon from "@mui/icons-material/Public";
import AppsIcon from "@mui/icons-material/Apps";
import HomeIcon from "@mui/icons-material/Home";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AssignmentIcon from "@mui/icons-material/Assignment";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import WorkIcon from "@mui/icons-material/Work";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CodeIcon from "@mui/icons-material/Code";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import CasinoIcon from "@mui/icons-material/Casino";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";

console.log("Profile page component mounting...");

export default function UserProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAdminRemote, setIsAdminRemote] = useState<boolean | null>(null);
  const [personIdRemote, setPersonIdRemote] = useState<string | null>(null);
  const [nameFromFB, setNameFromFB] = useState<string | null>(null);
  const [familylineIdRemote, setFamilylineIdRemote] = useState<string | null>(
    null
  );
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function fetchUserInfo() {
      if (!session?.user?.email) return;
      console.log("inUseEffect");
      try {
        const res = await fetch(
          `/api/userinfo?email=${encodeURIComponent(session.user.email)}`
        );
        if (!mounted) return;
        if (!res.ok) {
          setIsAdminRemote(false);
          return;
        }
        const data = await res.json();
        console.log("User info response:", data);
        console.log("User info data:", data);
        setIsAdminRemote(Boolean(data.is_admin));
        setPersonIdRemote(data.person_id ?? null);
        setNameFromFB(data.name ?? session.user?.name ?? null);
        if (data.familyline_id) {
          console.log("Setting familylineId:", data.familyline_id);
          setFamilylineIdRemote(data.familyline_id);
        } else {
          console.log("No familyline_id in response");
          setFamilylineIdRemote(null);
        }
      } catch (err) {
        setIsAdminRemote(false);
        setPersonIdRemote(null);
        setFamilylineIdRemote(null);
        console.warn("Error fetching user info:", err);
      }
    }
    fetchUserInfo();
    return () => {
      mounted = false;
    };
  }, [session]);

  if (status === "loading") {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/images/hikerbikerwriter.png"
            alt="HikerBikerWriter Logo"
            width={200}
            height={100}
            className="w-1/4 h-auto"
          />
        </div>
        <p className="mb-4">Please sign in to view your profile</p>
        <button
          onClick={() => signIn("google")}
          className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // Apps menu configuration
  const apps = [
    { name: "Home", path: "/", icon: HomeIcon },
    {
      name: "Dev Tools",
      path: "/utilities",
      icon: IntegrationInstructionsIcon,
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
          icon: ColorLensIcon,
        },
        {
          name: "Lorem Ipsum",
          path: "/utilities/lorem-ipsum",
          icon: TextFieldsIcon,
        },
        {
          name: "Network Utilities",
          path: "/utilities/network-tools",
          icon: NetworkCheckIcon,
        },
      ],
    },
    { name: "Roll And Write", path: "/rollandwrite", icon: CasinoIcon },
    { name: "Brew Log", path: "/brewday", icon: AssignmentIcon },
    { name: "Field Notes", path: "/fieldnotes", icon: StickyNote2Icon },
    { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
    { name: "jM Galleries", path: "/jmgalleries", icon: PhotoCameraIcon },
    { name: "Job Tracker", path: "/jobs", icon: WorkIcon },
  ];

  // Handle app selection from menu
  const handleAppSelect = (path: string) => {
    router.push(path);
    setIsAppsMenuOpen(false);
    setOpenSubmenu(null);
  };

  // if (status === "loading") {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <span className="text-lg text-gray-500">Loading...</span>
  //       </div>
  //     </div>
  //   );
  // }
  // if (status !== "authenticated" && status !== "unauthenticated") {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <h2 className="text-2xl font-bold mb-4">
  //           Please sign in to view your profile.
  //         </h2>
  //         <button
  //           onClick={() => signIn("google")}
  //           className="px-4 py-2 bg-blue-600 text-white rounded"
  //         >
  //           Sign In With Google
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex flex-1">
        <div className="flex flex-col w-full">
          {/* Header - copied from RollAndWriteEntries */}
          <div className="flex items-center space-x-2 h-[61px] border-b border-gray-200 px-3">
            <Link href="/">
              <button className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer">
                <HomeIcon sx={{ fontSize: 16 }} />
                <span className="hidden sm:inline">Home</span>
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
              User Profile
            </h3>
          </div>
          {/* Auth UI - copied from RollAndWriteEntries */}
          <div className="flex justify-center sm:justify-end px-3 py-2">
            {(() => {
              if (status !== "authenticated") {
                return (
                  <div className="flex items-center gap-2">
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
                  <span className="flex items-center gap-2 font-mono text-blue-600 text-sm">
                    {session.user?.image && (
                      <Image
                        src={session.user.image}
                        alt={session.user?.name || "User profile"}
                        width={28}
                        height={28}
                        className="rounded-full border border-gray-300 cursor-pointer"
                        onClick={() => router.push("/user/profile")}
                      />
                    )}
                    Signed in as {session.user?.name ?? null}
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
          {/* Main profile content */}
          <main className="w-full mx-auto p-8">
            <div className="flex flex-col items-center">
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User profile"}
                  width={96}
                  height={96}
                  className="rounded-full border border-gray-300 mb-4"
                />
              )}
              <h1 className="text-2xl font-bold mb-2">{nameFromFB ?? ""}</h1>
              <p className="text-gray-600 mb-2">
                {session?.user?.email ?? ""}
                {isAdminRemote === true && (
                  <>
                    <span className="mx-2 text-gray-500">|</span>
                    <Link
                      href="/admin"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Admin Panel
                    </Link>
                  </>
                )}
              </p>
            </div>
            <AppSummaries
              userEmail={session?.user?.email ?? ""}
              session={session}
              personIdRemote={personIdRemote}
              familylineIdRemote={familylineIdRemote}
              nameFromFB={nameFromFB}
            />
          </main>
        </div>
      </div>
      {/* Footer - global, matches RollAndWrite */}
      {renderFooter("integrated")}
    </div>
  );
}

interface FamilyInfo {
  name?: string;
  json?: {
    people?: Array<{
      person_id: string;
      name: string;
      email: string;
      gender: string;
      relation: string;
      network_level: number;
    }>;
  };
  [key: string]: unknown;
}

// AppSummaries component fetches and displays counts for each app
function AppSummaries({
  userEmail,
  session,
  personIdRemote,
  familylineIdRemote,
  nameFromFB,
}: {
  readonly userEmail: string;
  readonly session: Session | null;
  readonly personIdRemote?: string | null;
  readonly familylineIdRemote?: string | null;
  readonly nameFromFB?: string | null;
}) {
  const [rollCounts, setRollCounts] = useState<{
    total: number;
    public: number;
    sharedWithFamily: number;
  }>({ total: 0, public: 0, sharedWithFamily: 0 });
  const [fieldCounts, setFieldCounts] = useState<{
    total: number;
    public: number;
    sharedWithFamily: number;
  }>({ total: 0, public: 0, sharedWithFamily: 0 });
  const [recipeCounts, setRecipeCounts] = useState<{
    total: number;
    public: number;
    sharedWithFamily: number;
  }>({ total: 0, public: 0, sharedWithFamily: 0 });
  const [brewLogTotal, setBrewLogTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);
  const [familyLoading, setFamilyLoading] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [relationship, setRelationship] = useState("");
  const [network, setNetwork] = useState("");
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editRelationship, setEditRelationship] = useState("");
  const [editNetwork, setEditNetwork] = useState("");
  interface SearchUser {
    person_id: string;
    name: string;
    email: string;
    relationship?: string;
    network?: string;
  }

  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);

  const handleAddPerson = async (user: SearchUser) => {
    console.log("handleAddPerson called with:", {
      user,
      relationship,
      network,
    });

    if (!userEmail) {
      console.error("Missing user email");
      return;
    }

    if (!relationship) {
      console.error("Please select a relationship");
      return;
    }

    if (!network) {
      console.error("Please select a network");
      return;
    }

    try {
      const response = await fetch("/api/add-family-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.person_id,
          userEmail: userEmail,
          relationship: relationship,
          network: network,
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to add family member");
      }

      // Clear form and refresh data
      setSearchResults([]);
      setSearchQuery("");
      setShowAddPerson(false);

      // Refresh family data
      try {
        const res = await fetch(
          `/api/familyline?email=${encodeURIComponent(userEmail)}`
        );
        if (res.ok) {
          const data = await res.json();
          // Ensure data.json is always an object, not a string
          if (data && typeof data.json === "string") {
            try {
              data.json = JSON.parse(data.json);
            } catch {
              data.json = {};
            }
          }
          setFamilyInfo(data);
        } else {
          setFamilyInfo(null);
        }
      } catch {
        setFamilyInfo(null);
      }
    } catch (error) {
      console.error("Error adding family member:", error);
    }
  };

  const handleEditPerson = async (personId: string) => {
    console.log("handleEditPerson called with:", {
      personId,
      editRelationship,
      editNetwork,
    });

    if (!userEmail) {
      console.error("Missing user email");
      return;
    }

    if (!editRelationship) {
      console.error("Please select a relationship");
      return;
    }

    if (!editNetwork) {
      console.error("Please select a network");
      return;
    }

    try {
      const response = await fetch("/api/update-family-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personId: personId,
          userEmail: userEmail,
          relationship: editRelationship,
          network: editNetwork,
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to update family member");
      }

      // Clear edit state and refresh data
      setEditingPersonId(null);
      setEditRelationship("");
      setEditNetwork("");

      // Refresh family data
      try {
        const res = await fetch(
          `/api/familyline?email=${encodeURIComponent(userEmail)}`
        );
        if (res.ok) {
          const data = await res.json();
          // Ensure data.json is always an object, not a string
          if (data && typeof data.json === "string") {
            try {
              data.json = JSON.parse(data.json);
            } catch {
              data.json = {};
            }
          }
          setFamilyInfo(data);
        } else {
          setFamilyInfo(null);
        }
      } catch {
        setFamilyInfo(null);
      }
    } catch (error) {
      console.error("Error updating family member:", error);
    }
  };

  // Define types for entries
  interface RollEntry {
    is_public: boolean;
    [key: string]: unknown;
  }
  interface FieldEntry {
    is_public: boolean;
    [key: string]: unknown;
  }
  interface RecipeEntry {
    isPublic: boolean;
    sharedWithFamily?: boolean;
    [key: string]: unknown;
  }

  React.useEffect(() => {
    async function fetchCounts() {
      setLoading(true);
      // Fetch all API data in parallel
      const [rollRes, fieldRes, recipeRes] = await Promise.all([
        fetch(`/api/rollnwrite?userEmail=${encodeURIComponent(userEmail)}`),
        fetch(`/api/fieldnotes?userEmail=${encodeURIComponent(userEmail)}`),
        fetch(`/api/recipes?userEmail=${encodeURIComponent(userEmail)}`),
      ]);
      const [rollRaw, fieldRaw, recipeRaw] = await Promise.all([
        rollRes.json(),
        fieldRes.json(),
        recipeRes.json(),
      ]);
      const rollEntries: RollEntry[] = Array.isArray(rollRaw) ? rollRaw : [];
      const fieldEntries: FieldEntry[] = Array.isArray(fieldRaw)
        ? fieldRaw
        : [];
      const recipeEntries: RecipeEntry[] = Array.isArray(recipeRaw)
        ? recipeRaw
        : [];
      setRollCounts({
        total: rollEntries.length,
        public: rollEntries.filter((e) => e.is_public).length,
        sharedWithFamily: rollEntries.filter((e) => e.shared_family).length,
      });
      setFieldCounts({
        total: fieldEntries.length,
        public: fieldEntries.filter((e) => e.is_public).length,
        sharedWithFamily: fieldEntries.filter((e) => e.shared_family).length,
      });
      setRecipeCounts({
        total: recipeEntries.length,
        public: recipeEntries.filter((e) => e.isPublic).length,
        sharedWithFamily: recipeEntries.filter((e) => e.shared_family).length,
      });
      // Brew Day Log total from localStorage
      let brewLogCount = 0;
      try {
        const logs = localStorage.getItem("brewSessions");
        if (logs) {
          const parsed = JSON.parse(logs);
          if (Array.isArray(parsed)) {
            brewLogCount = parsed.length;
          }
        }
      } catch {
        brewLogCount = 0;
      }
      setBrewLogTotal(brewLogCount);
      setLoading(false);
    }
    async function fetchFamily() {
      setFamilyLoading(true);
      try {
        const res = await fetch(
          `/api/familyline?email=${encodeURIComponent(userEmail)}`
        );
        if (res.ok) {
          const data = await res.json();
          // Ensure data.json is always an object, not a string
          if (data && typeof data.json === "string") {
            try {
              data.json = JSON.parse(data.json);
            } catch {
              data.json = {};
            }
          }
          setFamilyInfo(data);
        } else {
          setFamilyInfo(null);
        }
      } catch {
        setFamilyInfo(null);
      }
      setFamilyLoading(false);
    }
    fetchCounts();
    fetchFamily();
  }, [userEmail]);

  if (loading) {
    return (
      <div className="mt-8 text-center text-gray-500">
        Loading app summaries...
      </div>
    );
  }

  // Grid layout for app summaries
  return (
    <>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ...existing code for app summaries... */}
        <div className="flex flex-col items-center justify-center rounded-lg bg-gray-100 shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer min-h-[140px]">
          <CasinoIcon fontSize="large" className="mb-2 text-gray-700" />
          <Link
            href="/rollandwrite"
            className="font-semibold text-black hover:underline text-lg mb-2"
          >
            Roll And Write
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-black">
              <span className="font-bold text-lg">{rollCounts.total}</span>{" "}
              Entries
            </span>
            <span className="flex items-center gap-1 text-xs text-black">
              <PublicIcon fontSize="small" className="text-gray-500" />
              <span className="font-bold text-lg">
                {rollCounts.public}
              </span>{" "}
              Public
            </span>
          </div>
          <span className="text-xs text-gray-700 mt-1 w-full text-center block">
            {rollCounts.sharedWithFamily ?? 0} Shared With Family
          </span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg bg-gray-100 shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer min-h-[140px]">
          <StickyNote2Icon fontSize="large" className="mb-2 text-gray-700" />
          <Link
            href="/fieldnotes"
            className="font-semibold text-black hover:underline text-lg mb-2"
          >
            Field Notes
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-black">
              <span className="font-bold text-lg">{fieldCounts.total}</span>{" "}
              Entries
            </span>
            <span className="flex items-center gap-1 text-xs text-black">
              <PublicIcon fontSize="small" className="text-gray-500" />
              <span className="font-bold text-lg">
                {fieldCounts.public}
              </span>{" "}
              Public
            </span>
          </div>
          <span className="text-xs text-gray-700 mt-1 w-full text-center block">
            {fieldCounts.sharedWithFamily ?? 0} Shared With Family
          </span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg bg-gray-100 shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer min-h-[140px]">
          <RestaurantIcon fontSize="large" className="mb-2 text-gray-700" />
          <Link
            href="/recipes"
            className="font-semibold text-black hover:underline text-lg mb-2"
          >
            Recipes
          </Link>
          <div className="flex flex-col gap-1 items-center justify-center mt-1 w-full">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-black">
                <span className="font-bold text-lg">{recipeCounts.total}</span>{" "}
                Entries
              </span>
              <span className="flex items-center gap-1 text-xs text-black">
                <PublicIcon fontSize="small" className="text-gray-500" />
                <span className="font-bold text-lg">
                  {recipeCounts.public}
                </span>{" "}
                Public
              </span>
            </div>
            <span className="text-xs text-gray-700 mt-1 w-full text-center block">
              {recipeCounts.sharedWithFamily ?? 0} Shared With Family
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg bg-gray-100 shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer min-h-[140px]">
          <AssignmentIcon fontSize="large" className="mb-2 text-gray-700" />
          <Link
            href="/brewday"
            className="font-semibold text-black hover:underline text-lg mb-2"
          >
            Brew Day Log
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-black">
              <span className="font-bold text-lg">{brewLogTotal}</span> Entries
            </span>
          </div>
          <p>
            <span className="text-[10px]">
              *Stored in local storage and may not appear on all devices
            </span>
          </p>
        </div>
      </div>
      <hr className="border-t border-gray-200 my-8 w-full" />
      <div className="flex flex-col items-start w-full mb-8">
        <div className="w-full flex items-center justify-between mb-6">
          {familylineIdRemote ? (
            <div className="text-sm text-gray-700">
              FamilyLineId: {familylineIdRemote}
            </div>
          ) : (
            <div />
          )}
          <div className="w-full sm:w-auto">
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              size="large"
              style={{
                backgroundColor: "#1976d2",
                textTransform: "none",
                boxShadow: "none",
              }}
              className="w-full sm:w-auto"
              onClick={() => setShowAddPerson(true)}
            >
              Add Person
            </Button>
          </div>
        </div>

        {/* Add Person Container - toggled by button */}
        {showAddPerson && (
          <div className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-4 mb-6 flex flex-col items-start">
            <div className="w-full">
              <form
                className="flex flex-row items-center gap-2 w-full"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!searchQuery.trim()) return;

                  setSearching(true);
                  try {
                    // Get list of existing family member person_ids
                    const existingIds = [
                      ...(familyInfo?.json?.people?.map((p) => p.person_id) ||
                        []),
                      personIdRemote,
                    ].filter(Boolean); // Remove any null/undefined values

                    console.log("Client side existingIds:", existingIds);

                    const queryParams = new URLSearchParams({
                      q: searchQuery,
                      personId: personIdRemote || "",
                      excludeIds: existingIds.join(","), // Send as comma-separated string
                    });

                    const response = await fetch(
                      `/api/user-search?${queryParams.toString()}`
                    );
                    if (!response.ok) throw new Error("Search failed");
                    const data = await response.json();
                    setSearchResults(data);
                  } catch (error) {
                    console.error("Search error:", error);
                    // You might want to show an error message to the user here
                  } finally {
                    setSearching(false);
                  }
                }}
              >
                <TextField
                  label="Add a new person to your family/tribe by searching name or email (eg., John Doe or john@gmail.com)."
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ backgroundColor: "white" }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={searching}
                  style={{ textTransform: "none", boxShadow: "none" }}
                >
                  {searching ? "Searching..." : "Search"}
                </Button>
                <button
                  type="button"
                  className="ml-2 text-black hover:text-blue-900"
                  aria-label="Close"
                  onClick={() => {
                    setShowAddPerson(false);
                    setSearchResults([]);
                    setSearchQuery("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <CloseIcon />
                </button>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.person_id}
                      className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm"
                    >
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TextField
                          select
                          size="small"
                          value={relationship}
                          onChange={(e) => {
                            setRelationship(e.target.value);
                            const newResults = searchResults.map((u) =>
                              u.person_id === user.person_id
                                ? { ...u, relationship: e.target.value }
                                : u
                            );
                            setSearchResults(newResults);
                          }}
                          sx={{
                            width: 160,
                            "& .MuiInputBase-root": {
                              height: 36, // Match Button height
                            },
                          }}
                          label="Relationship"
                        >
                          {relationshipsData.relationships.map(
                            (rel: Relationship) => (
                              <MenuItem key={rel.type} value={rel.type}>
                                {rel.type}
                              </MenuItem>
                            )
                          )}
                        </TextField>
                        <TextField
                          select
                          size="small"
                          value={network}
                          onChange={(e) => {
                            setNetwork(e.target.value);
                            const newResults = searchResults.map((u) =>
                              u.person_id === user.person_id
                                ? { ...u, network: e.target.value }
                                : u
                            );
                            setSearchResults(newResults);
                          }}
                          sx={{
                            width: 160,
                            "& .MuiInputBase-root": {
                              height: 36, // Match Button height
                            },
                          }}
                          label="Network"
                        >
                          {networksData.network.map((net: Network) => (
                            <MenuItem key={net.type} value={net.type}>
                              {net.type}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Button
                          variant="outlined"
                          onClick={() => handleAddPerson(user)}
                          style={{
                            textTransform: "none",
                            height: 36, // Explicit height
                            minWidth: 120, // Minimum width for button
                          }}
                          disabled={!relationship || !network}
                        >
                          Add to Family
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div id="peopleyoumayknow">
                {session?.user?.email && familylineIdRemote && (
                  <PeopleSuggestions
                    userEmail={session.user.email}
                    familylineId={familylineIdRemote}
                    userPersonId={personIdRemote}
                    existingFamilyEmails={
                      familyInfo?.json?.people?.map((p) => p.email) || []
                    }
                  />
                )}
              </div>
            </div>
          </div>
        )}
        {/* Family People Card List */}
        {!familyLoading &&
        familyInfo?.json?.people &&
        familyInfo.json.people.length > 0 ? (
          <div className="flex flex-col gap-4 mb-6 w-full">
            {/* Me Card */}
            {session?.user && (
              <div className="flex flex-col sm:flex-row sm:items-center bg-white rounded-lg shadow p-4 w-full">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full mr-4">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt="Me"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <circle cx="16" cy="16" r="16" fill="#1976d2" />
                        <text
                          x="16"
                          y="21"
                          textAnchor="middle"
                          fontSize="16"
                          fill="#fff"
                          fontFamily="Arial"
                        >
                          {session.user.name?.[0] || "?"}
                        </text>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-800">
                      Me ({nameFromFB ?? session.user.name ?? null})
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      Primary Account
                      <EditNoteIcon
                        sx={{
                          fontSize: 12,
                          color: "#9ca3af",
                          cursor: "pointer",
                        }}
                        className="hover:text-gray-600"
                        onClick={() => {
                          // For now, we'll just show an alert since "Me" card editing might be different
                          alert(
                            "Edit functionality for your own profile coming soon!"
                          );
                        }}
                      />
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
                    {/* Badge hidden until family share data is available */}
                    {rollCounts.sharedWithFamily !== undefined && (
                      <span
                        className="absolute -top-2 -right-2"
                        style={{
                          background:
                            rollCounts.sharedWithFamily > 0
                              ? "#dc2626"
                              : "#000",
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
                        {rollCounts.sharedWithFamily}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <StickyNote2Icon
                      fontSize="medium"
                      style={{ color: "#757575" }}
                    />
                    {/* Badge hidden until family share data is available */}
                    {fieldCounts.sharedWithFamily !== undefined && (
                      <span
                        className="absolute -top-2 -right-2"
                        style={{
                          background:
                            fieldCounts.sharedWithFamily > 0
                              ? "#dc2626"
                              : "#000",
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
                        {fieldCounts.sharedWithFamily}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    {recipeCounts.sharedWithFamily > 0 ? (
                      <Link href="/recipes?family=true">
                        <RestaurantIcon
                          fontSize="medium"
                          style={{ color: "#757575", cursor: "pointer" }}
                        />
                      </Link>
                    ) : (
                      <RestaurantIcon
                        fontSize="medium"
                        style={{ color: "#757575" }}
                      />
                    )}
                    {recipeCounts.sharedWithFamily !== undefined && (
                      <span
                        className="absolute -top-2 -right-2"
                        style={{
                          background:
                            recipeCounts.sharedWithFamily > 0
                              ? "#dc2626"
                              : "#000",
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
                        {recipeCounts.sharedWithFamily}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other people */}
            {familyInfo.json.people.map(
              (person: {
                person_id: string;
                name: string;
                gender: string;
                relation: string;
                network_level: number;
                shared_data?: {
                  roll_and_write?: number;
                  field_notes?: number;
                  recipes?: number;
                };
              }) => {
                // ...existing code for person card...
                let iconColor = "bg-gray-400";
                if (person.gender === "male") iconColor = "bg-blue-500";
                else if (person.gender === "female") iconColor = "bg-pink-400";
                const extendedRelations = ["friend", "co-worker", "neighbor"];
                let familyType = "Immediate Family";
                if (extendedRelations.includes(person.relation.toLowerCase())) {
                  familyType = "Extended Family";
                } else if (person.network_level !== 1) {
                  familyType = "Extended Family";
                }
                const shared = person.shared_data || {};
                return (
                  <div
                    key={person.person_id}
                    className="bg-white rounded-lg shadow p-4 w-full"
                  >
                    {/* Profile info and icons row */}
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <div className="flex items-center">
                        <div
                          className={`flex items-center justify-center w-12 h-12 rounded-full mr-4`}
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
                            <circle
                              cx="16"
                              cy="16"
                              r="16"
                              fill={(() => {
                                if (iconColor === "bg-blue-500")
                                  return "#3F51B5";
                                if (iconColor === "bg-pink-400")
                                  return "#f472b6";
                                return "#9ca3af";
                              })()}
                            />
                            <text
                              x="16"
                              y="21"
                              textAnchor="middle"
                              fontSize="16"
                              fill="#fff"
                              fontFamily="Arial"
                            >
                              {person.name ? person.name[0] : "?"}
                            </text>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-lg text-gray-800">
                            <Link
                              href={`/person/${person.person_id}`}
                              className="hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              {person.name}
                            </Link>
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            {familyType} ({person.relation})
                            <EditNoteIcon
                              sx={{
                                fontSize: 12,
                                color: "#9ca3af",
                                cursor: "pointer",
                              }}
                              className="hover:text-gray-600"
                              onClick={() => {
                                if (editingPersonId === person.person_id) {
                                  // Cancel editing
                                  setEditingPersonId(null);
                                  setEditRelationship("");
                                  setEditNetwork("");
                                } else {
                                  // Start editing
                                  setEditingPersonId(person.person_id);
                                  setEditRelationship(person.relation);
                                  // Convert network_level to network type
                                  const networkType =
                                    networksData.network.find(
                                      (n: Network) =>
                                        n.level === person.network_level
                                    )?.type || "";
                                  setEditNetwork(networkType);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Icons section - responsive layout like Me card */}
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
                            {shared.roll_and_write ?? 0}
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
                            {shared.field_notes ?? 0}
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
                            {shared.recipes ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Edit form - shows when this person is being edited */}
                    {editingPersonId === person.person_id && (
                      <div className="mt-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <TextField
                              select
                              size="small"
                              value={editRelationship}
                              onChange={(e) =>
                                setEditRelationship(e.target.value)
                              }
                              sx={{
                                width: { xs: "100%", sm: 160 },
                                "& .MuiInputBase-root": {
                                  height: 36,
                                },
                              }}
                              label="Relationship"
                            >
                              {relationshipsData.relationships.map(
                                (rel: Relationship) => (
                                  <MenuItem key={rel.type} value={rel.type}>
                                    {rel.type}
                                  </MenuItem>
                                )
                              )}
                            </TextField>
                            <TextField
                              select
                              size="small"
                              value={editNetwork}
                              onChange={(e) => setEditNetwork(e.target.value)}
                              sx={{
                                width: { xs: "100%", sm: 160 },
                                "& .MuiInputBase-root": {
                                  height: 36,
                                },
                              }}
                              label="Network"
                            >
                              {networksData.network.map((net: Network) => (
                                <MenuItem key={net.type} value={net.type}>
                                  {net.type}
                                </MenuItem>
                              ))}
                            </TextField>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button
                                variant="contained"
                                onClick={() =>
                                  handleEditPerson(person.person_id)
                                }
                                style={{
                                  textTransform: "none",
                                  height: 36,
                                  minWidth: 80,
                                }}
                                className="flex-1 sm:flex-none"
                                disabled={!editRelationship || !editNetwork}
                              >
                                Update
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  setEditingPersonId(null);
                                  setEditRelationship("");
                                  setEditNetwork("");
                                }}
                                style={{
                                  textTransform: "none",
                                  height: 36,
                                  minWidth: 80,
                                }}
                                className="flex-1 sm:flex-none"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div className="w-full bg-gray-100 rounded px-4 py-3 mb-8 text-center">
            <span className="text-gray-600 text-sm">
              Sorry, but we can&apos;t find any people in your Tribe. Why not
              invite some? Here is a link.{" "}
            </span>
          </div>
        )}

        {/* End Family People Card List */}
        {(() => {
          let familyContent;
          if (familyLoading) {
            familyContent = (
              <div className="w-full bg-gray-100 rounded px-4 py-3 mt-2">
                <span className="text-gray-600 text-sm">
                  Loading family info...
                </span>
              </div>
            );
          } else if (familyInfo) {
            familyContent = (
              <>
                <button
                  className="text-blue-600 text-sm underline mb-2"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => setShowRawJson((prev) => !prev)}
                >
                  {showRawJson ? "< hide json raw data" : "> json raw data"}
                </button>
                {showRawJson && (
                  <div className="w-full bg-gray-100 rounded px-4 py-3 mt-2">
                    <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">
                      {JSON.stringify(familyInfo.json, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            );
          } else {
            familyContent = (
              <div className="w-full bg-gray-100 rounded px-4 py-3 mt-2">
                <span className="text-gray-600 text-sm">
                  No family information found.
                </span>
              </div>
            );
          }
          return familyContent;
        })()}
      </div>
    </>
  );
}
