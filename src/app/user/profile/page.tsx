"use client";

import React, { useState } from "react";
import {
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
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

interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
  timer?: {
    duration: number;
    startTime: number;
    isActive: boolean;
  };
}

interface BrewSession {
  id: string;
  name: string;
  date: string;
  brewData: {
    [key: string]: string;
  };
  logEntries: LogEntry[];
  savedAt: string;
}

// Import the JSON data
import relationshipsData from "@/data/relationships.json";
import networksData from "@/data/people-networks.json";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PeopleSuggestions } from "@/components/PeopleSuggestions";
import { renderFooter } from "@/components/shared/footerHelpers";

// MUI Icons
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
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
import DeleteIcon from "@mui/icons-material/Delete";

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState<string>("");

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

  // Function to handle name update
  const handleNameUpdate = async () => {
    if (!session?.user?.email || !editedName.trim()) return;

    try {
      const response = await fetch("/api/users/update-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          name: editedName.trim(),
        }),
      });

      if (response.ok) {
        setNameFromFB(editedName.trim());
        setIsEditingName(false);
      } else {
        console.error("Failed to update name");
        // Reset the edited name to the current name
        setEditedName(nameFromFB || "");
      }
    } catch (error) {
      console.error("Error updating name:", error);
      // Reset the edited name to the current name
      setEditedName(nameFromFB || "");
    }
  };

  // Function to handle edit mode
  const handleEditStart = () => {
    setEditedName(nameFromFB || "");
    setIsEditingName(true);
  };

  // Function to handle edit cancel
  const handleEditCancel = () => {
    setEditedName("");
    setIsEditingName(false);
  };

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
                    {nameFromFB ? `Signed in as ${nameFromFB}` : ""}
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
          <main className="w-full sm:w-3/4 mx-auto p-8">
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                {isEditingName ? (
                  <>
                    <TextField
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleNameUpdate();
                        } else if (e.key === "Escape") {
                          handleEditCancel();
                        }
                      }}
                      size="small"
                      autoFocus
                      variant="outlined"
                      className="w-full sm:w-auto"
                      sx={{
                        "& .MuiInputBase-input": {
                          textAlign: "left",
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                        },
                        "& .MuiInputBase-root": {
                          height: "40px",
                        },
                      }}
                    />
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        onClick={handleNameUpdate}
                        variant="contained"
                        className="flex-1 sm:flex-none"
                        sx={{
                          minWidth: "auto",
                          px: 2,
                          height: "40px",
                          textTransform: "none",
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={handleEditCancel}
                        variant="outlined"
                        className="flex-1 sm:flex-none"
                        sx={{
                          minWidth: "auto",
                          px: 2,
                          height: "40px",
                          textTransform: "none",
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Mobile: Edit icon on the right */}
                    <div className="flex items-center sm:hidden">
                      <h1 className="text-2xl font-bold">{nameFromFB ?? ""}</h1>
                      <EditNoteIcon
                        onClick={handleEditStart}
                        className="text-gray-500 hover:text-gray-700 cursor-pointer ml-2"
                        fontSize="small"
                      />
                    </div>

                    {/* Desktop: Edit icon on the right */}
                    <div className="hidden sm:flex sm:items-center">
                      <h1 className="text-2xl font-bold">{nameFromFB ?? ""}</h1>
                      <EditNoteIcon
                        onClick={handleEditStart}
                        className="text-gray-500 hover:text-gray-700 cursor-pointer ml-2"
                        fontSize="small"
                      />
                    </div>
                  </>
                )}
              </div>
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
  const [jobCounts, setJobCounts] = useState<{
    total: number;
    applied: number;
    hasActiveSearch: boolean;
  }>({
    total: 0,
    applied: 0,
    hasActiveSearch: false,
  });

  // State for storing real counts for each family member
  const [personCounts, setPersonCounts] = useState<{
    [personId: string]: {
      rollAndWrite: number;
      fieldNotes: number;
      recipes: number;
    };
  }>({});
  const [loading, setLoading] = useState(true);
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);
  const [familyLoading, setFamilyLoading] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editRelationship, setEditRelationship] = useState("");
  const [editNetwork, setEditNetwork] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<{
    person_id: string;
    name: string;
  } | null>(null);
  interface SearchUser {
    person_id: string;
    name: string;
    email: string;
    relationship?: string;
    network?: string;
  }

  interface RollAndWriteEntry {
    created_at: string;
    title: string;
    is_public: boolean;
    shared_family: boolean;
    content: string;
  }

  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);

  // Function to handle Roll and Write entries download
  const handleRollAndWriteDownload = async () => {
    try {
      const res = await fetch(
        `/api/rollnwrite?userEmail=${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) throw new Error("Failed to fetch entries");

      const entries = (await res.json()) as RollAndWriteEntry[];
      const formattedData = entries.map((entry: RollAndWriteEntry) => ({
        date: entry.created_at,
        title: entry.title,
        is_public: entry.is_public ? "Yes" : "No",
        shared_family: entry.shared_family ? "Yes" : "No",
        content: entry.content,
      }));

      type FormattedEntry = {
        date: string;
        title: string;
        is_public: string;
        shared_family: string;
        content: string;
      };

      const csvContent = [
        ["Date", "Title", "Public", "Shared with Family", "Content"],
        ...formattedData.map((entry: FormattedEntry) => [
          entry.date,
          entry.title,
          entry.is_public,
          entry.shared_family,
          entry.content,
        ]),
      ]
        .map((row) => row.map((cell: string) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `roll-and-write-entries-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading entries:", error);
      alert("Failed to download entries. Please try again.");
    }
  };

  // Helper function to determine image file extension
  const getImageExtension = (mimeType: string): string => {
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
    if (mimeType.includes("png")) return "png";
    if (mimeType.includes("gif")) return "gif";
    return "jpg";
  };

  // Helper function to process a single image
  const processImage = (
    imageData: unknown,
    imageCounter: number,
    imageFolder: unknown
  ): string => {
    try {
      let base64Data: string;
      let mimeType: string;

      if (
        typeof imageData === "string" &&
        imageData.startsWith("data:image/")
      ) {
        [mimeType, base64Data] = imageData.split(",");
      } else if (
        typeof imageData === "object" &&
        imageData !== null &&
        "data" in imageData
      ) {
        const objData = imageData as { data: string };
        [mimeType, base64Data] = objData.data.split(",");
      } else {
        return `- [Unsupported image format]\n`;
      }

      const extension = getImageExtension(mimeType);
      const fileName = `image_${imageCounter}.${extension}`;

      // Convert base64 to binary and add to zip
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let j = 0; j < binaryData.length; j++) {
        bytes[j] = binaryData.charCodeAt(j);
      }

      if (
        imageFolder &&
        typeof imageFolder === "object" &&
        "file" in imageFolder
      ) {
        (
          imageFolder as { file: (name: string, data: Uint8Array) => void }
        ).file(fileName, bytes);
      }
      return `- ${fileName}\n`;
    } catch (imageError) {
      console.warn(`Failed to process image:`, imageError);
      return `- [Image processing failed]\n`;
    }
  };

  // Helper function to safely convert to string
  const toSafeString = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    return "";
  };

  // Helper function to build field note content
  const buildFieldNoteContent = (
    note: Record<string, unknown>,
    index: number
  ): string => {
    let content = `Entry ${index + 1}\n`;
    content += `-`.repeat(50) + "\n";
    content += `Title: ${toSafeString(note.title) || "Untitled"}\n`;
    content += `Date: ${
      toSafeString(note.created) || toSafeString(note.date) || "Unknown date"
    }\n`;
    content += `Author: ${
      toSafeString(note.author) || toSafeString(note.by) || "Anonymous"
    }\n`;
    content += `Public: ${note.is_public ? "Yes" : "No"}\n`;
    content += `Shared with Family: ${note.shared_family ? "Yes" : "No"}\n`;

    if (note.location) content += `Location: ${toSafeString(note.location)}\n`;
    if (note.weather) content += `Weather: ${toSafeString(note.weather)}\n`;
    if (note.temperature)
      content += `Temperature: ${toSafeString(note.temperature)}\n`;

    content += "\nContent:\n";
    content +=
      toSafeString(note.content) || toSafeString(note.text) || "No content";
    content += "\n";

    return content;
  };

  // Function to handle Field Notes download with image extraction
  const handleFieldNotesDownload = async () => {
    try {
      const res = await fetch(
        `/api/fieldnotes?userEmail=${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) throw new Error("Failed to fetch field notes");

      const fieldNotes = await res.json();
      if (!Array.isArray(fieldNotes) || fieldNotes.length === 0) {
        alert("No field notes found to download.");
        return;
      }

      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      let textContent = "FIELD NOTES EXPORT\n";
      textContent += `Exported on: ${new Date().toISOString()}\n`;
      textContent += `Total entries: ${fieldNotes.length}\n\n`;
      textContent += "=" + "=".repeat(70) + "\n\n";

      let imageCounter = 1;
      const imageFolder = zip.folder("images");

      for (let i = 0; i < fieldNotes.length; i++) {
        const note = fieldNotes[i];
        textContent += buildFieldNoteContent(note, i);

        // Extract images if they exist
        if (note.images && Array.isArray(note.images)) {
          textContent += "\nImages:\n";

          for (const imageData of note.images) {
            const imageResult = processImage(
              imageData,
              imageCounter,
              imageFolder
            );
            textContent += imageResult;
            if (!imageResult.includes("[")) {
              imageCounter++;
            }
          }
        }

        textContent += "\n" + "=" + "=".repeat(70) + "\n\n";
      }

      // Add the text file to the zip
      zip.file("field-notes.txt", textContent);

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.setAttribute(
        "download",
        `field-notes-export-${new Date().toISOString().split("T")[0]}.zip`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading field notes:", error);
      alert("Failed to download field notes. Please try again.");
    }
  };

  // Helper function to process recipe photos
  const processRecipePhotos = (
    recipe: Record<string, unknown>,
    recipeFolder: unknown
  ): void => {
    // Process main recipe photo
    if (
      recipe.photo &&
      typeof recipe.photo === "string" &&
      recipe.photo.startsWith("data:image/")
    ) {
      try {
        const [mimeType, base64Data] = recipe.photo.split(",");
        const extension = getImageExtension(mimeType);
        const fileName = `recipe-photo.${extension}`;

        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let j = 0; j < binaryData.length; j++) {
          bytes[j] = binaryData.charCodeAt(j);
        }

        if (
          recipeFolder &&
          typeof recipeFolder === "object" &&
          "file" in recipeFolder
        ) {
          (
            recipeFolder as { file: (name: string, data: Uint8Array) => void }
          ).file(fileName, bytes);
        }
      } catch (error) {
        console.warn(
          `Failed to process recipe photo for ${recipe.title}:`,
          error
        );
      }
    }

    // Process family photo if it exists
    if (
      recipe.familyPhoto &&
      typeof recipe.familyPhoto === "string" &&
      recipe.familyPhoto.startsWith("data:image/")
    ) {
      try {
        const [mimeType, base64Data] = recipe.familyPhoto.split(",");
        const extension = getImageExtension(mimeType);
        const fileName = `family-photo.${extension}`;

        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let j = 0; j < binaryData.length; j++) {
          bytes[j] = binaryData.charCodeAt(j);
        }

        if (
          recipeFolder &&
          typeof recipeFolder === "object" &&
          "file" in recipeFolder
        ) {
          (
            recipeFolder as { file: (name: string, data: Uint8Array) => void }
          ).file(fileName, bytes);
        }
      } catch (error) {
        console.warn(
          `Failed to process family photo for ${recipe.title}:`,
          error
        );
      }
    }
  };

  // Helper function to process additional recipe images
  const processAdditionalImages = (
    recipe: Record<string, unknown>,
    recipeFolder: unknown
  ): void => {
    if (recipe.images && Array.isArray(recipe.images)) {
      let imageCounter = 1;
      for (const imageData of recipe.images) {
        const imageResult = processRecipeImage(
          imageData,
          imageCounter,
          recipeFolder
        );
        if (imageResult.success) {
          imageCounter++;
        }
      }
    }
  };

  // Function to handle Recipes download with image extraction
  const handleRecipesDownload = async () => {
    try {
      const res = await fetch(
        `/api/recipes?userEmail=${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) throw new Error("Failed to fetch recipes");

      const recipes = await res.json();
      if (!Array.isArray(recipes) || recipes.length === 0) {
        alert("No recipes found to download.");
        return;
      }

      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Create a main index file
      let indexContent = "RECIPES EXPORT\n";
      indexContent += `Exported on: ${new Date().toISOString()}\n`;
      indexContent += `Total recipes: ${recipes.length}\n\n`;
      indexContent += "Recipe Index:\n";
      indexContent += "=" + "=".repeat(50) + "\n";

      for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        const folderName = `recipe-${i + 1}-${(recipe.title || "untitled")
          .replace(/[^a-zA-Z0-9]/g, "-")
          .toLowerCase()}`;

        indexContent += `${i + 1}. ${
          recipe.title || "Untitled"
        } (folder: ${folderName})\n`;

        // Create individual folder for each recipe
        const recipeFolder = zip.folder(folderName);
        if (!recipeFolder) continue;

        // Create the recipe text file
        const recipeContent = buildRecipeContent(recipe, i);
        recipeFolder.file("recipe.txt", recipeContent);

        // Process all recipe images
        processRecipePhotos(recipe, recipeFolder);
        processAdditionalImages(recipe, recipeFolder);
      }

      // Add the index file to the root of the zip
      zip.file("00-recipe-index.txt", indexContent);

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.setAttribute(
        "download",
        `recipes-export-${new Date().toISOString().split("T")[0]}.zip`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading recipes:", error);
      alert("Failed to download recipes. Please try again.");
    }
  };

  // Helper function to process recipe images
  const processRecipeImage = (
    imageData: unknown,
    imageCounter: number,
    recipeFolder: unknown
  ): { success: boolean } => {
    try {
      let base64Data: string;
      let mimeType: string;

      if (
        typeof imageData === "string" &&
        imageData.startsWith("data:image/")
      ) {
        [mimeType, base64Data] = imageData.split(",");
      } else if (
        typeof imageData === "object" &&
        imageData !== null &&
        "data" in imageData
      ) {
        const objData = imageData as { data: string };
        [mimeType, base64Data] = objData.data.split(",");
      } else {
        return { success: false };
      }

      const extension = getImageExtension(mimeType);
      const fileName = `additional-image-${imageCounter}.${extension}`;

      // Convert base64 to binary and add to recipe folder
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let j = 0; j < binaryData.length; j++) {
        bytes[j] = binaryData.charCodeAt(j);
      }

      if (
        recipeFolder &&
        typeof recipeFolder === "object" &&
        "file" in recipeFolder
      ) {
        (
          recipeFolder as { file: (name: string, data: Uint8Array) => void }
        ).file(fileName, bytes);
      }
      return { success: true };
    } catch (imageError) {
      console.warn(`Failed to process additional image:`, imageError);
      return { success: false };
    }
  };

  // Helper function to build recipe metadata
  const buildRecipeMetadata = (recipe: Record<string, unknown>): string => {
    let content = `Title: ${toSafeString(recipe.title) || "Untitled"}\n`;
    content += `Date Created: ${
      toSafeString(recipe.created) ||
      toSafeString(recipe.dateAdded) ||
      "Unknown date"
    }\n`;
    content += `Author: ${
      toSafeString(recipe.author) ||
      toSafeString(recipe.userName) ||
      toSafeString(recipe.userEmail) ||
      "Anonymous"
    }\n`;
    content += `Public: ${recipe.isPublic || recipe.public ? "Yes" : "No"}\n`;
    content += `Shared with Family: ${recipe.shared_family ? "Yes" : "No"}\n`;

    if (recipe.type) content += `Type: ${toSafeString(recipe.type)}\n`;
    if (recipe.category)
      content += `Category: ${toSafeString(recipe.category)}\n`;
    if (recipe.source) content += `Source: ${toSafeString(recipe.source)}\n`;
    if (recipe.sourceTitle)
      content += `Source Title: ${toSafeString(recipe.sourceTitle)}\n`;
    if (recipe.prepTime)
      content += `Prep Time: ${toSafeString(recipe.prepTime)} minutes\n`;
    if (recipe.cookTime)
      content += `Cook Time: ${toSafeString(recipe.cookTime)} minutes\n`;
    if (recipe.servings)
      content += `Servings: ${toSafeString(recipe.servings)}\n`;
    if (recipe.recommendedPellets)
      content += `Recommended Pellets: ${toSafeString(
        recipe.recommendedPellets
      )}\n`;

    return content;
  };

  // Helper function to build recipe ingredients section
  const buildIngredientsSection = (recipe: Record<string, unknown>): string => {
    let content = "\nIngredients:\n";

    // Debug logging to see what's in the recipe object
    console.log("Recipe object keys:", Object.keys(recipe));
    console.log("Recipe.ingredients:", recipe.ingredients);
    console.log("Recipe.ingredients type:", typeof recipe.ingredients);
    console.log(
      "Recipe.ingredients isArray:",
      Array.isArray(recipe.ingredients)
    );

    // Try multiple possible field names for ingredients
    const possibleIngredients =
      recipe.ingredients ||
      recipe.ingredient_list ||
      recipe.ingredientList ||
      recipe.components;

    if (possibleIngredients) {
      if (Array.isArray(possibleIngredients)) {
        console.log("Ingredients array length:", possibleIngredients.length);
        if (possibleIngredients.length > 0) {
          possibleIngredients.forEach((ingredient: unknown, idx: number) => {
            console.log(`Ingredient ${idx}:`, ingredient);

            // Check if ingredient is an object with name, amount, unit properties
            if (typeof ingredient === "object" && ingredient !== null) {
              const ing = ingredient as {
                name?: string;
                amount?: number;
                unit?: string;
              };
              if (ing.name) {
                let ingredientText = ing.name;
                if (ing.amount && ing.unit) {
                  ingredientText = `${ing.amount} ${ing.unit} ${ing.name}`;
                } else if (ing.amount) {
                  ingredientText = `${ing.amount} ${ing.name}`;
                }
                content += `${idx + 1}. ${ingredientText}\n`;
              }
            } else {
              // Handle simple string ingredients
              const ingredientText = toSafeString(ingredient);
              if (ingredientText.trim()) {
                content += `${idx + 1}. ${ingredientText}\n`;
              }
            }
          });
        } else {
          content += "No ingredients listed\n";
        }
      } else if (typeof possibleIngredients === "string") {
        // If ingredients is a string, split by newlines or semicolons
        const ingredientLines = possibleIngredients
          .split(/[\n;]/)
          .filter((line) => line.trim());
        if (ingredientLines.length > 0) {
          ingredientLines.forEach((ingredient, idx) => {
            content += `${idx + 1}. ${ingredient.trim()}\n`;
          });
        } else {
          content += toSafeString(possibleIngredients) + "\n";
        }
      } else {
        content += toSafeString(possibleIngredients) + "\n";
      }
    } else {
      content += "No ingredients listed\n";
    }

    return content;
  };

  // Helper function to build recipe instructions section
  const buildInstructionsSection = (
    recipe: Record<string, unknown>
  ): string => {
    let content = "\nInstructions:\n";

    // Debug logging
    console.log("Recipe.steps:", recipe.steps);
    console.log("Recipe.instructions:", recipe.instructions);
    console.log("Recipe.steps type:", typeof recipe.steps);
    console.log("Recipe.steps isArray:", Array.isArray(recipe.steps));

    // Try multiple possible field names for instructions
    const possibleInstructions =
      recipe.instructions ||
      recipe.steps ||
      recipe.directions ||
      recipe.method ||
      recipe.preparation;

    if (possibleInstructions) {
      if (Array.isArray(possibleInstructions)) {
        console.log("Instructions array length:", possibleInstructions.length);
        if (possibleInstructions.length > 0) {
          possibleInstructions.forEach((instruction: unknown, idx: number) => {
            console.log(`Instruction ${idx}:`, instruction);

            // Check if instruction is an object with step property
            if (typeof instruction === "object" && instruction !== null) {
              const inst = instruction as {
                step?: string;
                superSmoke?: boolean;
              };
              if (inst.step) {
                content += `${idx + 1}. ${inst.step}\n`;
                if (inst.superSmoke) {
                  content += `   (Note: Super Smoke enabled)\n`;
                }
              }
            } else {
              // Handle simple string instructions
              const instructionText = toSafeString(instruction);
              if (instructionText.trim()) {
                content += `${idx + 1}. ${instructionText}\n`;
              }
            }
          });
        } else {
          content += "No instructions provided\n";
        }
      } else if (typeof possibleInstructions === "string") {
        // If instructions is a string, split by newlines or numbered steps
        const instructionLines = possibleInstructions
          .split(/\n|\d+\./)
          .filter((line) => line.trim());
        if (instructionLines.length > 0) {
          instructionLines.forEach((instruction, idx) => {
            const cleaned = instruction.trim();
            if (cleaned) {
              content += `${idx + 1}. ${cleaned}\n`;
            }
          });
        } else {
          content += toSafeString(possibleInstructions) + "\n";
        }
      } else {
        content += toSafeString(possibleInstructions) + "\n";
      }
    } else {
      content += "No instructions provided\n";
    }

    return content;
  };

  // Helper function to build recipe notes and images section
  const buildNotesAndImagesSection = (
    recipe: Record<string, unknown>
  ): string => {
    let content = "";

    // Add personal notes if available
    const notes = recipe.notes || recipe.myNotes || recipe.personalNotes;
    if (notes) {
      content += "\nNotes:\n";
      content += toSafeString(notes) + "\n";
    }

    // Add image references
    content += "\nImages in this folder:\n";
    if (recipe.photo) content += "- recipe-photo.[jpg/png/gif]\n";
    if (recipe.familyPhoto) content += "- family-photo.[jpg/png/gif]\n";
    if (
      recipe.images &&
      Array.isArray(recipe.images) &&
      recipe.images.length > 0
    ) {
      for (let i = 1; i <= recipe.images.length; i++) {
        content += `- additional-image-${i}.[jpg/png/gif]\n`;
      }
    }

    return content;
  };

  // Helper function to build recipe ingredients and instructions
  const buildRecipeDetails = (recipe: Record<string, unknown>): string => {
    let content = "\nDescription:\n";
    content += toSafeString(recipe.description) || "No description";
    content += "\n";

    content += buildIngredientsSection(recipe);
    content += buildInstructionsSection(recipe);
    content += buildNotesAndImagesSection(recipe);

    return content;
  };

  // Helper function to build recipe content
  const buildRecipeContent = (
    recipe: Record<string, unknown>,
    index: number
  ): string => {
    let content = `Recipe ${index + 1}\n`;
    content += `-`.repeat(50) + "\n";
    content += buildRecipeMetadata(recipe);
    content += buildRecipeDetails(recipe);
    return content;
  };

  const handleAddPerson = async (user: SearchUser) => {
    console.log("=== HANDLE ADD PERSON DEBUG ===");
    console.log("handleAddPerson called with user:", {
      person_id: user.person_id,
      name: user.name,
      email: user.email,
      relationship: user.relationship,
      network: user.network,
    });
    console.log("Logged in user email:", userEmail);

    // Debug: Log current family info to understand what's already there
    if (familyInfo?.json?.people) {
      console.log("Current family members:");
      familyInfo.json.people.forEach((person, index: number) => {
        console.log(
          `  ${index}: ${person.name} (${person.email}) - ${person.relation}`
        );
      });

      // Check if this person is already in the family
      const existingMember = familyInfo.json.people.find(
        (person) =>
          person.email?.trim().toLowerCase() ===
          user.email?.trim().toLowerCase()
      );
      if (existingMember) {
        console.log(
          "Frontend check: User already exists in family:",
          existingMember
        );
      }
    }

    if (!userEmail) {
      console.error("Missing user email");
      return;
    }

    if (!user.relationship) {
      console.error("Please select a relationship");
      return;
    }

    if (!user.network) {
      console.error("Please select a network");
      return;
    }

    try {
      const requestPayload = {
        userId: user.person_id,
        userEmail: userEmail,
        relationship: user.relationship,
        network: user.network,
      };

      console.log("Sending API request with payload:", requestPayload);

      const response = await fetch("/api/add-family-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
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

  const handleDeletePerson = (person: { person_id: string; name: string }) => {
    setPersonToDelete(person);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!personToDelete || !userEmail) {
      console.error("Missing person to delete or user email");
      return;
    }

    try {
      console.log("=== DELETE FAMILY MEMBER ===");
      console.log("Deleting person:", personToDelete);
      console.log("Logged in user email:", userEmail);

      const response = await fetch("/api/remove-family-member", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personIdToRemove: personToDelete.person_id,
          userEmail: userEmail,
        }),
      });

      const data = await response.json();
      console.log("Delete API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove family member");
      }

      // Close dialog and reset state
      setDeleteConfirmOpen(false);
      setPersonToDelete(null);

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
      console.error("Error removing family member:", error);
      // Close dialog even on error
      setDeleteConfirmOpen(false);
      setPersonToDelete(null);
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

  // Function to fetch counts for a specific family member
  async function fetchPersonCounts(personEmail: string) {
    try {
      const [rollRes, fieldRes, recipeRes] = await Promise.all([
        fetch(
          `/api/rollnwrite?userEmail=${encodeURIComponent(
            personEmail
          )}&family=true`
        ),
        fetch(
          `/api/fieldnotes?userEmail=${encodeURIComponent(
            personEmail
          )}&family=true`
        ),
        fetch(
          `/api/recipes?userEmail=${encodeURIComponent(
            personEmail
          )}&family=true`
        ),
      ]);

      const [rollData, fieldData, recipeData] = await Promise.all([
        rollRes.json(),
        fieldRes.json(),
        recipeRes.json(),
      ]);

      const rollEntries = Array.isArray(rollData) ? rollData : [];
      const fieldEntries = Array.isArray(fieldData) ? fieldData : [];
      const recipeEntries = Array.isArray(recipeData) ? recipeData : [];

      return {
        rollAndWrite: rollEntries.filter(
          (entry) => entry.shared_family && entry.userEmail === personEmail
        ).length,
        fieldNotes: fieldEntries.filter(
          (entry) => entry.shared_family && entry.userEmail === personEmail
        ).length,
        recipes: recipeEntries.filter(
          (entry) => entry.shared_family && entry.userEmail === personEmail
        ).length,
      };
    } catch (error) {
      console.error(`Error fetching counts for ${personEmail}:`, error);
      return { rollAndWrite: 0, fieldNotes: 0, recipes: 0 };
    }
  }

  React.useEffect(() => {
    async function fetchCounts() {
      setLoading(true);
      // Fetch all API data in parallel
      const [rollRes, fieldRes, recipeRes, jobsRes] = await Promise.all([
        fetch(`/api/rollnwrite?userEmail=${encodeURIComponent(userEmail)}`),
        fetch(`/api/fieldnotes?userEmail=${encodeURIComponent(userEmail)}`),
        fetch(`/api/recipes?userEmail=${encodeURIComponent(userEmail)}`),
        fetch(`/api/jobs?userEmail=${encodeURIComponent(userEmail)}`),
      ]);
      const [rollRaw, fieldRaw, recipeRaw, jobsRaw] = await Promise.all([
        rollRes.json(),
        fieldRes.json(),
        recipeRes.json(),
        jobsRes.json(),
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
        total: recipeEntries.filter((e) => e.userEmail === userEmail).length,
        public: recipeEntries.filter(
          (e) => e.userEmail === userEmail && e.isPublic
        ).length,
        sharedWithFamily: recipeEntries.filter(
          (e) => e.userEmail === userEmail && e.shared_family
        ).length,
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

      // Process jobs data - now expects {jobs: [], stats: {}} format
      const jobsData = jobsRaw || {};
      const jobsStats = jobsData.stats || {
        total: 0,
        applied: 0,
        hasActiveSearch: false,
      };

      console.log("Jobs response:", {
        jobsRaw,
        jobsData,
        jobsStats,
      });

      setJobCounts({
        total: jobsStats.total,
        applied: jobsStats.applied,
        hasActiveSearch: jobsStats.hasActiveSearch,
      });

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

  // Separate useEffect to fetch family member counts when familyInfo changes
  React.useEffect(() => {
    async function fetchFamilyMemberCounts() {
      if (familyInfo?.json?.people) {
        const personCountsData: {
          [personId: string]: {
            rollAndWrite: number;
            fieldNotes: number;
            recipes: number;
          };
        } = {};

        for (const person of familyInfo.json.people) {
          if (person.email && person.email !== userEmail) {
            const counts = await fetchPersonCounts(person.email);
            personCountsData[person.person_id] = counts;
          }
        }

        setPersonCounts(personCountsData);
      }
    }

    fetchFamilyMemberCounts();
  }, [familyInfo, userEmail]);

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
        {/* Roll And Write Card */}
        <div className="relative flex flex-col items-center justify-center bg-blue-50 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer min-h-[140px]">
          <div className="absolute top-2 right-2">
            <SimCardDownloadIcon
              fontSize="small"
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                handleRollAndWriteDownload();
              }}
            />
          </div>
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
        {/* Field Notes Card */}
        <div className="relative flex flex-col items-center justify-center bg-blue-50 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer min-h-[140px]">
          <div className="absolute top-2 right-2">
            <SimCardDownloadIcon
              fontSize="small"
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                handleFieldNotesDownload();
              }}
            />
          </div>
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
        {/* Recipes Card */}
        <div className="relative flex flex-col items-center justify-center bg-blue-50 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer min-h-[140px]">
          <div className="absolute top-2 right-2">
            <SimCardDownloadIcon
              fontSize="small"
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                handleRecipesDownload();
              }}
            />
          </div>
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
        {/* Brew Day Log Card */}
        <div className="relative flex flex-col items-center justify-center bg-blue-50  p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer min-h-[140px]">
          <div className="absolute top-2 right-2">
            <SimCardDownloadIcon
              fontSize="small"
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                // Get brew sessions from local storage
                const storedSessions = localStorage.getItem("brewSessions");
                if (!storedSessions) {
                  alert("No brew logs found to download.");
                  return;
                }

                try {
                  const brewSessions = JSON.parse(storedSessions);
                  if (
                    !Array.isArray(brewSessions) ||
                    brewSessions.length === 0
                  ) {
                    alert("No brew logs found to download.");
                    return;
                  }

                  // Create text content
                  let textContent = "BREW DAY LOGS\n\n";

                  brewSessions.forEach((session: BrewSession) => {
                    textContent += `=== ${session.name} - ${session.date} ===\n\n`;

                    // Add brew data
                    textContent += "Brew Details:\n";
                    Object.entries(session.brewData).forEach(([key, value]) => {
                      textContent += `${key}: ${value}\n`;
                    });

                    // Add log entries
                    textContent += "\nLog Entries:\n";
                    session.logEntries.forEach((entry: LogEntry) => {
                      textContent += `[${entry.timestamp}] ${entry.text}\n`;
                    });

                    textContent += "\n-------------------\n\n";
                  });

                  // Create and download the file
                  const blob = new Blob([textContent], { type: "text/plain" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "brew-day-logs.txt";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error("Error downloading brew logs:", error);
                  alert(
                    "There was an error downloading the brew logs. Please try again."
                  );
                }
              }}
            />
          </div>
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
          <p className="leading-[1.0]">
            <span className="text-[10px]">
              *Stored in local storage and may not appear on all devices. Click
              the export icon above to download.
            </span>
          </p>
        </div>

        {/* Job Search Card - Only show if there is an active job search */}
        {jobCounts.hasActiveSearch && (
          <div className="relative flex flex-col items-center justify-center bg-blue-50 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer min-h-[140px]">
            <div className="absolute top-2 right-2">
              <SimCardDownloadIcon fontSize="small" className="text-gray-400" />
            </div>
            <WorkIcon fontSize="large" className="mb-2 text-gray-700" />
            <Link
              href="/jobs"
              className="font-semibold text-black hover:underline text-lg mb-2"
            >
              Job Search
            </Link>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-black">
                <span className="font-bold text-lg">{jobCounts.total}</span>{" "}
                Opportunities
              </span>
              <span className="flex items-center gap-1 text-xs text-black">
                <span className="font-bold text-lg">{jobCounts.applied}</span>{" "}
                Applied
              </span>
            </div>
          </div>
        )}
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
                          value={user.relationship || ""}
                          onChange={(e) => {
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
                          value={user.network || ""}
                          onChange={(e) => {
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
                          disabled={!user.relationship || !user.network}
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
              <div className="flex flex-col sm:flex-row sm:items-center bg-gray-50 rounded-lg p-4 w-full cursor-pointer transition-transform duration-200 hover:scale-105">
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
                    {rollCounts.sharedWithFamily > 0 ? (
                      <Link href="/rollandwrite?family=true">
                        <CasinoIcon
                          fontSize="medium"
                          style={{ color: "#757575", cursor: "pointer" }}
                        />
                      </Link>
                    ) : (
                      <CasinoIcon
                        fontSize="medium"
                        style={{ color: "#757575" }}
                      />
                    )}
                    {/* Badge shown only when there are shared items */}
                    {rollCounts.sharedWithFamily > 0 && (
                      <span
                        className="absolute -top-2 -right-2"
                        style={{
                          background: "#1B5E20",
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
                    {fieldCounts.sharedWithFamily > 0 ? (
                      <Link href="/fieldnotes?family=true">
                        <StickyNote2Icon
                          fontSize="medium"
                          style={{ color: "#757575", cursor: "pointer" }}
                        />
                      </Link>
                    ) : (
                      <StickyNote2Icon
                        fontSize="medium"
                        style={{ color: "#757575" }}
                      />
                    )}
                    {/* Badge shown only when there are shared items */}
                    {fieldCounts.sharedWithFamily > 0 && (
                      <span
                        className="absolute -top-2 -right-2"
                        style={{
                          background: "#1B5E20",
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
                    {/* Badge shown only when there are shared items */}
                    {recipeCounts.sharedWithFamily > 0 && (
                      <span
                        className="absolute -top-2 -right-2"
                        style={{
                          background: "#1B5E20",
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
                // Get real counts from API data instead of hardcoded shared_data
                const realCounts = personCounts[person.person_id] || {
                  rollAndWrite: 0,
                  fieldNotes: 0,
                  recipes: 0,
                };
                return (
                  <div
                    key={person.person_id}
                    className="bg-gray-50 rounded-lg p-4 w-full cursor-pointer transition-transform duration-200 hover:scale-105"
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
                            {/* <Link
                              href={`/person/${person.person_id}`}
                              className="hover:text-blue-600 transition-colors cursor-pointer"
                            > */}
                            {person.name}
                            {/* </Link> */}
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
                          {realCounts.rollAndWrite > 0 ? (
                            <Link
                              href={`/rollandwrite?family=true&familyMember=${encodeURIComponent(
                                person.name
                              )}`}
                            >
                              <CasinoIcon
                                fontSize="medium"
                                style={{ color: "#757575", cursor: "pointer" }}
                              />
                            </Link>
                          ) : (
                            <CasinoIcon
                              fontSize="medium"
                              style={{ color: "#757575" }}
                            />
                          )}
                          {realCounts.rollAndWrite > 0 && (
                            <span
                              className="absolute -top-2 -right-2"
                              style={{
                                background: "#1B5E20",
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
                              {realCounts.rollAndWrite}
                            </span>
                          )}
                        </div>
                        <div className="relative flex items-center">
                          {realCounts.fieldNotes > 0 ? (
                            <Link
                              href={`/fieldnotes?family=true&familyMember=${encodeURIComponent(
                                person.name
                              )}`}
                            >
                              <StickyNote2Icon
                                fontSize="medium"
                                style={{ color: "#757575", cursor: "pointer" }}
                              />
                            </Link>
                          ) : (
                            <StickyNote2Icon
                              fontSize="medium"
                              style={{ color: "#757575" }}
                            />
                          )}
                          {realCounts.fieldNotes > 0 && (
                            <span
                              className="absolute -top-2 -right-2"
                              style={{
                                background: "#1B5E20",
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
                              {realCounts.fieldNotes}
                            </span>
                          )}
                        </div>
                        <div className="relative flex items-center">
                          {realCounts.recipes > 0 ? (
                            <Link
                              href={`/recipes?family=true&familyMember=${encodeURIComponent(
                                person.name
                              )}`}
                            >
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
                          {realCounts.recipes > 0 && (
                            <span
                              className="absolute -top-2 -right-2"
                              style={{
                                background: "#1B5E20",
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
                              {realCounts.recipes}
                            </span>
                          )}
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

                              {/* Delete icon - only visible when editing */}
                              <div
                                className="flex items-center ml-2"
                                title={`Remove ${person.name} from family`}
                              >
                                <DeleteIcon
                                  fontSize="medium"
                                  style={{
                                    color: "#9ca3af",
                                    cursor: "pointer",
                                  }}
                                  className="hover:text-gray-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePerson({
                                      person_id: person.person_id,
                                      name: person.name,
                                    });
                                  }}
                                />
                              </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setPersonToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remove Family Member</DialogTitle>
        <DialogContent>
          {personToDelete && (
            <p>
              Are you sure you want to remove{" "}
              <strong>{personToDelete.name}</strong> from your family? This will
              remove the relationship in both directions and cannot be undone.
            </p>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setPersonToDelete(null);
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
