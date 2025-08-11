"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import {
  ArrowBack as ArrowBackIcon,
  Casino as CasinoIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  FileDownload as FileDownloadIcon,
  Apps as AppsIcon,
  EditNote as EditNoteIcon,
  Assignment as LogIcon,
  MenuBook as FieldNotesIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Button, TextField } from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";

interface Entry {
  id: string;
  content: string;
  dice1: number;
  dice2: number;
  createdAt: string;
}

const RollAndWrite: React.FC = () => {
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  // Apps menu configuration
  const apps = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Md Editor", path: "/markdown", icon: EditNoteIcon },
    { name: "Brew Log", path: "/brewday", icon: LogIcon },
    { name: "Field Notes", path: "/fieldnotes", icon: FieldNotesIcon },
    { name: "jM Galleries", path: "/jmgalleries", icon: PhotoCameraIcon },
    { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
  ];

  // Handle app selection from menu
  const handleAppSelect = (path: string) => {
    router.push(path);
    setIsAppsMenuOpen(false);
  };

  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentDice1, setCurrentDice1] = useState<number>(0);
  const [currentDice2, setCurrentDice2] = useState<number>(0);
  const [isRolling, setIsRolling] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [colorsSwapped, setColorsSwapped] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [showBackupWarning, setShowBackupWarning] = useState(false);

  // Check if it's been more than a week since last export
  const checkBackupStatus = useCallback(() => {
    try {
      const lastExportDate = localStorage.getItem("rollAndWriteLastExport");
      if (!lastExportDate) {
        // If never exported and there are entries, show warning
        setShowBackupWarning(entries.length > 0);
        return;
      }

      const lastExport = new Date(lastExportDate);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      setShowBackupWarning(lastExport < oneWeekAgo && entries.length > 0);
    } catch (error) {
      console.log("Failed to check backup status:", error);
      setShowBackupWarning(false);
    }
  }, [entries]);

  // Load entries from localStorage on component mount
  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem("rollAndWriteEntries");
      if (savedEntries) {
        const parsedEntries: Entry[] = JSON.parse(savedEntries);
        setEntries(parsedEntries);
      }
      setHasLoadedFromStorage(true);
    } catch (error) {
      console.log("Failed to load entries:", error);
      setHasLoadedFromStorage(true);
    }
  }, []);

  // Save entries to localStorage whenever entries change (but only after initial load)
  useEffect(() => {
    if (!hasLoadedFromStorage) return;

    try {
      localStorage.setItem("rollAndWriteEntries", JSON.stringify(entries));
    } catch (error) {
      console.log("Failed to save entries:", error);
    }
  }, [entries, hasLoadedFromStorage]);

  // Check backup status when entries change
  useEffect(() => {
    if (hasLoadedFromStorage) {
      checkBackupStatus();
    }
  }, [entries, hasLoadedFromStorage, checkBackupStatus]);

  const rollDice = () => {
    setIsRolling(true);
    setJustSaved(false);
    setSelectedEntry(null);

    let rollCount = 0;
    const maxRolls = 30; // About 3 seconds at 100ms intervals

    const rollInterval = setInterval(() => {
      setCurrentDice1(Math.floor(Math.random() * 8) + 1);
      setCurrentDice2(Math.floor(Math.random() * 8) + 1);
      rollCount++;

      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        setIsRolling(false);
        setShowForm(true);
      }
    }, 100);
  };

  const saveEntry = () => {
    if (!content.trim()) {
      alert("Please enter content for your story.");
      return;
    }

    // Truncate content to maximum allowed words
    const words = content.trim().split(/\s+/);
    const maxWords = getMaxWords();
    const truncatedWords = words.slice(0, maxWords);
    const truncatedContent = truncatedWords.join(" ");

    const newEntry: Entry = {
      id: Date.now().toString(),
      content: truncatedContent,
      dice1: currentDice1,
      dice2: currentDice2,
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setContent("");
    setShowForm(false);
    setJustSaved(true);
  };

  const rollAgain = () => {
    setJustSaved(false);
    rollDice();
  };

  const deleteEntry = (id: string) => {
    if (confirm("Delete this entry?")) {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      if (selectedEntry === id) {
        setSelectedEntry(null);
      }
    }
  };

  const selectEntry = (id: string) => {
    setSelectedEntry(selectedEntry === id ? null : id);

    // On mobile, hide sidebar when selecting an entry
    if (selectedEntry !== id && window.innerWidth < 640) {
      // 640px is sm breakpoint
      setIsSidebarOpen(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const getWordCountColor = (text: string) => {
    const remaining = getRemainingWords(text);
    if (remaining < 0) return "text-red-500";
    if (remaining <= 5) return "text-red-500";
    return "text-gray-700";
  };

  const getWordCountDisplayText = (text: string) => {
    const remaining = getRemainingWords(text);
    if (remaining < 0) {
      return `${Math.abs(remaining)} words over limit`;
    }
    if (remaining === 0) {
      return "OUT OF WORDS";
    }
    return `${remaining} words remaining`;
  };

  const renderTextWithOverflow = (text: string) => {
    const words = text.trim().split(/\s+/);
    const maxWords = getMaxWords();

    if (words.length <= maxWords || !text.trim()) {
      return text;
    }

    const allowedWords = words.slice(0, maxWords);
    const excessWords = words.slice(maxWords);

    return (
      <>
        {allowedWords.join(" ")}
        {excessWords.length > 0 && (
          <span style={{ color: "red" }}>{" " + excessWords.join(" ")}</span>
        )}
      </>
    );
  };

  const exportToPDF = () => {
    if (entries.length === 0) {
      alert("No entries to export!");
      return;
    }

    const doc = new jsPDF();

    // Set title
    doc.setFontSize(18);
    doc.text("Roll And Write Entries", 20, 20);

    let yPosition = 40;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 5;

    entries.forEach((entry, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Add entry header
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const dateStr = new Date(parseInt(entry.id)).toLocaleDateString();
      doc.text(`Entry ${index + 1} - ${dateStr}`, margin, yPosition);
      yPosition += lineHeight + 3;

      // Add content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      // Split content into lines that fit the page width
      const splitContent = doc.splitTextToSize(entry.content, 170);

      splitContent.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      yPosition += 10; // Extra space between entries
    });

    // Save the PDF
    const fileName = `roll-and-write-entries-${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    // Record the export date
    try {
      localStorage.setItem("rollAndWriteLastExport", new Date().toISOString());
      setShowBackupWarning(false);
    } catch (error) {
      console.log("Failed to save export date:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex flex-1">
        {/* Header */}
        <div className="flex flex-col w-full">
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
                          <span className="text-sm font-medium">
                            {app.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="h-4 w-px bg-gray-300" />

            {/* Desktop Sidebar Toggle - Only visible on desktop */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden sm:flex px-3 py-1 rounded text-sm font-medium transition-colors items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
              title={isSidebarOpen ? "Hide Entries" : "Show Entries"}
            >
              <MenuIcon sx={{ fontSize: 16 }} />
              Entries ({entries.length})
            </button>

            <div className="h-4 w-px bg-gray-300" />

            <h3 className="text-lg font-semibold text-gray-800">
              Roll And Write
            </h3>
          </div>

          {/* Mobile Entries Toggle - Only visible on mobile */}
          <div className="sm:hidden px-3 py-2 border-b border-gray-200">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
              title={isSidebarOpen ? "Hide Entries" : "Show Entries"}
            >
              <MenuIcon sx={{ fontSize: 16 }} />
              Entries ({entries.length})
            </button>
          </div>

          <div className="flex flex-1">
            {/* Sidebar */}
            {isSidebarOpen && (
              <div className="w-4/5 sm:w-64 sm:border-r border-gray-200 bg-gray-50 flex flex-col sm:relative absolute sm:z-auto z-50 h-full">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center">
                    {entries.length > 0 && (
                      <button
                        onClick={exportToPDF}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        title="Export to PDF"
                      >
                        <FileDownloadIcon sx={{ fontSize: 16 }} />
                        Export
                      </button>
                    )}
                    {/* Close button - only visible on mobile */}
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="sm:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors ml-auto"
                      title="Close entries"
                    >
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </button>
                  </div>
                  {showBackupWarning && (
                    <div className="text-xs text-red-600 mt-2 text-center font-medium">
                      It&apos;s Been A Week, Back Up Now
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-200">
                  {entries.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      No entries yet.
                      <br />
                      Roll the dice to get started!
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`w-full p-3 hover:bg-gray-100 transition-colors cursor-pointer ${
                            selectedEntry === entry.id
                              ? "bg-blue-50 border-l-4 border-l-blue-500"
                              : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <button
                              className="flex-1 min-w-0 text-left p-0 bg-transparent border-none cursor-pointer"
                              onClick={() => selectEntry(entry.id)}
                            >
                              <h5 className="text-sm font-medium text-gray-900 truncate">
                                {formatDate(entry.createdAt)}
                              </h5>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-3">
                                {entry.content.trim().split(/\s+/).length > 5
                                  ? entry.content
                                      .trim()
                                      .split(/\s+/)
                                      .slice(0, 5)
                                      .join(" ") + "..."
                                  : entry.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                Roll: {entry.dice1}, {entry.dice2}
                              </p>
                            </button>
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 p-6 flex flex-col justify-center min-h-0">
              {/* Selected Entry Display */}
              {selectedEntry && (
                <div className="flex items-center justify-center h-full">
                  {(() => {
                    const entry = entries.find((e) => e.id === selectedEntry);
                    if (!entry) return null;

                    return (
                      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-2xl w-full mx-4">
                        <div className="mb-6">
                          <h3 className="text-2xl font-bold text-gray-900">
                            {formatDate(entry.createdAt)}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Your roll was a {entry.dice1} and a {entry.dice2}{" "}
                            giving you {getWordCount(entry.content)} words
                          </p>
                        </div>
                        <div className="prose max-w-none">
                          <p className="text-gray-700 whitespace-pre-wrap text-lg leading-tight">
                            {entry.content}
                          </p>
                        </div>
                        {justSaved && (
                          <div className="mt-6 text-center">
                            <Button
                              variant="contained"
                              size="large"
                              startIcon={<CasinoIcon />}
                              onClick={rollAgain}
                              sx={{
                                backgroundColor: "#1976d2",
                                "&:hover": { backgroundColor: "#115293" },
                                textTransform: "none",
                                fontSize: "1rem",
                                padding: "12px 24px",
                              }}
                            >
                              Roll Again
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {!showForm && !justSaved && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Ready to Roll?
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Roll two 8-sided dice to get your creative prompt numbers!
                    </p>
                  </div>

                  {(currentDice1 > 0 || currentDice2 > 0) && (
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`w-40 h-40 text-white text-6xl font-bold flex items-center justify-center shadow-lg ${
                          isRolling ? "animate-bounce" : ""
                        }`}
                        style={{
                          background:
                            "linear-gradient(135deg, #AB3D27 0%, #ffffff 100%)",
                          clipPath:
                            "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                        }}
                      >
                        {currentDice1}
                      </div>
                      <div
                        className={`w-40 h-40 text-white text-6xl font-bold flex items-center justify-center shadow-lg ${
                          isRolling ? "animate-bounce" : ""
                        }`}
                        style={{
                          background:
                            "linear-gradient(135deg, #486F8A 0%, #000000 100%)",
                          clipPath:
                            "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                        }}
                      >
                        {currentDice2}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CasinoIcon />}
                    onClick={rollDice}
                    disabled={isRolling}
                    sx={{
                      backgroundColor: "#1976d2",
                      "&:hover": { backgroundColor: "#115293" },
                      textTransform: "none",
                      fontSize: "1.1rem",
                      px: 4,
                      py: 2,
                    }}
                  >
                    {isRolling ? "Rolling..." : "Roll"}
                  </Button>
                </div>
              )}

              {showForm && (
                <div className="max-w-2xl mx-auto p-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Your Roll
                    </h2>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div
                        className={`w-32 h-32 text-white text-4xl font-bold flex items-center justify-center shadow-lg transition-transform duration-300 ${
                          isSwapping ? "animate-pulse scale-110" : ""
                        }`}
                        style={{
                          background: colorsSwapped
                            ? "linear-gradient(135deg, #486F8A 0%, #000000 100%)"
                            : "linear-gradient(135deg, #AB3D27 0%, #ffffff 100%)",
                          clipPath:
                            "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                        }}
                      >
                        {currentDice1}
                      </div>
                      <div
                        className={`w-32 h-32 text-white text-4xl font-bold flex items-center justify-center shadow-lg transition-transform duration-300 ${
                          isSwapping ? "animate-pulse scale-110" : ""
                        }`}
                        style={{
                          background: colorsSwapped
                            ? "linear-gradient(135deg, #AB3D27 0%, #ffffff 100%)"
                            : "linear-gradient(135deg, #486F8A 0%, #000000 100%)",
                          clipPath:
                            "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                        }}
                      >
                        {currentDice2}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">
                      Use these numbers as inspiration for your creative
                      writing!
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={swapDice}
                        disabled={isSwapping}
                        className="text-blue-500 hover:text-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSwapping ? "Swapping..." : "Swap Dice"}
                      </button>
                      <span className="text-gray-400">|</span>
                      <button
                        onClick={rollDice}
                        className="text-blue-500 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                      >
                        Roll Again
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <TextField
                        label="Roll And Write ..."
                        value={content}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          const currentRemaining = getRemainingWords(content);
                          const newRemaining = getRemainingWords(newValue);

                          // Allow the change if:
                          // 1. We have remaining words, OR
                          // 2. The new text has fewer or equal words (deletion/editing), OR
                          // 3. We're not adding new words (same word count)
                          if (
                            currentRemaining > 0 ||
                            newRemaining >= currentRemaining
                          ) {
                            setContent(newValue);
                          }
                        }}
                        multiline
                        rows={12}
                        fullWidth
                        variant="outlined"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontSize: "1rem",
                            lineHeight: "1.5",
                            "& fieldset": {
                              borderColor: "#d1d5db",
                            },
                            "&:hover fieldset": {
                              borderColor: "#d1d5db",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#d1d5db",
                              borderWidth: "1px",
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: "#6b7280",
                            backgroundColor: "white",
                            paddingLeft: "4px",
                            paddingRight: "4px",
                            "&.Mui-focused": {
                              color: "#6b7280",
                            },
                          },
                        }}
                      />
                    </div>

                    {content.trim() && getRemainingWords(content) < 0 && (
                      <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="text-sm font-medium text-red-800 mb-2">
                          Preview with overflow highlighted:
                        </div>
                        <div className="text-sm text-gray-700">
                          {renderTextWithOverflow(content)}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-3">
                      <div className="text-center sm:text-left">
                        <span
                          className={`text-4xl font-bold ${getWordCountColor(
                            content
                          )}`}
                        >
                          {getWordCountDisplayText(content)}
                        </span>
                      </div>

                      <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
                        <Button
                          variant="contained"
                          onClick={saveEntry}
                          sx={{
                            height: "48px",
                            minWidth: { xs: "100%", sm: "120px" },
                            width: { xs: "100%", sm: "auto" },
                            backgroundColor: "#1976d2",
                            "&:hover": { backgroundColor: "#115293" },
                            textTransform: "none",
                          }}
                          startIcon={<SaveIcon />}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {justSaved && !selectedEntry && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckIcon sx={{ fontSize: 32 }} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Thank you for your creativity!
                    </h2>
                    <p className="text-gray-600 ">
                      Your story has been saved successfully.
                    </p>
                  </div>

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CasinoIcon />}
                    onClick={rollAgain}
                    sx={{
                      backgroundColor: "#1976d2",
                      "&:hover": { backgroundColor: "#115293" },
                      textTransform: "none",
                      fontSize: "1.1rem",
                      px: 4,
                      py: 2,
                    }}
                  >
                    Roll Again
                  </Button>
                </div>
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

export default RollAndWrite;
