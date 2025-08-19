"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowBack as ArrowBackIcon,
  Calculate as CalculateIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Timer as TimerIcon,
  FileDownload as FileDownloadIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Folder as FolderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Apps as AppsIcon,
  EditNote as EditNoteIcon,
  Casino as RollIcon,
  MenuBook as FieldNotesIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  Home as HomeIcon,
  IntegrationInstructions as DevToolsIcon,
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
  UploadFile as UploadFileIcon,
} from "@mui/icons-material";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";
import jsPDF from "jspdf";
import beerStylesData from "../data/bcjp2021styles.json";
import { renderFooter } from "./shared/footerHelpers";

interface BrewData {
  brewDate: string;
  beerName: string;
  batchNo: string;
  beerStyle: string;
  batchSize: string;
  brewSystem: string;
  yeastStrain: string;
  brewSupplies: string;
  brewSuppliesCost: string;
  targetOG: string;
  targetFG: string;
  preBoilGravity: string;
  strikeWater: string;
  spargeWater: string;
  totalWater: string;
  boilVolume: string;
  fermentorVolume: string;
  notes: string;
}

interface WaterCalculator {
  grainWeight: string;
  boilTime: string;
  targetVolume: string;
  mashThickness: string;
  boilOffRate: string;
  trubLoss: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
  timer?: {
    duration: number; // in minutes
    startTime: number; // timestamp when started
    isActive: boolean;
  };
}

interface Timer {
  id: string;
  duration: number; // in seconds
  remaining: number;
  isActive: boolean;
  startTime?: number; // timestamp when started
  finishTime?: number; // timestamp when finished
}

