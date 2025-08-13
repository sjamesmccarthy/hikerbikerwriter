"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowBack as ArrowBackIcon,
  Casino as CasinoIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Apps as AppsIcon,
  EditNote as EditNoteIcon,
  Assignment as LogIcon,
  MenuBook as FieldNotesIcon,
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
import { Button, TextField, FormControlLabel, Switch } from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";
import { useSession, signIn, signOut } from "next-auth/react";

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

const RollAndWrite: React.FC = () => {
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
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

  const [currentDice1, setCurrentDice1] = useState<number>(0);
  const [currentDice2, setCurrentDice2] = useState<number>(0);
  const [isRolling, setIsRolling] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [colorsSwapped, setColorsSwapped] = useState(false);
  const [makePublic, setMakePublic] = useState(false);

  // Add authentication
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  // Auto-roll on page load if autoroll parameter is present
  useEffect(() => {
    const autoroll = searchParams?.get("autoroll");
    if (autoroll === "true" && currentDice1 === 0 && currentDice2 === 0) {
      // Small delay to ensure component is mounted
      setTimeout(() => {
        rollDice();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentDice1, currentDice2]);

  const rollDice = () => {
    if (isRolling) return;

    setIsRolling(true);
    setShowForm(false);
    setContent("");

    // Simulate rolling animation
    const rollInterval = setInterval(() => {
      setCurrentDice1(Math.floor(Math.random() * 8) + 1);
      setCurrentDice2(Math.floor(Math.random() * 8) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(rollInterval);
      const finalDice1 = Math.floor(Math.random() * 8) + 1;
      const finalDice2 = Math.floor(Math.random() * 8) + 1;
      setCurrentDice1(finalDice1);
      setCurrentDice2(finalDice2);
      setIsRolling(false);
      setShowForm(true);
      setColorsSwapped(false);
    }, 1000);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    if (!session) {
      alert("Please sign in to save your stories");
      return;
    }

    const entryData = {
      content: content.trim(),
      dice1: currentDice1,
      dice2: currentDice2,
      is_public: makePublic,
      userEmail: session.user?.email,
      userName: session.user?.name,
    };

    try {
      const response = await fetch("/api/rollnwrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entryData),
      });

      if (response.ok) {
        setJustSaved(true);
        setContent("");
        setShowForm(false);
        setMakePublic(false);

        setTimeout(() => setJustSaved(false), 2000);

        // Navigate to the entries list after saving
        router.push("/rollandwrite");
      } else {
        const errorData = await response.json();
        console.error("Save failed:", errorData);
        alert(`Failed to save entry: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry");
    }
  };

  const swapDice = () => {
    setIsSwapping(true);

    // Add a delay to show the animation
    setTimeout(() => {
      const temp = currentDice1;
      setCurrentDice1(currentDice2);
      setCurrentDice2(temp);
      setColorsSwapped(!colorsSwapped);
      setIsSwapping(false);
    }, 300);
  };

  const getWordCount = (text: string) => {
    if (!text?.trim()) return 0;

    // Split by any whitespace (spaces, tabs, newlines) and filter out empty strings
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    return words.length;
  };

  const getMaxWords = () => {
    return parseInt(`${currentDice1}${currentDice2}`);
  };

  const getRemainingWords = (text: string) => {
    const currentWords = getWordCount(text);
    const maxWords = getMaxWords();
    return maxWords - currentWords;
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const newWordCount = getWordCount(newContent);

    // Only allow the change if it doesn't exceed the word limit
    if (newWordCount <= getMaxWords()) {
      setContent(newContent);
    }
  };

  const getWordCountColor = (text: string) => {
    const remaining = getRemainingWords(text);
    if (remaining < 0) return "text-red-500";
    if (remaining <= 5) return "text-red-500";
    return "text-gray-700";
  };

  const getRemainingCountColor = (text: string) => {
    const maxWords = getMaxWords();
    const currentWords = getWordCount(text);
    const remaining = maxWords - currentWords;
    const percentUsed = (currentWords / maxWords) * 100;

    if (remaining <= 5) return "text-red-500";
    if (percentUsed >= 60) return "text-orange-500";
    return "text-green-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex flex-1">
        {/* Header */}
        <div className="flex flex-col w-full">
          <div className="flex items-center space-x-2 h-[61px] border-b border-gray-200 px-3">
            <Link href="/rollandwrite">
              <button className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer">
                <ArrowBackIcon sx={{ fontSize: 16 }} />
                <span className="hidden sm:inline">Back to Stories</span>
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
              Create Story
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

          <div className="flex flex-1">
            {/* Main Content */}
            <div className="flex-1 p-6 flex flex-col justify-center min-h-0">
              <div className="max-w-md mx-auto w-full">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Roll And Write
                  </h1>
                  <p className="text-gray-600">
                    Roll dice to set your word limit, then write a story!
                  </p>
                </div>

                {/* Dice Display */}
                <div className="flex items-center justify-center gap-6 mb-6">
                  <div
                    className={`relative flex items-center justify-center w-40 h-40 text-4xl font-bold transition-all duration-300 ${
                      isSwapping && !colorsSwapped
                        ? "translate-x-24"
                        : isSwapping && colorsSwapped
                        ? "-translate-x-24"
                        : ""
                    } ${
                      isRolling
                        ? "transform rotate-12 scale-110"
                        : "transform rotate-0 scale-100"
                    }`}
                    style={{
                      background: colorsSwapped
                        ? "linear-gradient(135deg, #000000 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #191970 100%)"
                        : "linear-gradient(135deg, #8B0000 0%, #DC143C 25%, #FF6B6B 50%, #FFB3B3 75%, #FFFFFF 100%)",
                      boxShadow: colorsSwapped
                        ? "0 8px 24px rgba(25, 25, 112, 0.4)"
                        : "0 8px 24px rgba(139, 0, 0, 0.3)",
                      textShadow: colorsSwapped
                        ? "2px 2px 4px rgba(0,0,0,0.9)"
                        : "2px 2px 4px rgba(0,0,0,0.7)",
                      color: "white",
                      clipPath:
                        "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)",
                      borderRadius: "8px",
                    }}
                  >
                    {currentDice1 || <CasinoIcon sx={{ fontSize: 56 }} />}
                  </div>

                  <div
                    className={`relative flex items-center justify-center w-40 h-40 text-4xl font-bold transition-all duration-300 ${
                      isSwapping && !colorsSwapped
                        ? "-translate-x-24"
                        : isSwapping && colorsSwapped
                        ? "translate-x-24"
                        : ""
                    } ${
                      isRolling
                        ? "transform -rotate-12 scale-110"
                        : "transform rotate-0 scale-100"
                    }`}
                    style={{
                      background: colorsSwapped
                        ? "linear-gradient(135deg, #8B0000 0%, #DC143C 25%, #FF6B6B 50%, #FFB3B3 75%, #FFFFFF 100%)"
                        : "linear-gradient(135deg, #000000 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #191970 100%)",
                      boxShadow: colorsSwapped
                        ? "0 8px 24px rgba(139, 0, 0, 0.3)"
                        : "0 8px 24px rgba(25, 25, 112, 0.4)",
                      textShadow: colorsSwapped
                        ? "2px 2px 4px rgba(0,0,0,0.7)"
                        : "2px 2px 4px rgba(0,0,0,0.9)",
                      color: "white",
                      clipPath:
                        "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)",
                      borderRadius: "8px",
                    }}
                  >
                    {currentDice2 || <CasinoIcon sx={{ fontSize: 56 }} />}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                  <Button
                    variant="contained"
                    onClick={rollDice}
                    disabled={isRolling}
                    className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-all"
                  >
                    {isRolling
                      ? "Rolling..."
                      : currentDice1 !== null && currentDice2 !== null
                      ? "Roll Again"
                      : "Roll Dice"}
                  </Button>

                  {currentDice1 !== null && currentDice2 !== null && (
                    <Button
                      variant="outlined"
                      onClick={swapDice}
                      disabled={isSwapping}
                      className="w-1/2 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                    >
                      {isSwapping ? "Swapping..." : "Swap Dice"}
                    </Button>
                  )}
                </div>

                {/* Writing Form */}
                {showForm && (
                  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`text-2xl font-bold ${getRemainingCountColor(
                            content
                          )}`}
                        >
                          {getMaxWords() - getWordCount(content)}
                        </div>
                        <div
                          className={`text-sm font-medium ${getWordCountColor(
                            content
                          )}`}
                        >
                          {getWordCount(content)} / {getMaxWords()} words
                        </div>
                      </div>
                    </div>

                    <TextField
                      multiline
                      rows={6}
                      value={content}
                      onChange={handleContentChange}
                      disabled={!session}
                      placeholder={`Write your story using dice roll ${currentDice1} and ${currentDice2} (max ${getMaxWords()} words)...`}
                      variant="outlined"
                      fullWidth
                      className="mb-4"
                    />

                    {/* Make Public Toggle */}
                    <div className="mb-4">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={makePublic}
                            onChange={(e) => setMakePublic(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Make Public"
                        className="text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={!content.trim() || !session}
                        className={`flex-1 py-2 font-medium rounded-lg transition-all ${
                          !session
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white shadow-md"
                        }`}
                        startIcon={justSaved ? <CheckIcon /> : <SaveIcon />}
                      >
                        {justSaved ? "Saved!" : "Save Story"}
                      </Button>
                    </div>

                    {!session && (
                      <div className="mt-3 text-sm text-gray-500 text-center">
                        Sign in to save your stories
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter()}
    </div>
  );
};

export default RollAndWrite;