interface BrewSession {
  id: string;
  name: string;
  date: string;
  brewData: BrewData;
  logEntries: LogEntry[];
  savedAt: string;
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

const BrewDayLog: React.FC = () => {
  const logRef = useRef<HTMLDivElement>(null);
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
    { name: "Roll&Write", path: "/rollandwrite", icon: RollIcon },
    { name: "Field Notes", path: "/fieldnotes", icon: FieldNotesIcon },
    { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
    { name: "jM Galleries", path: "/jmgalleries", icon: PhotoCameraIcon },
  ];

  // Handle app selection from menu
  const handleAppSelect = (path: string) => {
    router.push(path);
    setIsAppsMenuOpen(false);
  };

  const [brewData, setBrewData] = useState<BrewData>({
    brewDate: new Date().toISOString().split("T")[0], // Auto-set to today
    beerName: "",
    batchNo: "",
    beerStyle: "None",
    batchSize: "",
    brewSystem: "",
    yeastStrain: "",
    brewSupplies: "",
    brewSuppliesCost: "",
    targetOG: "",
    targetFG: "",
    preBoilGravity: "",
    strikeWater: "",
    spargeWater: "",
    totalWater: "",
    boilVolume: "",
    fermentorVolume: "",
    notes: "",
  });

  const [calculator, setCalculator] = useState<WaterCalculator>({
    grainWeight: "",
    boilTime: "60",
    targetVolume: "",
    mashThickness: "1.25",
    boilOffRate: "1.0",
    trubLoss: "0.5",
  });

  const [showCalculator, setShowCalculator] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [savedSessions, setSavedSessions] = useState<BrewSession[]>([]);
  const [sessionJustSaved, setSessionJustSaved] = useState(false);
  const [xmlJustImported, setXmlJustImported] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [newLogText, setNewLogText] = useState("");
  const [selectedTimer, setSelectedTimer] = useState<string>("");
  const [activeTimers, setActiveTimers] = useState<Timer[]>([]);
  const alertedTimersRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio file to eliminate delay
  useEffect(() => {
    audioRef.current = new Audio("/beep-beep.mp3");
    audioRef.current.preload = "auto";
    audioRef.current.volume = 0.7;

    // Load saved sessions from localStorage
    loadSavedSessions();
  }, []);

  const loadSavedSessions = () => {
    try {
      const saved = localStorage.getItem("brewSessions");
      if (saved) {
        const sessions: BrewSession[] = JSON.parse(saved);
        setSavedSessions(sessions);
      }
    } catch (error) {
      console.log("Failed to load saved sessions:", error);
    }
  };

  const saveCurrentSession = () => {
    if (!brewData.beerName.trim()) {
      alert("Please enter a beer name before saving the session.");
      return;
    }

    const sessionId = Date.now().toString();

    // Create session name with batch number if provided
    let sessionName = brewData.beerName;
    if (brewData.batchNo.trim()) {
      sessionName = `${brewData.beerName} - Batch ${brewData.batchNo}`;
    }

    const newSession: BrewSession = {
      id: sessionId,
      name: sessionName || `Session ${sessionId}`,
      date: brewData.brewDate || new Date().toISOString().split("T")[0],
      brewData: { ...brewData },
      logEntries: [...logEntries],
      savedAt: new Date().toISOString(),
    };

    try {
      const existing = [...savedSessions];
      existing.unshift(newSession);

      // Keep only the latest 12 sessions
      const limited = existing.slice(0, 12);

      localStorage.setItem("brewSessions", JSON.stringify(limited));
      setSavedSessions(limited);

      // Show saved state instead of alert
      setSessionJustSaved(true);

      // Note: We don't reset sessionJustSaved automatically anymore
      // It will reset when user makes changes via updateBrewData
    } catch (error) {
      console.log("Failed to save session:", error);
      alert("Failed to save session. Please try again.");
    }
  };

  const loadSession = (session: BrewSession) => {
    if (
      confirm(`Load session "${session.name}"? This will replace current data.`)
    ) {
      setBrewData({ ...session.brewData });
      setLogEntries([...session.logEntries]);
      setShowSessions(false);
      // Set the saved state to true since we just loaded a saved session
      setSessionJustSaved(true);
    }
  };

  const deleteSession = (sessionId: string, sessionName: string) => {
    if (confirm(`Delete session "${sessionName}"?`)) {
      try {
        const updated = savedSessions.filter((s) => s.id !== sessionId);
        localStorage.setItem("brewSessions", JSON.stringify(updated));
        setSavedSessions(updated);
      } catch (error) {
        console.log("Failed to delete session:", error);
      }
    }
  };

  const autoSaveCurrentSession = (updatedEntries?: LogEntry[]) => {
    // Only auto-save if we have a beer name and at least one saved session exists
    if (!brewData.beerName.trim() || savedSessions.length === 0) return;

    // Create session name with batch number if provided
    let currentSessionName = brewData.beerName;
    if (brewData.batchNo.trim()) {
      currentSessionName = `${brewData.beerName} - Batch ${brewData.batchNo}`;
    }

    const currentSessionDate =
      brewData.brewDate || new Date().toISOString().split("T")[0];

    // Find existing session with same name and date, or fallback to beer name match
    let existingSessionIndex = savedSessions.findIndex(
      (session) =>
        session.name === currentSessionName &&
        session.date === currentSessionDate
    );

    // If not found by full name, try to find by beer name and date (for when batch number is added)
    if (existingSessionIndex === -1) {
      existingSessionIndex = savedSessions.findIndex(
        (session) =>
          (session.name === brewData.beerName ||
            session.name.startsWith(brewData.beerName)) &&
          session.date === currentSessionDate
      );
    }

    if (existingSessionIndex >= 0) {
      try {
        const updatedSessions = [...savedSessions];
        updatedSessions[existingSessionIndex] = {
          ...updatedSessions[existingSessionIndex],
          name: currentSessionName, // Update name in case batch number changed
          brewData: { ...brewData },
          logEntries: updatedEntries || [...logEntries],
          savedAt: new Date().toISOString(),
        };

        localStorage.setItem("brewSessions", JSON.stringify(updatedSessions));
        setSavedSessions(updatedSessions);

        // Update the saved state to show it's been auto-saved
        if (!sessionJustSaved) {
          setSessionJustSaved(true);
        }
      } catch (error) {
        console.log("Failed to auto-save session:", error);
      }
    }
  };

  // Audio beep function using custom MP3 file
  const playAlarmBeep = () => {
    try {
      // Play the custom beep-beep.mp3 file 2 times
      const playCount = 2;

      for (let i = 0; i < playCount; i++) {
        setTimeout(() => {
          if (audioRef.current) {
            // Reset audio to beginning and play
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((error) => {
              console.log("Failed to play preloaded beep file:", error);

              // Fallback: create new audio instance
              const audio = new Audio("/beep-beep.mp3");
              audio.volume = 0.7;
              audio.play().catch((fallbackError) => {
                console.log("Fallback audio also failed:", fallbackError);
              });
            });
          }
        }, i * 4000); // 4 seconds between each play
      }
    } catch (error) {
      console.log("Audio beep failed:", error);
    }
  };

  // Timer update effect - runs every second and uses timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers((prevTimers) =>
        prevTimers.map((timer) => {
          if (timer.isActive) {
            const now = Date.now();
            const elapsed = Math.floor((now - (timer.startTime || now)) / 1000);
            const newRemaining = Math.max(0, timer.duration - elapsed);

            // Debug logging for last few seconds
            if (timer.remaining <= 3) {
              console.log(
                `Timer ${timer.id}: remaining=${timer.remaining}, newRemaining=${newRemaining}, elapsed=${elapsed}`
              );
            }

            // Timer finished condition: newRemaining is 0 and timer was previously active with time remaining
            if (
              newRemaining === 0 &&
              timer.remaining > 0 &&
              !alertedTimersRef.current.has(timer.id)
            ) {
              // Debug logging
              console.log(
                `Timer alert triggered - ID: ${
                  timer.id
                }, newRemaining: ${newRemaining}, timer.remaining: ${
                  timer.remaining
                }, alerted: ${alertedTimersRef.current.has(timer.id)}`
              );

              // Timer just finished - play alarm only
              playAlarmBeep();

              // Add to alerted timers to prevent duplicate alerts
              alertedTimersRef.current.add(timer.id);

              return {
                ...timer,
                remaining: 0,
                isActive: false,
                finishTime: Date.now(),
              };
            }

            // Only update remaining time if timer is still active
            if (newRemaining > 0) {
              return { ...timer, remaining: newRemaining };
            } else {
              // Timer reached 0 but already processed above
              return {
                ...timer,
                remaining: 0,
                isActive: false,
                finishTime: timer.finishTime || Date.now(),
              };
            }
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateBrewData = (field: keyof BrewData, value: string) => {
    setBrewData((prev) => {
      const updatedData = { ...prev, [field]: value };
      // Auto-save to current session if one exists (with slight delay to avoid excessive saves)
      setTimeout(() => autoSaveCurrentSession(), 1000);
      return updatedData;
    });

    // Reset the saved state when user makes changes
    if (sessionJustSaved) {
      setSessionJustSaved(false);
    }
  };

  const updateCalculator = (field: keyof WaterCalculator, value: string) => {
    setCalculator((prev) => ({ ...prev, [field]: value }));
  };

  const calculateWaterVolumes = () => {
    const grainWeight = parseFloat(calculator.grainWeight) || 0;
    const boilTime = parseFloat(calculator.boilTime) || 60;
    const targetVolume = parseFloat(calculator.targetVolume) || 5;
    const mashThickness = parseFloat(calculator.mashThickness) || 1.25;
    const boilOffRate = parseFloat(calculator.boilOffRate) || 1.0;
    const trubLoss = parseFloat(calculator.trubLoss) || 0.5;

    // Calculate strike water (grain weight * mash thickness)
    const strikeWater = grainWeight * mashThickness;

    // Calculate fermentor volume (target volume)
    const fermentorVolume = targetVolume;

    // Calculate boil volume (fermentor volume + trub loss)
    const boilVolume = fermentorVolume + trubLoss;

    // Calculate pre-boil volume (boil volume + boil off)
    const boilOff = (boilTime / 60) * boilOffRate;
    const preBoilVolume = boilVolume + boilOff;

    // Calculate sparge water (pre-boil volume - strike water + grain absorption)
    const grainAbsorption = grainWeight * 0.125; // 0.125 gal per lb
    const spargeWater = preBoilVolume - strikeWater + grainAbsorption;

    // Calculate total water
    const totalWater = strikeWater + spargeWater;

    // Update the brew data with calculated values using updateBrewData to maintain consistency
    const updates = {
      strikeWater: strikeWater.toFixed(1),
      spargeWater: spargeWater.toFixed(1),
      totalWater: totalWater.toFixed(1),
      boilVolume: boilVolume.toFixed(1),
      fermentorVolume: fermentorVolume.toFixed(1),
    };

    // Apply all updates at once
    setBrewData((prev) => ({ ...prev, ...updates }));

    // Auto-save the calculated values without resetting the saved state immediately
    setTimeout(() => autoSaveCurrentSession(), 1000);
  };

  const addLogEntry = () => {
    if (newLogText.trim()) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

      const newEntry: LogEntry = {
        id: Date.now().toString(),
        timestamp,
        text: newLogText.trim(),
      };

      setLogEntries((prev) => {
        const updatedEntries = [...prev, newEntry];
        // Auto-save to current session if one exists
        autoSaveCurrentSession(updatedEntries);
        return updatedEntries;
      });
      setNewLogText("");

      // Reset the saved state when user adds log entries
      if (sessionJustSaved) {
        setSessionJustSaved(false);
      }
    }
  };

  const removeLogEntry = (id: string) => {
    setLogEntries((prev) => {
      const updatedEntries = prev.filter((entry) => entry.id !== id);
      // Auto-save to current session if one exists
      autoSaveCurrentSession(updatedEntries);
      return updatedEntries;
    });

    // Reset the saved state when user removes log entries
    if (sessionJustSaved) {
      setSessionJustSaved(false);
    }
  };

  const startTimer = (duration: number, logText: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    const timerId = Date.now().toString();
    const startTime = Date.now();

    // Add to active timers
    const newTimer: Timer = {
      id: timerId,
      duration: duration * 60, // convert to seconds
      remaining: duration * 60,
      isActive: true,
      startTime: startTime,
    };

    setActiveTimers((prev) => [...prev, newTimer]);

    // Add log entry with timer info
    const newEntry: LogEntry = {
      id: timerId,
      timestamp,
      text: logText || `Started ${duration} minute timer`,
      timer: {
        duration,
        startTime: startTime,
        isActive: true,
      },
    };

    setLogEntries((prev) => {
      const updatedEntries = [...prev, newEntry];
      // Auto-save to current session if one exists
      autoSaveCurrentSession(updatedEntries);
      return updatedEntries;
    });
    setNewLogText("");

    // Reset the saved state when user adds timer entries
    if (sessionJustSaved) {
      setSessionJustSaved(false);
    }
  };

  const addLogEntryWithTimer = () => {
    const duration = parseFloat(selectedTimer);
    if (newLogText.trim() || duration) {
      if (duration && duration > 0) {
        startTimer(duration, newLogText.trim());
      } else {
        addLogEntry();
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerStatusText = (timer: Timer): string => {
    if (timer.isActive) {
      return `${formatTime(timer.remaining)} remaining`;
    }

    if (timer.finishTime) {
      const finishTimeStr = new Date(timer.finishTime).toLocaleTimeString(
        "en-US",
        {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      );
      return `Timer finished at ${finishTimeStr}`;
    }

    return "Timer finished";
  };

  const exportToCSV = () => {
    // Create comprehensive CSV with all form data
    const csvRows = [];

    // Add header
    csvRows.push(['"Section"', '"Field"', '"Value"']);

    // Basic Information
    csvRows.push(['"Basic Info"', '"Brew Date"', `"${brewData.brewDate}"`]);
    csvRows.push(['"Basic Info"', '"Beer Name"', `"${brewData.beerName}"`]);
    csvRows.push(['"Basic Info"', '"Batch No"', `"${brewData.batchNo}"`]);
    csvRows.push(['"Basic Info"', '"Beer Style"', `"${brewData.beerStyle}"`]);
    csvRows.push(['"Basic Info"', '"Batch Size"', `"${brewData.batchSize}"`]);
    csvRows.push(['"Basic Info"', '"Brew System"', `"${brewData.brewSystem}"`]);
    csvRows.push([
      '"Basic Info"',
      '"Yeast Strain"',
      `"${brewData.yeastStrain}"`,
    ]);

    // Supplies and Cost
    csvRows.push([
      '"Supplies"',
      '"Brew Supplies"',
      `"${brewData.brewSupplies}"`,
    ]);
    csvRows.push([
      '"Supplies"',
      '"Total Cost"',
      `"${brewData.brewSuppliesCost}"`,
    ]);

    // Target Statistics
    csvRows.push([
      '"Statistics"',
      '"Pre-Boil Gravity"',
      `"${brewData.preBoilGravity}"`,
    ]);
    csvRows.push(['"Statistics"', '"Target OG"', `"${brewData.targetOG}"`]);
    csvRows.push(['"Statistics"', '"Target FG"', `"${brewData.targetFG}"`]);

    // Water Calculations
    csvRows.push(['"Water"', '"Strike Water"', `"${brewData.strikeWater}"`]);
    csvRows.push(['"Water"', '"Sparge Water"', `"${brewData.spargeWater}"`]);
    csvRows.push(['"Water"', '"Total Water"', `"${brewData.totalWater}"`]);
    csvRows.push(['"Water"', '"Boil Volume"', `"${brewData.boilVolume}"`]);
    csvRows.push([
      '"Water"',
      '"Fermentor Volume"',
      `"${brewData.fermentorVolume}"`,
    ]);

    // Notes
    if (brewData.notes) {
      csvRows.push([
        '"Notes"',
        '"General Notes"',
        `"${brewData.notes.replace(/"/g, '""')}"`,
      ]);
    }

    // Empty row separator
    csvRows.push(["", "", ""]);

    // Log Entries Header
    csvRows.push([
      '"Log Entries"',
      '"Timestamp"',
      '"Entry"',
      '"Timer Duration"',
    ]);

    // Log Entries
    logEntries.forEach((entry) => {
      csvRows.push([
        '"Log Entries"',
        `"${entry.timestamp}"`,
        `"${entry.text.replace(/"/g, '""')}"`,
        `"${entry.timer ? `${entry.timer.duration} min` : ""}"`,
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanBeerName = (brewData.beerName || "untitled")
      .toLowerCase()
      .replace(/\s+/g, "-");
    a.download = `brew-day-log-${cleanBeerName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const exportData = {
      basicInfo: {
        brewDate: brewData.brewDate,
        beerName: brewData.beerName,
        batchNo: brewData.batchNo,
        beerStyle: brewData.beerStyle,
        batchSize: brewData.batchSize,
        brewSystem: brewData.brewSystem,
        yeastStrain: brewData.yeastStrain,
      },
      supplies: {
        brewSupplies: brewData.brewSupplies,
        brewSuppliesCost: brewData.brewSuppliesCost,
      },
      targetStatistics: {
        preBoilGravity: brewData.preBoilGravity,
        targetOG: brewData.targetOG,
        targetFG: brewData.targetFG,
      },
      waterCalculations: {
        strikeWater: brewData.strikeWater,
        spargeWater: brewData.spargeWater,
        totalWater: brewData.totalWater,
        boilVolume: brewData.boilVolume,
        fermentorVolume: brewData.fermentorVolume,
      },
      notes: brewData.notes,
      logEntries: logEntries.map((entry) => ({
        id: entry.id,
        timestamp: entry.timestamp,
        text: entry.text,
        timer: entry.timer
          ? {
              duration: entry.timer.duration,
              startTime: entry.timer.startTime,
              isActive: entry.timer.isActive,
            }
          : null,
      })),
      activeTimers: activeTimers.map((timer) => ({
        id: timer.id,
        duration: timer.duration,
        remaining: timer.remaining,
        isActive: timer.isActive,
        startTime: timer.startTime,
        finishTime: timer.finishTime,
      })),
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanBeerName = (brewData.beerName || "untitled")
      .toLowerCase()
      .replace(/\s+/g, "-");
    a.download = `brew-day-log-${cleanBeerName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace = 15) => {
      if (yPosition + requiredSpace > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add text with automatic line wrapping
    const addText = (
      text: string,
      fontSize = 11,
      isBold = false,
      indent = 0
    ) => {
      if (isBold) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }
      doc.setFontSize(fontSize);

      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - indent);

      // Check if we need a new page before adding text
      checkNewPage(lines.length * (fontSize * 0.35) + 3);

      doc.text(lines, margin + indent, yPosition);
      yPosition += lines.length * (fontSize * 0.35) + 2;
    };

    // Helper function to add a section header
    const addSectionHeader = (title: string) => {
      checkNewPage(15);
      yPosition += 5;
      addText(title, 13, true);
      yPosition += 2; // Small gap after section title instead of line
    };

    // Helper function to add a field with label and value
    const addField = (label: string, value: string) => {
      if (value && value.trim()) {
        addText(`${label} ${value}`, 11, false, 5);
      }
    };

    // Calculate header height based on content
    const hasSubtitle =
      brewData.beerName || brewData.batchNo || brewData.brewDate;
    const headerHeight = hasSubtitle ? 31 : 25;

    // Title and Header
    doc.setFillColor(245, 245, 245); // Gray background (matching footer)
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    doc.setTextColor(0, 0, 0); // Black text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("BREW DAY LOG", pageWidth / 2, 16, { align: "center" });

    // Add beer name, batch no, and date inside blue header if available
    if (hasSubtitle) {
      let headerInfo = brewData.beerName || "Untitled Brew";
      if (brewData.batchNo) {
        headerInfo += ` - Batch ${brewData.batchNo}`;
      }
      if (brewData.brewDate) {
        headerInfo += ` (${brewData.brewDate})`;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(headerInfo, pageWidth / 2, 21, { align: "center" });
    }

    // Reset text color and position
    doc.setTextColor(0, 0, 0);
    yPosition = headerHeight + 10;

    // Basic Information Section
    addSectionHeader("BREW INFORMATION");
    if (brewData.beerStyle && brewData.beerStyle !== "None") {
      addField("Beer Style:", brewData.beerStyle);
    }
    addField("Batch Size:", brewData.batchSize);
    addField("Brew System:", brewData.brewSystem);
    addField("Yeast Strain:", brewData.yeastStrain);

    // Supplies Section
    if (brewData.brewSupplies || brewData.brewSuppliesCost) {
      addSectionHeader("SUPPLIES & COST");
      addField("Brew Supplies:", brewData.brewSupplies);
      addField("Total Cost:", brewData.brewSuppliesCost);
    }

    // Target Statistics Section
    if (brewData.preBoilGravity || brewData.targetOG || brewData.targetFG) {
      addSectionHeader("TARGET STATISTICS");
      addField("Pre-Boil Gravity:", brewData.preBoilGravity);
      addField("Target OG:", brewData.targetOG);
      addField("Target FG:", brewData.targetFG);
    }

    // Water Calculations Section
    if (
      brewData.strikeWater ||
      brewData.spargeWater ||
      brewData.totalWater ||
      brewData.boilVolume ||
      brewData.fermentorVolume
    ) {
      addSectionHeader("WATER CALCULATIONS");
      addField(
        "Strike Water:",
        brewData.strikeWater ? `${brewData.strikeWater} gal` : ""
      );
      addField(
        "Sparge Water:",
        brewData.spargeWater ? `${brewData.spargeWater} gal` : ""
      );
      addField(
        "Total Water:",
        brewData.totalWater ? `${brewData.totalWater} gal` : ""
      );
      addField(
        "Boil Volume:",
        brewData.boilVolume ? `${brewData.boilVolume} gal` : ""
      );
      addField(
        "Fermentor Volume:",
        brewData.fermentorVolume ? `${brewData.fermentorVolume} gal` : ""
      );
    }

    // Brew Day Log Entries Section
    if (logEntries.length > 0) {
      addSectionHeader("BREW DAY LOG ENTRIES");
      logEntries.forEach((entry, index) => {
        let entryText = `${index + 1}. [${entry.timestamp}] ${entry.text}`;
        if (entry.timer) {
          entryText += ` (${entry.timer.duration} min timer)`;
        }
        addText(entryText, 10, false, 5);
        yPosition += 2; // Extra spacing between entries
      });
    }

    // Notes Section
    if (brewData.notes && brewData.notes.trim()) {
      addSectionHeader("NOTES");
      addText(brewData.notes, 11, false, 5);
    }

    // Footer
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    // Add footer background
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageHeight - 25, pageWidth, 25, "F");

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on ${currentDate} at ${currentTime}`,
      margin,
      pageHeight - 10
    );
    doc.text(`Brew Day Log PDF`, pageWidth - margin - 40, pageHeight - 10);

    // Save the PDF with dashes instead of spaces in filename
    const cleanBeerName = (brewData.beerName || "untitled")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const fileName = `brew-day-log-${cleanBeerName}.pdf`;
    doc.save(fileName);
  };

  // Import from BeerXML
  const importFromBeerXML = (file: File) => {
    console.log("importFromBeerXML called with file:", file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      console.log("FileReader onload triggered");
      try {
        const xmlText = e.target?.result as string;
        console.log("XML text length:", xmlText?.length);

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Check for parsing errors
        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
          console.log("Parse error found:", parseError);
          alert("Error parsing XML file. Please check the file format.");
          return;
        }

        // Extract recipe data from BeerXML
        const recipe = xmlDoc.querySelector("RECIPE");
        if (!recipe) {
          console.log("No recipe found in XML");
          alert("No recipe found in the BeerXML file.");
          return;
        }

        console.log("Recipe found, processing data...");

        // Helper function to get text content safely
        const getTextContent = (
          selector: string,
          parent: Element = recipe
        ): string => {
          const element = parent.querySelector(selector);
          return element?.textContent?.trim() || "";
        };

        // Helper function to convert liters to gallons (if needed)
        const litersToGallons = (liters: string): string => {
          const num = parseFloat(liters);
          return isNaN(num) ? liters : (num * 0.264172).toFixed(2);
        };

        // Helper function to find beer style by category number and style letter
        const findBeerStyleByCategory = (
          categoryNumber: string,
          styleLetter: string
        ): string => {
          if (!categoryNumber || !styleLetter) return "";

          const targetStyle = `${categoryNumber}${styleLetter}`;
          const foundStyle = beerStylesData.beer_style_names.find((style) =>
            style.includes(`(${targetStyle})`)
          );

          return foundStyle || "";
        };

        // Extract style information
        const styleElement = xmlDoc.querySelector("STYLE");
        let beerStyleFromCategory = "";
        if (styleElement) {
          const categoryNumber = getTextContent(
            "CATEGORY_NUMBER",
            styleElement
          );
          const styleLetter = getTextContent("STYLE_LETTER", styleElement);
          beerStyleFromCategory = findBeerStyleByCategory(
            categoryNumber,
            styleLetter
          );
        }

        // Extract and populate brew data
        const importedData: Partial<BrewData> = {
          beerName: getTextContent("NAME"),
          beerStyle:
            beerStyleFromCategory ||
            getTextContent("STYLE NAME") ||
            getTextContent("TYPE"),
          batchSize: litersToGallons(getTextContent("BATCH_SIZE")),
          targetOG: getTextContent("OG"),
          targetFG: getTextContent("FG"),
          boilVolume: litersToGallons(getTextContent("BOIL_SIZE")),
          notes: getTextContent("NOTES") || getTextContent("TASTE_NOTES"),
        };

        // Extract equipment/brew system information
        const equipment = xmlDoc.querySelector("EQUIPMENT");
        if (equipment) {
          const equipmentName = getTextContent("NAME", equipment);
          if (equipmentName) {
            importedData.brewSystem = equipmentName;
          }
        }

        // Extract yeast information
        const yeast = xmlDoc.querySelector("YEAST");
        if (yeast) {
          const yeastName = getTextContent("NAME", yeast);
          const yeastLab = getTextContent("LABORATORY", yeast);
          const yeastId = getTextContent("PRODUCT_ID", yeast);

          let yeastString = yeastName;
          if (yeastLab) yeastString += ` (${yeastLab}`;
          if (yeastId)
            yeastString += yeastLab ? ` ${yeastId})` : ` (${yeastId})`;
          else if (yeastLab) yeastString += ")";

          importedData.yeastStrain = yeastString;
        }

        // Update the form with imported data
        console.log("Setting brew data:", importedData);
        setBrewData((prev) => ({
          ...prev,
          ...importedData,
          // Keep existing date and other fields that shouldn't be overwritten
          brewDate: prev.brewDate,
        }));

        // Set import success state
        console.log("Setting xmlJustImported to true");
        setXmlJustImported(true);
      } catch (error) {
        console.error("Error parsing BeerXML:", error);
        alert("Error reading the BeerXML file. Please check the file format.");
      }
    };

    reader.readAsText(file);
  };

  // Handle file input
  const handleBeerXMLImport = () => {
    console.log(
      "handleBeerXMLImport called, xmlJustImported:",
      xmlJustImported
    );

    // Don't allow import if one just completed
    if (xmlJustImported) {
      console.log("Import blocked - already imported");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xml,.beerxml";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      console.log("File selected:", file?.name);
      if (file) {
        importFromBeerXML(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div ref={logRef} className="max-xl bg-white">
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

          <h1 className="text-lg font-semibold text-gray-800">Brew Day Log</h1>
        </div>

        {/* Basic Info */}
        <div className="py-6 flex justify-center">
          <div
            className="w-full max-w-5xl"
            style={{
              width: "100%",
              paddingLeft: 16,
              paddingRight: 16,
              boxSizing: "border-box",
            }}
          >
            {/* Centered Image Above Brew Sessions */}
            <div className="flex justify-center mb-6">
              <a
                href="https://thunderstruckbrewing.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/images/thunderstruckbrewing.png"
                  alt="Thunderstruck Brewing"
                  width={200}
                  height={200}
                  className="object-contain"
                  style={{ maxWidth: "200px", maxHeight: "200px" }}
                />
              </a>
            </div>

            {/* Brew Sessions */}
            <div className="mb-6">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setShowSessions(!showSessions)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  <FolderIcon fontSize="small" />
                  Brew Sessions ({savedSessions.length}/12)
                  {showSessions ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </button>
              </div>

              {showSessions && (
                <div className="mt-3 border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  {/* Small disclaimer at top of the Brew Sessions box */}

                  {savedSessions.length === 0 ? (
                    <div className="p-4 text-blue-500 text-center text-sm">
                      <span className="font-bold">NO SAVED SESSIONS YET</span>
                      <br />
                      Click <span className="font-bold">Save Session</span> to
                      save your first session. All sessions are saved to local
                      storage and may not be available on all devices.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {savedSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 border-b border-blue-100 last:border-b-0 hover:bg-blue-100 rounded-md mb-1"
                        >
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => loadSession(session)}
                          >
                            <div className="font-medium text-sm text-gray-900">
                              {session.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Saved{" "}
                              {new Date(session.savedAt).toLocaleDateString()}{" "}
                              {new Date(session.savedAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour12: false,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                }
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id, session.name);
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete session"
                          >
                            <DeleteIcon fontSize="small" />
                          </button>
                        </div>
                      ))}
                      <div className="mt-4 text-xs text-blue-700">
                        * Brew sessions are stored in local storage and may not
                        appear on all devices and are not permanently saved.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-6">
              <div className="flex gap-2">
                <TextField
                  fullWidth
                  label="Beer Name"
                  variant="outlined"
                  value={brewData.beerName}
                  onChange={(e) => updateBrewData("beerName", e.target.value)}
                  placeholder="e.g., Thunderhop IPA"
                />
                <Button
                  variant="outlined"
                  onClick={handleBeerXMLImport}
                  sx={{
                    height: "56px",
                    minWidth: "140px",
                    backgroundColor: xmlJustImported ? "#4caf50" : "#f5f5f5",
                    "&:hover": {
                      backgroundColor: xmlJustImported ? "#45a049" : "#e0e0e0",
                    },
                    borderColor: xmlJustImported ? "#4caf50" : "#ccc",
                    color: xmlJustImported ? "white" : "#666",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    transition: "all 0.3s ease",
                  }}
                  startIcon={
                    xmlJustImported ? <CheckIcon /> : <UploadFileIcon />
                  }
                >
                  {xmlJustImported ? "Done" : "Import XML"}
                </Button>
              </div>
              <div className="flex gap-2">
                <TextField
                  fullWidth
                  label="Batch No."
                  variant="outlined"
                  value={brewData.batchNo}
                  onChange={(e) => updateBrewData("batchNo", e.target.value)}
                  placeholder="e.g., 001"
                />
                <Button
                  variant="contained"
                  onClick={saveCurrentSession}
                  sx={{
                    height: "56px",
                    minWidth: "140px",
                    backgroundColor: sessionJustSaved ? "#4caf50" : "#1976d2",
                    "&:hover": {
                      backgroundColor: sessionJustSaved ? "#45a049" : "#115293",
                    },
                    transition: "all 0.3s ease",
                    whiteSpace: "nowrap",
                    textTransform: "none",
                  }}
                  startIcon={sessionJustSaved ? <CheckIcon /> : <SaveIcon />}
                >
                  {sessionJustSaved ? "Saved" : "Save Session"}
                </Button>
              </div>
            </div>

            {/* Beer Style & Batch Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <FormControl fullWidth>
                  <InputLabel id="beer-style-label">Beer Style</InputLabel>
                  <Select
                    labelId="beer-style-label"
                    value={brewData.beerStyle}
                    label="Beer Style"
                    onChange={(e) =>
                      updateBrewData("beerStyle", e.target.value)
                    }
                    className="text-left"
                    sx={{
                      "& .MuiOutlinedInput-input": {
                        padding: "16.5px 14px", // Match TextField padding
                      },
                      "& .MuiInputBase-root": {
                        height: "56px", // Match TextField height
                      },
                    }}
                  >
                    <MenuItem value="None">None</MenuItem>
                    {beerStylesData.beer_style_names.map((style) => (
                      <MenuItem key={style} value={style}>
                        {style}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div>
                <TextField
                  fullWidth
                  label="Batch Size"
                  variant="outlined"
                  value={brewData.batchSize}
                  onChange={(e) => updateBrewData("batchSize", e.target.value)}
                  placeholder="e.g., 5 gallons"
                />
              </div>
            </div>

            {/* Brew Supplies & Brew Supplies Cost */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <TextField
                  fullWidth
                  label="Brew Supplies"
                  variant="outlined"
                  value={brewData.brewSupplies}
                  onChange={(e) =>
                    updateBrewData("brewSupplies", e.target.value)
                  }
                  placeholder="e.g., Hops, Grain, etc."
                />
              </div>
              <div>
                <TextField
                  fullWidth
                  label="Brew Supplies Cost"
                  variant="outlined"
                  value={brewData.brewSuppliesCost}
                  onChange={(e) =>
                    updateBrewData("brewSuppliesCost", e.target.value)
                  }
                  placeholder="e.g., $45.00"
                />
              </div>
            </div>

            {/* Brew System & Yeast Strain */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <TextField
                  fullWidth
                  label="Brew System"
                  variant="outlined"
                  value={brewData.brewSystem}
                  onChange={(e) => updateBrewData("brewSystem", e.target.value)}
                  placeholder="e.g., All Grain, Extract, BIAB"
                />
              </div>
              <div>
                <TextField
                  fullWidth
                  label="Yeast Strain"
                  variant="outlined"
                  value={brewData.yeastStrain}
                  onChange={(e) =>
                    updateBrewData("yeastStrain", e.target.value)
                  }
                  placeholder="e.g., Safale US-05, Wyeast 1056"
                />
              </div>
            </div>

            {/* Target Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <TextField
                  fullWidth
                  label="Pre-Boil Gravity"
                  variant="outlined"
                  value={brewData.preBoilGravity}
                  onChange={(e) =>
                    updateBrewData("preBoilGravity", e.target.value)
                  }
                  placeholder="e.g., 1.050"
                />
              </div>
              <div>
                <TextField
                  fullWidth
                  label="Target OG"
                  variant="outlined"
                  value={brewData.targetOG}
                  onChange={(e) => updateBrewData("targetOG", e.target.value)}
                  placeholder="e.g., 1.065"
                />
              </div>
              <div>
                <TextField
                  fullWidth
                  label="Target FG"
                  variant="outlined"
                  value={brewData.targetFG}
                  onChange={(e) => updateBrewData("targetFG", e.target.value)}
                  placeholder="e.g., 1.012"
                />
              </div>
            </div>

            {/* Water Calculations */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Water Calculations
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title="Open Water Calculator"
                >
                  <CalculateIcon fontSize="small" />
                </button>
              </div>

              {showCalculator && (
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 mb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <TextField
                          fullWidth
                          label="Grain Weight (lbs)"
                          variant="outlined"
                          type="number"
                          slotProps={{ htmlInput: { step: 0.1 } }}
                          value={calculator.grainWeight}
                          onChange={(e) =>
                            updateCalculator("grainWeight", e.target.value)
                          }
                          placeholder="e.g., 12.5"
                        />
                      </div>
                      <div>
                        <TextField
                          fullWidth
                          label="Target Volume (gal)"
                          variant="outlined"
                          type="number"
                          slotProps={{ htmlInput: { step: 0.1 } }}
                          value={calculator.targetVolume}
                          onChange={(e) =>
                            updateCalculator("targetVolume", e.target.value)
                          }
                          placeholder="e.g., 5.0"
                        />
                      </div>
                      <div>
                        <TextField
                          fullWidth
                          label="Boil Time (min)"
                          variant="outlined"
                          type="number"
                          value={calculator.boilTime}
                          onChange={(e) =>
                            updateCalculator("boilTime", e.target.value)
                          }
                          placeholder="60"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <TextField
                          fullWidth
                          label="Mash Thickness (qt/lb)"
                          variant="outlined"
                          type="number"
                          slotProps={{ htmlInput: { step: 0.05 } }}
                          value={calculator.mashThickness}
                          onChange={(e) =>
                            updateCalculator("mashThickness", e.target.value)
                          }
                          placeholder="1.25"
                        />
                      </div>
                      <div>
                        <TextField
                          fullWidth
                          label="Boil Off Rate (gal/hr)"
                          variant="outlined"
                          type="number"
                          slotProps={{ htmlInput: { step: 0.1 } }}
                          value={calculator.boilOffRate}
                          onChange={(e) =>
                            updateCalculator("boilOffRate", e.target.value)
                          }
                          placeholder="1.0"
                        />
                      </div>
                      <div>
                        <TextField
                          fullWidth
                          label="Trub Loss (gal)"
                          variant="outlined"
                          type="number"
                          slotProps={{ htmlInput: { step: 0.1 } }}
                          value={calculator.trubLoss}
                          onChange={(e) =>
                            updateCalculator("trubLoss", e.target.value)
                          }
                          placeholder="0.5"
                        />
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={calculateWaterVolumes}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Calculate Water Volumes
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <TextField
                    fullWidth
                    label="Strike Water"
                    variant="outlined"
                    value={brewData.strikeWater}
                    onChange={(e) =>
                      updateBrewData("strikeWater", e.target.value)
                    }
                    placeholder="e.g., 5.0 gal"
                  />
                </div>
                <div>
                  <TextField
                    fullWidth
                    label="Sparge Water"
                    variant="outlined"
                    value={brewData.spargeWater}
                    onChange={(e) =>
                      updateBrewData("spargeWater", e.target.value)
                    }
                    placeholder="e.g., 3.5 gal"
                  />
                </div>
                <div>
                  <TextField
                    fullWidth
                    label="Total Water"
                    variant="outlined"
                    value={brewData.totalWater}
                    onChange={(e) =>
                      updateBrewData("totalWater", e.target.value)
                    }
                    placeholder="e.g., 8.5 gal"
                  />
                </div>
                <div>
                  <TextField
                    fullWidth
                    label="Boil Volume"
                    variant="outlined"
                    value={brewData.boilVolume}
                    onChange={(e) =>
                      updateBrewData("boilVolume", e.target.value)
                    }
                    placeholder="e.g., 6.5 gal"
                  />
                </div>
                <div>
                  <TextField
                    fullWidth
                    label="Fermentor Volume"
                    variant="outlined"
                    value={brewData.fermentorVolume}
                    onChange={(e) =>
                      updateBrewData("fermentorVolume", e.target.value)
                    }
                    placeholder="e.g., 5.0 gal"
                  />
                </div>
              </div>
            </div>

            {/* Brew Day Log */}
            <div>
              <div className="flex items-center justify-between mt-8 mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  Brew Data Log (time, step, etc)
                </h2>
              </div>

              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <TextField
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={1}
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    placeholder="Enter brew day log entry..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        addLogEntryWithTimer();
                      }
                    }}
                    sx={{ flexGrow: 1 }}
                  />
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <FormControl>
                      <InputLabel id="timer-select-label">
                        Timer (min)
                      </InputLabel>
                      <Select
                        labelId="timer-select-label"
                        value={selectedTimer}
                        onChange={(e) => setSelectedTimer(e.target.value)}
                        label="Timer (min)"
                        sx={{
                          height: "56px", // Match TextField height
                          "& .MuiOutlinedInput-input": {
                            padding: "16.5px 14px", // Match TextField padding
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#d1d5db",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#9ca3af",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#3b82f6",
                            borderWidth: "2px",
                          },
                        }}
                      >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="1">1</MenuItem>
                        <MenuItem value="5">5</MenuItem>
                        <MenuItem value="10">10</MenuItem>
                        <MenuItem value="15">15</MenuItem>
                        <MenuItem value="30">30</MenuItem>
                        <MenuItem value="60">60</MenuItem>
                        <MenuItem value="75">75</MenuItem>
                        <MenuItem value="90">90</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </div>

                {/* Add Log Entry Button */}
                <button
                  type="button"
                  onClick={addLogEntryWithTimer}
                  disabled={!newLogText.trim() && !selectedTimer}
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  {selectedTimer ? (
                    <TimerIcon fontSize="small" />
                  ) : (
                    <AddIcon fontSize="small" />
                  )}
                  {selectedTimer
                    ? `Start ${selectedTimer}min Timer`
                    : "Add Log Entry"}
                </button>
              </div>

              {logEntries.length > 0 && (
                <div className="space-y-2 mb-4">
                  {logEntries.map((entry) => {
                    const activeTimer = activeTimers.find(
                      (timer) => timer.id === entry.id
                    );
                    const hasTimer = entry.timer && activeTimer;

                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-2 p-3 rounded-md ${
                          hasTimer && activeTimer.isActive
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <span className="font-mono text-sm text-gray-600 min-w-[50px] flex-shrink-0">
                          {entry.timestamp}
                        </span>
                        <div className="flex-1">
                          <span className="text-sm font-mono block lowercase">
                            {entry.text}
                          </span>
                          {hasTimer && (
                            <div className="flex items-center gap-2 mt-1">
                              <TimerIcon
                                fontSize="small"
                                className="text-blue-600"
                              />
                              <span
                                className={`text-xs font-mono ${
                                  activeTimer.isActive
                                    ? "text-blue-600 font-semibold"
                                    : "text-gray-500"
                                }`}
                              >
                                {getTimerStatusText(activeTimer)}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLogEntry(entry.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete log entry"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <TextField
                fullWidth
                label="General Notes"
                variant="outlined"
                multiline
                rows={4}
                value={brewData.notes}
                onChange={(e) => updateBrewData("notes", e.target.value)}
                placeholder="Any additional notes about the brew day..."
              />
            </div>

            {/* Export Buttons */}
            <div className="pt-6 pb-6">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={exportToCSV}
                  className="px-3 py-2 text-gray-700 bg-gray-100 hover:text-gray-800 hover:bg-gray-200 rounded text-sm font-medium transition-colors flex items-center gap-1"
                  title="Export to CSV"
                >
                  <FileDownloadIcon sx={{ fontSize: 16 }} />
                  CSV
                </button>

                <button
                  onClick={exportToJSON}
                  className="px-3 py-2 text-gray-700 bg-gray-100 hover:text-gray-800 hover:bg-gray-200 rounded text-sm font-medium transition-colors flex items-center gap-1"
                  title="Export to JSON"
                >
                  <FileDownloadIcon sx={{ fontSize: 16 }} />
                  JSON
                </button>

                <button
                  onClick={exportToPDF}
                  className="px-3 py-2 text-gray-700 bg-gray-100 hover:text-gray-800 hover:bg-gray-200 rounded text-sm font-medium transition-colors flex items-center gap-1"
                  title="Export to PDF"
                >
                  <FileDownloadIcon sx={{ fontSize: 16 }} />
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

export default BrewDayLog;
