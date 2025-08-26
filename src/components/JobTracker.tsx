"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Link as LinkIcon,
  Apps as AppsIcon,
  Home as HomeIcon,
  Assignment as LogIcon,
  MenuBook as FieldNotesIcon,
  Casino as RollIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  IntegrationInstructions as DevToolsIcon,
  EditNote as EditNoteIcon,
  StickyNote2 as NotesIcon,
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
  FileDownload as FileDownloadIcon,
  TableChart as TableChartIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Avatar,
  Pagination,
  Menu,
  InputAdornment,
} from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";

interface JobOpportunity {
  id: string;
  company: string;
  position: string;
  dateApplied: string;
  createdAt?: string; // Timestamp when opportunity was added to the system
  status: "saved" | "applied" | "interview" | "offer" | "rejected" | "closed";
  description?: string;
  jobUrl?: string;
  jobSource?: string;
  salary?: string;
  location?: string;
  interviews: Interview[];
  contacts: Contact[];
  notes?: string;
}

interface Interview {
  id: string;
  date: string;
  time: string;
  type: string;
  interviewer: string;
  notes?: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

interface LogEntry {
  id: string;
  date: string;
  type:
    | "phone_call"
    | "email"
    | "status_change"
    | "interview"
    | "application"
    | "follow_up"
    | "other";
  description: string;
  notes?: string;
  opportunityId?: string; // Optional link to specific opportunity
  recruiterId?: string; // Optional link to recruiter (mainly for phone calls)
  otherContact?: string; // For email type when "other" contact is selected
}

interface Recruiter {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  specialty?: string;
  notes?: string;
}

interface OnlineResource {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string;
}

interface JobData {
  id: number;
  closed: number;
  status: string;
  searchName?: string;
  created?: string; // Database created timestamp
  opportunities?: JobOpportunity[];
  recruiters?: Recruiter[];
  resources?: OnlineResource[];
  log?: LogEntry[];
}

interface JobSearch {
  id: string;
  name: string;
  isActive: boolean;
  opportunities: JobOpportunity[];
  recruiters: Recruiter[];
  resources: OnlineResource[];
  log: LogEntry[];
  created: string;
  closed?: number;
  closedDate?: string;
}

const statusColors = {
  saved: "#9C27B0",
  applied: "#2196F3",
  interview: "#FF9800",
  offer: "#4CAF50",
  rejected: "#F44336",
  closed: "#9E9E9E",
};

const statusLabels = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  closed: "Closed",
};

// Phone number formatting function
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Check if we have a 10-digit number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  }

  // If it's not 10 digits, return the original
  return phone;
};

// Get local date in YYYY-MM-DD format
const getLocalDateString = (): string => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().split("T")[0];
};

// Parse date string as local date to avoid timezone issues
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

export default function JobTracker() {
  // Export opportunities as ASCII TXT
  const handleExportOpportunitiesAsTxt = () => {
    if (!currentSearch) return;
    const filteredOpportunities = getFilteredOpportunities();
    if (filteredOpportunities.length === 0) {
      alert("No opportunities to export.");
      return;
    }
    // Table headers
    const headers = [
      "Company",
      "Position",
      "Last Changed",
      "Days Open",
      "Status",
      "Location",
      "Salary",
    ];
    // Calculate column widths
    const colWidths = headers.map((header, i) => {
      let max = header.length;
      filteredOpportunities.forEach((opp) => {
        let val = "";
        switch (i) {
          case 0:
            val = opp.company || "";
            break;
          case 1:
            val = opp.position || "";
            break;
          case 2:
            val = parseLocalDate(opp.dateApplied).toLocaleDateString();
            break;
          case 3:
            val = getDaysSinceApplied(opp.dateApplied) + " days";
            break;
          case 4:
            val = statusLabels[opp.status] || opp.status;
            break;
          case 5:
            val = opp.location || "";
            break;
          case 6:
            val = opp.salary || "";
            break;
        }
        if (val.length > max) max = val.length;
      });
      return max;
    });
    // Helper to pad
    const pad = (str: string, len: number) =>
      str + " ".repeat(len - str.length);
    // Build header row
    let txt =
      "|" +
      headers.map((h, i) => " " + pad(h, colWidths[i]) + " ").join("|") +
      "|\n";
    // Divider
    txt += "|" + colWidths.map((w) => "-".repeat(w + 2)).join("|") + "|\n";
    // Rows
    filteredOpportunities.forEach((opp) => {
      const row = [
        opp.company || "",
        opp.position || "",
        parseLocalDate(opp.dateApplied).toLocaleDateString(),
        getDaysSinceApplied(opp.dateApplied) + " days",
        statusLabels[opp.status] || opp.status,
        opp.location || "",
        opp.salary || "",
      ];
      txt +=
        "|" +
        row.map((cell, i) => " " + pad(cell, colWidths[i]) + " ").join("|") +
        "|\n";
    });
    // Download
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentSearch.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_opportunities_table_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const { data: session, status } = useSession();
  const [searches, setSearches] = useState<JobSearch[]>([]);
  const [currentSearch, setCurrentSearch] = useState<JobSearch | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasLoadedData, setHasLoadedData] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Log pagination state
  const [logCurrentPage, setLogCurrentPage] = useState<number>(1);
  const [logItemsPerPage, setLogItemsPerPage] = useState<number>(10);

  // Dialog states
  const [showNewSearchDialog, setShowNewSearchDialog] = useState(false);
  const [showOpportunityDialog, setShowOpportunityDialog] = useState(false);
  const [showRecruiterDialog, setShowRecruiterDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);

  // Editing states
  const [editingOpportunity, setEditingOpportunity] =
    useState<JobOpportunity | null>(null);
  const [editingRecruiter, setEditingRecruiter] = useState<Recruiter | null>(
    null
  );
  const [editingResource, setEditingResource] = useState<OnlineResource | null>(
    null
  );
  const [currentOpportunityForInterview, setCurrentOpportunityForInterview] =
    useState<JobOpportunity | null>(null);
  const [currentOpportunityForContact, setCurrentOpportunityForContact] =
    useState<JobOpportunity | null>(null);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);

  // Email recruiter selection state
  const [showEmailRecruiterOther, setShowEmailRecruiterOther] = useState(false);
  const [emailOtherContact, setEmailOtherContact] = useState("");

  // Form states
  const [newSearchName, setNewSearchName] = useState("");
  const [opportunityForm, setOpportunityForm] = useState<
    Partial<JobOpportunity>
  >({});
  const [recruiterForm, setRecruiterForm] = useState<Partial<Recruiter>>({});
  const [resourceForm, setResourceForm] = useState<Partial<OnlineResource>>({});
  const [interviewForm, setInterviewForm] = useState<Partial<Interview>>({});
  const [contactForm, setContactForm] = useState<Partial<Contact>>({});
  const [logForm, setLogForm] = useState<Partial<LogEntry>>({});
  const [isJobSourceOther, setIsJobSourceOther] = useState(false);

  // Collapse states
  const [isRecruitersExpanded, setIsRecruitersExpanded] = useState(false);
  const [isResourcesExpanded, setIsResourcesExpanded] = useState(false);
  const [isLogExpanded, setIsLogExpanded] = useState(true);

  // Status change state
  const [statusChangeAnchor, setStatusChangeAnchor] =
    useState<HTMLElement | null>(null);
  const [
    selectedOpportunityForStatusChange,
    setSelectedOpportunityForStatusChange,
  ] = useState<JobOpportunity | null>(null);

  // Log date filter state
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  // Apps menu state
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Apps data
  const apps = [
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
    { name: "Field Notes", path: "/fieldnotes", icon: FieldNotesIcon },
    { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
    { name: "jM Galleries", path: "/jmgalleries", icon: PhotoCameraIcon },
  ];

  const router = useRouter();

  const handleAppSelect = (path: string) => {
    setIsAppsMenuOpen(false);
    setOpenSubmenu(null);
    router.push(path);
  };

  const loadJobData = useCallback(async () => {
    if (!session?.user?.email) {
      console.log("No user email available");
      setHasLoadedData(true);
      return;
    }

    try {
      const response = await fetch(
        `/api/jobs?userEmail=${encodeURIComponent(session.user.email)}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("JobTracker received data:", data);

        // Handle the new API response format with jobs array and stats
        const jobs = data.jobs || data || [];
        console.log("JobTracker jobs array:", jobs);

        // Convert jobs data to the expected search format
        const searches = jobs.map((job: JobData) => {
          console.log("Processing job:", job);
          return {
            id: job.id.toString(),
            name: job.searchName || job.status || "Job Search",
            isActive: job.closed === 0,
            opportunities: job.opportunities || [],
            recruiters: job.recruiters || [],
            resources: job.resources || [],
            log: job.log || [],
            created: job.created || new Date().toISOString(), // Use existing created or current time
            closed: job.closed,
          };
        });

        console.log("JobTracker converted searches:", searches);
        setSearches(searches);
        const activeSearch = searches.find((s: JobSearch) => s.isActive);
        console.log("JobTracker active search:", activeSearch);
        setCurrentSearch(activeSearch || null);
      }
    } catch (error) {
      console.error("Error loading job data:", error);
    } finally {
      setHasLoadedData(true);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (status === "loading") {
      return; // Don't do anything while session is loading
    }

    if (session?.user?.email) {
      loadJobData();
    } else {
      // User is not authenticated, mark as loaded
      setHasLoadedData(true);
    }
  }, [session, status, loadJobData]);

  const saveJobData = async (searchData: JobSearch) => {
    if (!session?.user?.email) {
      console.log("No user email available for saving");
      return;
    }

    try {
      console.log("Saving job data:", searchData);

      // Convert the JobSearch back to the format expected by the database
      const jobDataForDB = {
        id: searchData.id === "new" ? undefined : parseInt(searchData.id),
        searchName: searchData.name,
        status: searchData.isActive ? "active" : "closed",
        closed: searchData.isActive ? 0 : 1,
        opportunities: searchData.opportunities,
        recruiters: searchData.recruiters,
        resources: searchData.resources,
        log: searchData.log || [],
        created: searchData.created,
        closedDate: searchData.closedDate,
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: session.user.email,
          jobData: jobDataForDB,
        }),
      });

      if (response.ok) {
        console.log("Job data saved successfully");
        // Reload the data to get the updated state from the database
        loadJobData();
      } else {
        console.error("Failed to save job data:", await response.text());
      }
    } catch (error) {
      console.error("Error saving job data:", error);
    }
  };

  const getStatusCounts = () => {
    if (!currentSearch) return { total: 0, applied: 0, closed: 0, saved: 0 };

    const opportunities = currentSearch.opportunities;
    return {
      total: opportunities.filter(
        (o) => o.status !== "closed" && o.status !== "rejected"
      ).length,
      applied: opportunities.filter((o) => o.status === "applied").length,
      closed: opportunities.filter(
        (o) => o.status === "closed" || o.status === "rejected"
      ).length,
      saved: opportunities.filter((o) => o.status === "saved").length,
    };
  };

  const getDaysSinceApplied = (dateApplied: string) => {
    const applied = parseLocalDate(dateApplied);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - applied.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getFilteredOpportunities = () => {
    if (!currentSearch) return [];

    let filtered = currentSearch.opportunities;

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }

    // Apply fuzzy search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((o) => {
        // Search only in company and position
        const searchableText = [o.company, o.position]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        // Simple fuzzy search: check if all characters of query appear in order
        let queryIndex = 0;
        for (
          let i = 0;
          i < searchableText.length && queryIndex < query.length;
          i++
        ) {
          if (searchableText[i] === query[queryIndex]) {
            queryIndex++;
          }
        }
        return queryIndex === query.length;
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        // Prioritize recently created opportunities (within last hour)
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        const aIsRecent = aCreated > oneHourAgo;
        const bIsRecent = bCreated > oneHourAgo;

        if (aIsRecent && !bIsRecent) return -1;
        if (!aIsRecent && bIsRecent) return 1;
        if (aIsRecent && bIsRecent) return bCreated - aCreated;

        // Default to sorting by dateApplied
        return (
          new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
        );
      } else if (sortBy === "oldest") {
        return (
          new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime()
        );
      }
      return 0;
    });
  };

  const getPaginatedOpportunities = () => {
    const filtered = getFilteredOpportunities();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredOpportunities();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  const getPaginationInfo = () => {
    const filtered = getFilteredOpportunities();
    const totalItems = filtered.length;
    const startItem =
      totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    return `Showing ${startItem}-${endItem} of ${totalItems} opportunities`;
  };

  // Reset pagination when filters change
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterStatus(event.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchQuery(newSearch);
    setCurrentPage(1);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
    setCurrentPage(1);
  };

  // Helper function to get filtered log entries
  const getFilteredLogEntries = () => {
    let logEntries = (currentSearch?.log || []).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Apply search query filtering
    if (logSearchQuery.trim()) {
      const query = logSearchQuery.toLowerCase();
      logEntries = logEntries.filter((entry) => {
        return (
          entry.type.toLowerCase().includes(query) ||
          entry.description.toLowerCase().includes(query) ||
          (entry.notes && entry.notes.toLowerCase().includes(query)) ||
          (entry.otherContact &&
            entry.otherContact.toLowerCase().includes(query))
        );
      });
    }

    // Apply date filtering
    if (logStartDate || logEndDate) {
      logEntries = logEntries.filter((entry) => {
        // Use parseLocalDate to avoid timezone issues
        const entryDate = parseLocalDate(entry.date.split("T")[0]);
        const startDate = logStartDate ? parseLocalDate(logStartDate) : null;
        const endDate = logEndDate ? parseLocalDate(logEndDate) : null;

        // Set startDate to start of day and endDate to end of day for inclusive comparison
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
        }
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }

        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
        return true;
      });
    }

    return logEntries;
  };

  // Log pagination functions
  const getLogTotalPages = () => {
    const filteredEntries = getFilteredLogEntries();
    return Math.ceil(filteredEntries.length / logItemsPerPage);
  };

  const getLogPaginationInfo = () => {
    const filteredEntries = getFilteredLogEntries();
    const totalItems = filteredEntries.length;
    const startItem =
      totalItems === 0 ? 0 : (logCurrentPage - 1) * logItemsPerPage + 1;
    const endItem = Math.min(logCurrentPage * logItemsPerPage, totalItems);
    return `Showing ${startItem}-${endItem} of ${totalItems} log entries`;
  };

  const handleLogItemsPerPageChange = (event: SelectChangeEvent) => {
    setLogItemsPerPage(parseInt(event.target.value));
    setLogCurrentPage(1);
  };

  const getPaginatedLogEntries = () => {
    const filteredEntries = getFilteredLogEntries();
    const startIndex = (logCurrentPage - 1) * logItemsPerPage;
    const endIndex = startIndex + logItemsPerPage;
    return filteredEntries.slice(startIndex, endIndex);
  };

  const handleItemsPerPageChange = (event: SelectChangeEvent) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleCreateNewSearch = () => {
    if (!newSearchName.trim()) return;

    const newSearch: JobSearch = {
      id: Date.now().toString(),
      name: newSearchName,
      isActive: true,
      opportunities: [],
      recruiters: [],
      resources: [],
      log: [],
      created: new Date().toISOString(), // This will be handled by database
    };

    // Set all other searches to inactive
    const updatedSearches = searches.map((s) => ({ ...s, isActive: false }));
    updatedSearches.push(newSearch);

    setSearches(updatedSearches);
    setCurrentSearch(newSearch);
    saveJobData(newSearch);
    setShowNewSearchDialog(false);
    setNewSearchName("");
  };

  const handleAddOpportunity = () => {
    if (!currentSearch || !opportunityForm.company || !opportunityForm.position)
      return;

    if (editingOpportunity) {
      // Update existing opportunity
      const statusChanged =
        (opportunityForm.status || editingOpportunity.status) !==
        editingOpportunity.status;

      const updatedOpportunity: JobOpportunity = {
        ...editingOpportunity,
        company: opportunityForm.company,
        position: opportunityForm.position,
        dateApplied: statusChanged
          ? getLocalDateString()
          : opportunityForm.dateApplied || editingOpportunity.dateApplied,
        status: opportunityForm.status || editingOpportunity.status,
        description: opportunityForm.description,
        jobUrl: opportunityForm.jobUrl,
        jobSource: opportunityForm.jobSource,
        salary: opportunityForm.salary,
        location: opportunityForm.location,
        notes: opportunityForm.notes,
      };

      let updatedSearch = {
        ...currentSearch,
        opportunities: currentSearch.opportunities.map((opp) =>
          opp.id === editingOpportunity.id ? updatedOpportunity : opp
        ),
      };

      // Add automated log entry if status changed
      if (statusChanged) {
        updatedSearch = addAutomatedLogEntry(
          updatedSearch,
          editingOpportunity.id,
          editingOpportunity.status,
          opportunityForm.status || editingOpportunity.status,
          opportunityForm.company || editingOpportunity.company,
          opportunityForm.position || editingOpportunity.position
        );
      }

      setCurrentSearch(updatedSearch);
      saveJobData(updatedSearch);
    } else {
      // Add new opportunity
      const newOpportunity: JobOpportunity = {
        id: Date.now().toString(),
        company: opportunityForm.company,
        position: opportunityForm.position,
        dateApplied: opportunityForm.dateApplied || getLocalDateString(),
        createdAt: new Date().toISOString(), // Track when opportunity was added
        status: opportunityForm.status || "saved",
        description: opportunityForm.description,
        jobUrl: opportunityForm.jobUrl,
        jobSource: opportunityForm.jobSource,
        salary: opportunityForm.salary,
        location: opportunityForm.location,
        interviews: [],
        contacts: [],
        notes: opportunityForm.notes,
      };

      let updatedSearch = {
        ...currentSearch,
        opportunities: [...currentSearch.opportunities, newOpportunity],
      };

      // Add automated log entry for new application
      updatedSearch = addAutomatedLogEntry(
        updatedSearch,
        newOpportunity.id,
        "", // No previous status for new opportunities
        newOpportunity.status,
        newOpportunity.company,
        newOpportunity.position
      );

      setCurrentSearch(updatedSearch);
      saveJobData(updatedSearch);
    }

    setShowOpportunityDialog(false);
    setOpportunityForm({});
    setEditingOpportunity(null);
    setIsJobSourceOther(false);
  };

  const handleDeleteOpportunity = (opportunityId: string) => {
    if (!currentSearch) return;

    const updatedSearch = {
      ...currentSearch,
      opportunities: currentSearch.opportunities.filter(
        (o) => o.id !== opportunityId
      ),
    };

    setCurrentSearch(updatedSearch);
    saveJobData(updatedSearch);
  };

  const handleQuickStatusChange = (
    opportunity: JobOpportunity,
    newStatus:
      | "saved"
      | "applied"
      | "interview"
      | "offer"
      | "rejected"
      | "closed"
  ) => {
    if (!currentSearch || opportunity.status === newStatus) return;

    const updatedOpportunity: JobOpportunity = {
      ...opportunity,
      status: newStatus,
    };

    let updatedSearch = {
      ...currentSearch,
      opportunities: currentSearch.opportunities.map((opp) =>
        opp.id === opportunity.id ? updatedOpportunity : opp
      ),
    };

    // Add automated log entry for status change
    updatedSearch = addAutomatedLogEntry(
      updatedSearch,
      opportunity.id,
      opportunity.status,
      newStatus,
      opportunity.company,
      opportunity.position
    );

    setCurrentSearch(updatedSearch);
    saveJobData(updatedSearch);

    // Close the menu
    setStatusChangeAnchor(null);
    setSelectedOpportunityForStatusChange(null);
  };

  const handleEditOpportunity = (opportunity: JobOpportunity) => {
    setEditingOpportunity(opportunity);
    setOpportunityForm(opportunity);

    // If no resources or recruiters available, always use text field
    const hasResources = (currentSearch?.resources?.length ?? 0) > 0;
    const hasRecruiters = (currentSearch?.recruiters?.length ?? 0) > 0;

    if (!hasResources && !hasRecruiters) {
      setIsJobSourceOther(true);
    } else {
      // Check if jobSource matches any resource name or recruiter format
      const resourceNames = currentSearch?.resources?.map((r) => r.name) || [];
      const recruiterNames =
        currentSearch?.recruiters?.map((r) => `Recruiter - ${r.name}`) || [];
      const allValidSources = [...resourceNames, ...recruiterNames];

      if (
        opportunity.jobSource &&
        !allValidSources.includes(opportunity.jobSource)
      ) {
        setIsJobSourceOther(true);
      } else {
        setIsJobSourceOther(false);
      }
    }

    setShowOpportunityDialog(true);
  };

  const handleAddLogEntry = () => {
    const now = new Date();
    // Format datetime-local value (YYYY-MM-DDTHH:MM)
    const localDateTime = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);

    setLogForm({ date: localDateTime });
    setShowLogDialog(true);
  };

  const handleAddInterview = (opportunity: JobOpportunity) => {
    const today = getLocalDateString(); // Get today's date in YYYY-MM-DD format
    setCurrentOpportunityForInterview(opportunity);
    setInterviewForm({ date: today }); // Set default date to today
    setShowInterviewDialog(true);
  };

  const handleSaveInterview = () => {
    if (
      !currentSearch ||
      !currentOpportunityForInterview ||
      !interviewForm.date ||
      !interviewForm.type
    )
      return;

    const newInterview: Interview = {
      id: Date.now().toString(),
      date: interviewForm.date,
      time: interviewForm.time || "",
      type: interviewForm.type,
      interviewer: interviewForm.interviewer || "",
      notes: interviewForm.notes,
    };

    const originalOpportunity = currentSearch.opportunities.find(
      (opp) => opp.id === currentOpportunityForInterview.id
    );

    const updatedOpportunities = currentSearch.opportunities.map((opp) =>
      opp.id === currentOpportunityForInterview.id
        ? {
            ...opp,
            interviews: [...opp.interviews, newInterview],
            status: "interview" as const, // Automatically update status to interview
          }
        : opp
    );

    let updatedSearch = {
      ...currentSearch,
      opportunities: updatedOpportunities,
    };

    // Add automated log entry if status changed to interview
    if (originalOpportunity && originalOpportunity.status !== "interview") {
      updatedSearch = addAutomatedLogEntry(
        updatedSearch,
        currentOpportunityForInterview.id,
        originalOpportunity.status,
        "interview",
        currentOpportunityForInterview.company,
        currentOpportunityForInterview.position
      );
    }

    setCurrentSearch(updatedSearch);
    saveJobData(updatedSearch);
    setShowInterviewDialog(false);
    setInterviewForm({});
    setCurrentOpportunityForInterview(null);
  };

  const handleAddContact = (opportunity: JobOpportunity) => {
    setCurrentOpportunityForContact(opportunity);
    setShowContactDialog(true);
  };

  const handleSaveContact = () => {
    if (
      !currentSearch ||
      !currentOpportunityForContact ||
      !contactForm.name ||
      !contactForm.role
    )
      return;

    const newContact: Contact = {
      id: Date.now().toString(),
      name: contactForm.name,
      role: contactForm.role,
      company: contactForm.company,
      email: contactForm.email,
      phone: contactForm.phone,
      notes: contactForm.notes,
    };

    const updatedOpportunities = currentSearch.opportunities.map((opp) =>
      opp.id === currentOpportunityForContact.id
        ? { ...opp, contacts: [...opp.contacts, newContact] }
        : opp
    );

    const updatedSearch = {
      ...currentSearch,
      opportunities: updatedOpportunities,
    };

    setCurrentSearch(updatedSearch);
    saveJobData(updatedSearch);
    setShowContactDialog(false);
    setContactForm({});
    setCurrentOpportunityForContact(null);
  };

  const handleDeleteContact = (opportunityId: string, contactId: string) => {
    if (!currentSearch) return;

    const updatedOpportunities = currentSearch.opportunities.map((opp) =>
      opp.id === opportunityId
        ? {
            ...opp,
            contacts: opp.contacts.filter(
              (contact) => contact.id !== contactId
            ),
          }
        : opp
    );

    const updatedSearch = {
      ...currentSearch,
      opportunities: updatedOpportunities,
    };

    setCurrentSearch(updatedSearch);
    saveJobData(updatedSearch);
  };

  const handleDeleteInterview = (
    opportunityId: string,
    interviewId: string
  ) => {
    if (!currentSearch) return;

    const updatedOpportunities = currentSearch.opportunities.map((opp) => {
      if (opp.id === opportunityId) {
        const updatedInterviews = opp.interviews.filter(
          (interview) => interview.id !== interviewId
        );

        // If no interviews left, revert status back to "applied"
        const newStatus =
          updatedInterviews.length === 0 ? ("applied" as const) : opp.status;

        return {
          ...opp,
          interviews: updatedInterviews,
          status: newStatus,
        };
      }
      return opp;
    });

    let updatedSearch = {
      ...currentSearch,
      opportunities: updatedOpportunities,
    };

    // Add automated log entry if status changed due to interview deletion
    const changedOpportunity = updatedOpportunities.find(
      (opp) => opp.id === opportunityId
    );
    const originalOpportunity = currentSearch.opportunities.find(
      (opp) => opp.id === opportunityId
    );

    if (
      changedOpportunity &&
      originalOpportunity &&
      changedOpportunity.status !== originalOpportunity.status
    ) {
      updatedSearch = addAutomatedLogEntry(
        updatedSearch,
        opportunityId,
        originalOpportunity.status,
        changedOpportunity.status,
        changedOpportunity.company,
        changedOpportunity.position
      );
    }

    setCurrentSearch(updatedSearch);
    saveJobData(updatedSearch);
  };

  const handleEditRecruiter = (recruiter: Recruiter) => {
    setRecruiterForm({
      name: recruiter.name,
      company: recruiter.company,
      email: recruiter.email,
      phone: recruiter.phone,
      specialty: recruiter.specialty,
      notes: recruiter.notes,
    });
    setEditingRecruiter(recruiter);
    setShowRecruiterDialog(true);
  };

  const handleDeleteRecruiter = (recruiterId: string) => {
    if (!currentSearch) return;

    const updatedRecruiters = currentSearch.recruiters.filter(
      (recruiter) => recruiter.id !== recruiterId
    );

    const updatedSearch = {
      ...currentSearch,
      recruiters: updatedRecruiters,
    };

    setCurrentSearch(updatedSearch);
    saveJobData(updatedSearch);
  };

  const handleDeleteResource = (resourceId: string) => {
    if (!currentSearch) return;

    const updatedResources = currentSearch.resources.filter(
      (resource) => resource.id !== resourceId
    );

    const updatedSearch = {
      ...currentSearch,
      resources: updatedResources,
    };

    setCurrentSearch(updatedSearch);
    saveJobData(updatedSearch);
  };

  const handleEditResource = (resource: OnlineResource) => {
    setEditingResource(resource);
    setResourceForm(resource);
    setShowResourceDialog(true);
  };

  // Log handler functions
  const addAutomatedLogEntry = (
    searchData: JobSearch,
    opportunityId: string,
    oldStatus: string,
    newStatus: string,
    companyName: string,
    position: string
  ) => {
    const newLogEntry: LogEntry = {
      id: Date.now().toString(),
      type: "status_change",
      date: new Date().toISOString(),
      description: oldStatus
        ? `Status changed from "${
            statusLabels[oldStatus as keyof typeof statusLabels] || oldStatus
          }" to "${
            statusLabels[newStatus as keyof typeof statusLabels] || newStatus
          }"`
        : `Job Added - Status set to "${
            statusLabels[newStatus as keyof typeof statusLabels] || newStatus
          }"`,
      notes: `Automated entry for ${position} at ${companyName}`,
      opportunityId: opportunityId,
    };

    return {
      ...searchData,
      log: [...(searchData.log || []), newLogEntry],
    };
  };

  const handleDeleteLog = (logId: string) => {
    if (!currentSearch) return;

    const updatedLog = currentSearch.log.filter(
      (logEntry) => logEntry.id !== logId
    );

    const updatedSearch = {
      ...currentSearch,
      log: updatedLog,
    };

    setCurrentSearch(updatedSearch);
    saveJobData(updatedSearch);
  };

  const handleExportLogData = () => {
    if (!currentSearch) return;

    const filteredLogEntries = getFilteredLogEntries();

    if (filteredLogEntries.length === 0) {
      alert("No log entries to export with current filters.");
      return;
    }

    // Create ASCII formatted text
    let asciiContent = "";

    // Add header
    asciiContent += "=".repeat(80) + "\n";
    asciiContent += `JOB SEARCH LOG: ${currentSearch.name}\n`;
    asciiContent += "=".repeat(80) + "\n";
    asciiContent += `Export Date: ${new Date().toLocaleDateString()}\n`;
    asciiContent += `Total Entries: ${filteredLogEntries.length}\n`;

    // Add date range if filters are applied
    if (logStartDate || logEndDate) {
      asciiContent += `Date Range: ${logStartDate || "Start"} to ${
        logEndDate || "End"
      }\n`;
    }

    if (logSearchQuery) {
      asciiContent += `Search Filter: "${logSearchQuery}"\n`;
    }

    asciiContent += "=".repeat(80) + "\n\n";

    // Add log entries
    filteredLogEntries.forEach((logEntry, index) => {
      const entryDate = new Date(logEntry.date);
      const formattedDate = entryDate.toLocaleDateString();
      const formattedTime = entryDate.toLocaleTimeString();

      asciiContent += `[${index + 1}] ${formattedDate} ${formattedTime}\n`;
      asciiContent += `-`.repeat(50) + "\n";
      asciiContent += `Type: ${logEntry.type
        .replace(/_/g, " ")
        .toUpperCase()}\n`;
      asciiContent += `Description: ${logEntry.description}\n`;

      if (logEntry.notes) {
        asciiContent += `Notes: ${logEntry.notes}\n`;
      }

      if (logEntry.opportunityId) {
        const opportunity = currentSearch.opportunities.find(
          (opp) => opp.id === logEntry.opportunityId
        );
        if (opportunity) {
          asciiContent += `Related Opportunity: ${opportunity.position} at ${opportunity.company}\n`;
        }
      }

      if (logEntry.recruiterId) {
        const recruiter = currentSearch.recruiters.find(
          (rec) => rec.id === logEntry.recruiterId
        );
        if (recruiter) {
          asciiContent += `Recruiter: ${recruiter.name} (${recruiter.company})\n`;
        }
      }

      if (logEntry.otherContact) {
        asciiContent += `Contact: ${logEntry.otherContact}\n`;
      }

      asciiContent += "\n";
    });

    asciiContent += "=".repeat(80) + "\n";
    asciiContent += "End of Log Export\n";
    asciiContent += "=".repeat(80) + "\n";

    // Create and download the file
    const blob = new Blob([asciiContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentSearch.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_log_export_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSearch = () => {
    if (!currentSearch) return;

    // Create export data
    const exportData = {
      searchName: currentSearch.name,
      startDate: currentSearch.created,
      exportDate: new Date().toISOString(),
      summary: {
        totalOpportunities: currentSearch.opportunities.length,
        total: statusCounts.total,
        applied: statusCounts.applied,
        saved: statusCounts.saved,
        closed: statusCounts.closed,
      },
      opportunities: currentSearch.opportunities.map((opp) => ({
        company: opp.company,
        position: opp.position,
        dateApplied: opp.dateApplied,
        status: statusLabels[opp.status],
        location: opp.location,
        salary: opp.salary,
        description: opp.description,
        jobUrl: opp.jobUrl,
        jobSource: opp.jobSource,
        notes: opp.notes,
        interviews: opp.interviews.map((interview) => ({
          type: interview.type,
          date: interview.date,
          time: interview.time,
          interviewer: interview.interviewer,
          notes: interview.notes,
        })),
        contacts: opp.contacts.map((contact) => ({
          name: contact.name,
          role: contact.role,
          company: contact.company,
          email: contact.email,
          phone: contact.phone,
          notes: contact.notes,
        })),
      })),
      recruiters: currentSearch.recruiters.map((recruiter) => ({
        name: recruiter.name,
        company: recruiter.company,
        specialty: recruiter.specialty,
        email: recruiter.email,
        phone: recruiter.phone,
        notes: recruiter.notes,
      })),
      resources: currentSearch.resources.map((resource) => ({
        name: resource.name,
        url: resource.url,
        category: resource.category,
        description: resource.description,
      })),
    };

    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentSearch.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_job_search_export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAsExcel = () => {
    if (!currentSearch) return;

    // Helper function to escape CSV fields
    const escapeCSVField = (field: string | number | null | undefined) => {
      const escaped = String(field || "").replace(/"/g, '""');
      return escaped.includes(",") ||
        escaped.includes('"') ||
        escaped.includes("\n")
        ? `"${escaped}"`
        : escaped;
    };

    // Helper function to convert array to CSV rows
    const arrayToCSV = (rows: (string | number | null | undefined)[][]) => {
      return rows
        .map((row: (string | number | null | undefined)[]) =>
          row.map(escapeCSVField).join(",")
        )
        .join("\n");
    };

    let csvContent = "";

    // ========== SUMMARY SECTION ==========
    csvContent += "JOB SEARCH SUMMARY\n";
    csvContent += `Search Name,${escapeCSVField(currentSearch.name)}\n`;
    csvContent += `Started On,${escapeCSVField(
      new Date(currentSearch.created).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    )}\n`;
    csvContent += `Export Date,${escapeCSVField(
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    )}\n`;
    csvContent += `Total Opportunities,${currentSearch.opportunities.length}\n`;
    csvContent += `Total Active,${statusCounts.total}\n`;
    csvContent += `Applied,${statusCounts.applied}\n`;
    csvContent += `Saved,${statusCounts.saved}\n`;
    csvContent += `Closed,${statusCounts.closed}\n`;
    csvContent += `Total Recruiters,${currentSearch.recruiters.length}\n`;
    csvContent += `Total Resources,${currentSearch.resources.length}\n`;
    csvContent += "\n\n";

    // ========== OPPORTUNITIES SECTION ==========
    csvContent += "OPPORTUNITIES\n";
    const opportunityRows = [];

    // Add header row for opportunities
    opportunityRows.push([
      "Company",
      "Position",
      "Date Applied",
      "Days Since Applied",
      "Status",
      "Location",
      "Salary",
      "Description",
      "Job URL",
      "Job Source",
      "Notes",
      "Interviews",
      "Contacts",
    ]);

    // Add opportunity rows
    currentSearch.opportunities.forEach((opp) => {
      const daysSince = getDaysSinceApplied(opp.dateApplied);
      const interviews = opp.interviews
        .map(
          (i) =>
            `${i.type} - ${new Date(i.date).toLocaleDateString()}${
              i.time ? " at " + i.time : ""
            }${i.interviewer ? " with " + i.interviewer : ""}`
        )
        .join("; ");

      const contacts = opp.contacts
        .map(
          (c) =>
            `${c.name}${c.role ? " (" + c.role + ")" : ""}${
              c.email ? " - " + c.email : ""
            }${c.phone ? " - " + c.phone : ""}`
        )
        .join("; ");

      opportunityRows.push([
        opp.company || "",
        opp.position || "",
        parseLocalDate(opp.dateApplied).toLocaleDateString(),
        `${daysSince} days`,
        statusLabels[opp.status] || "",
        opp.location || "",
        opp.salary || "",
        (opp.description || "").replace(/,/g, ";").replace(/\n/g, " "),
        opp.jobUrl || "",
        opp.jobSource || "",
        (opp.notes || "").replace(/,/g, ";").replace(/\n/g, " "),
        interviews,
        contacts,
      ]);
    });

    csvContent += arrayToCSV(opportunityRows);
    csvContent += "\n\n";

    // ========== RECRUITERS SECTION ==========
    csvContent += "RECRUITERS\n";
    const recruiterRows = [];

    // Add header row for recruiters
    recruiterRows.push([
      "Name",
      "Company",
      "Specialty",
      "Email",
      "Phone",
      "Notes",
    ]);

    // Add recruiter rows
    currentSearch.recruiters.forEach((recruiter) => {
      recruiterRows.push([
        recruiter.name || "",
        recruiter.company || "",
        recruiter.specialty || "",
        recruiter.email || "",
        recruiter.phone || "",
        (recruiter.notes || "").replace(/,/g, ";").replace(/\n/g, " "),
      ]);
    });

    csvContent += arrayToCSV(recruiterRows);
    csvContent += "\n\n";

    // ========== RESOURCES SECTION ==========
    csvContent += "ONLINE RESOURCES\n";
    const resourceRows = [];

    // Add header row for resources
    resourceRows.push(["Name", "URL", "Category", "Description"]);

    // Add resource rows
    currentSearch.resources.forEach((resource) => {
      resourceRows.push([
        resource.name || "",
        resource.url || "",
        resource.category || "",
        (resource.description || "").replace(/,/g, ";").replace(/\n/g, " "),
      ]);
    });

    csvContent += arrayToCSV(resourceRows);

    // Add BOM for proper Excel UTF-8 handling
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    // Create and download CSV file (Excel compatible)
    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentSearch.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_job_search_complete_export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAsPDF = async () => {
    if (!currentSearch) return;

    const filteredOpportunities = getFilteredOpportunities();

    try {
      // Import jsPDF
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.jsPDF;

      // Import autoTable plugin
      await import("jspdf-autotable");

      const doc = new jsPDF("landscape", "mm", "a4");

      // Add title
      doc.setFontSize(20);
      doc.setTextColor(25, 118, 210);
      doc.text(`Job Search Summary: ${currentSearch.name}`, 20, 25);

      // Add summary info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40);
      doc.text(
        `Total Opportunities: ${getFilteredOpportunities().length}`,
        20,
        50
      );
      doc.text(
        `Showing: ${
          filterStatus === "all"
            ? "All Statuses"
            : statusLabels[filterStatus as keyof typeof statusLabels]
        }`,
        20,
        60
      );

      // Helper function to convert to title case
      const toTitleCase = (str: string) => {
        return str.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      };

      // Prepare table data
      const tableData = getFilteredOpportunities().map((opportunity) => [
        opportunity.company.length > 32
          ? opportunity.company.substring(0, 32) + "..."
          : opportunity.company,
        opportunity.position.length > 32
          ? toTitleCase(opportunity.position.substring(0, 32)) + "..."
          : toTitleCase(opportunity.position),
        parseLocalDate(opportunity.dateApplied).toLocaleDateString(),
        statusLabels[opportunity.status as keyof typeof statusLabels],
        opportunity.jobSource || "N/A",
        opportunity.location || "N/A",
        opportunity.salary || "N/A",
      ]);

      // Check if autoTable is available and use it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (doc as any).autoTable === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doc as any).autoTable({
          head: [
            [
              "Company",
              "Position",
              "Last Changed",
              "Status",
              "Job Source",
              "Location",
              "Salary",
            ],
          ],
          body: tableData,
          startY: 75,
          theme: "striped",
          styles: {
            fontSize: 9,
            cellPadding: 4,
          },
          headStyles: {
            fillColor: [25, 118, 210],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250],
          },
          columnStyles: {
            0: { cellWidth: 40 }, // Company
            1: { cellWidth: 45 }, // Position
            2: { cellWidth: 25 }, // Last Changed
            3: { cellWidth: 22 }, // Status
            4: { cellWidth: 35 }, // Job Source
            5: { cellWidth: 35 }, // Location
            6: { cellWidth: 30 }, // Salary
          },
          margin: { left: 15, right: 15 },
        });
      } else {
        // Helper function for fallback table
        const toTitleCase = (str: string) => {
          return str.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
        };

        // Fallback: create a basic table manually
        let yPosition = 80;

        // Add table headers
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(25, 118, 210);
        doc.rect(20, yPosition - 5, 252, 10, "F");

        doc.text("Company", 25, yPosition);
        doc.text("Position", 70, yPosition);
        doc.text("Last Changed", 120, yPosition);
        doc.text("Status", 150, yPosition);
        doc.text("Job Source", 175, yPosition);
        doc.text("Location", 215, yPosition);
        doc.text("Salary", 250, yPosition);

        yPosition += 15;

        // Add table rows
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        filteredOpportunities.forEach((opportunity, index) => {
          if (yPosition > 180) {
            doc.addPage();
            yPosition = 20;
          }

          // Alternate row colors
          if (index % 2 === 0) {
            doc.setFillColor(248, 249, 250);
            doc.rect(20, yPosition - 5, 252, 10, "F");
          }

          const truncatedCompany =
            opportunity.company.length > 32
              ? opportunity.company.substring(0, 32) + "..."
              : opportunity.company;
          const truncatedPosition =
            opportunity.position.length > 32
              ? toTitleCase(opportunity.position.substring(0, 32)) + "..."
              : toTitleCase(opportunity.position);

          doc.text(truncatedCompany || "", 25, yPosition);
          doc.text(truncatedPosition, 70, yPosition);
          doc.text(
            parseLocalDate(opportunity.dateApplied).toLocaleDateString(),
            120,
            yPosition
          );
          doc.text(
            statusLabels[opportunity.status as keyof typeof statusLabels],
            150,
            yPosition
          );
          doc.text(opportunity.jobSource || "N/A", 175, yPosition);
          doc.text(opportunity.location || "N/A", 215, yPosition);
          doc.text(opportunity.salary || "N/A", 250, yPosition);

          yPosition += 12;
        });
      }

      // Save the PDF
      const fileName = `${currentSearch.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_opportunities_summary.pdf`;
      doc.save(fileName);

      console.log("PDF generated successfully");
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert(
        "PDF generation failed. Please try again or use CSV export instead."
      );
    }
  };

  const handleCloseJobSearch = async () => {
    if (!currentSearch) return;

    try {
      // Update the database to mark the search as closed
      const response = await fetch("/api/jobs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentSearch.id,
          closed: 1,
          closedDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Update local state
        const updatedSearch = {
          ...currentSearch,
          closed: 1,
          closedDate: new Date().toISOString(),
        };

        const updatedSearches = searches.map((search) =>
          search.id === currentSearch.id ? updatedSearch : search
        );

        setSearches(updatedSearches);
        setCurrentSearch(null); // This returns user to "Start a New Search" page
        localStorage.setItem(
          "jobTrackerSearches",
          JSON.stringify(updatedSearches)
        );
      } else {
        console.error("Failed to close job search");
      }
    } catch (error) {
      console.error("Error closing job search:", error);
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this job search? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Remove from API/database if needed
      const response = await fetch("/api/jobs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: searchId }),
      });

      if (response.ok || response.status === 404) {
        // Remove from local state
        const updatedSearches = searches.filter(
          (search) => search.id !== searchId
        );
        setSearches(updatedSearches);
        localStorage.setItem(
          "jobTrackerSearches",
          JSON.stringify(updatedSearches)
        );
      } else {
        console.error("Failed to delete job search");
        alert("Failed to delete job search. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting job search:", error);
      // Still remove from local storage even if API fails
      const updatedSearches = searches.filter(
        (search) => search.id !== searchId
      );
      setSearches(updatedSearches);
      localStorage.setItem(
        "jobTrackerSearches",
        JSON.stringify(updatedSearches)
      );
    }
  };

  const renderHeader = () => (
    <div className="flex items-center space-x-2 h-[61px] border-b border-gray-200 px-3 bg-white">
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
                      {IconComponent && <IconComponent sx={{ fontSize: 20 }} />}
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

      <h3 className="text-lg font-semibold text-gray-800">Job Tracker</h3>
    </div>
  );

  // Handle loading state
  if (status === "loading") {
    return (
      <div>
        {renderHeader()}
        {/* <div className="flex justify-center items-center h-96">
          <div className="text-xl">Loading...</div>
        </div> */}
        {renderFooter()}
      </div>
    );
  }
  console.log(session);

  // Handle unauthenticated state
  if (!session) {
    return (
      <div>
        {renderHeader()}
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-20">
            <WorkIcon sx={{ fontSize: 80, color: "#64748b", mb: 4 }} />
            <Typography
              variant="h3"
              component="h1"
              className="text-slate-800 mb-4"
            >
              Job Tracker
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "#64748b", // slate-600 equivalent
                marginBottom: 4, // equivalent to mb-8
                maxWidth: "42rem", // equivalent to max-w-2xl
                marginLeft: "auto",
                marginRight: "auto",
                textAlign: "center",
              }}
            >
              Track your job applications, interviews, and networking contacts
              all in one place. Organize your job search with detailed progress
              tracking and resource management.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => signIn("google")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Log In To Use
            </Button>
          </div>
        </div>
        {renderFooter()}
      </div>
    );
  }

  // Authenticated user content
  const statusCounts = getStatusCounts();
  const paginatedOpportunities = getPaginatedOpportunities();
  const totalPages = getTotalPages();
  const paginationInfo = getPaginationInfo();

  return (
    <div>
      {renderHeader()}

      {/* Auth UI - same pattern as FieldNotes */}
      <div className="flex justify-center sm:justify-end px-3 py-2 bg-white ">
        {(() => {
          if (status !== "authenticated") {
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
                {session?.user?.image && (
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
                Signed in as {session?.user?.name}
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

      <div className="max-w-7xl mx-auto p-6 min-h-screen bg-white">
        {/* Show loading state while data is being fetched */}
        {!hasLoadedData && session && (
          <div className="flex justify-center items-center h-96">
            <div className="text-xl text-gray-600">Loading job data...</div>
          </div>
        )}

        {hasLoadedData && currentSearch && (
          <div>
            {/* Search Title */}
            <div className="text-center mt-8 mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {currentSearch.name}
              </h1>
              <Typography variant="body1" className="text-gray-600">
                Started on{" "}
                {new Date(currentSearch.created).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Typography>
            </div>

            {/* Progress Table */}
            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <div className="w-full">
                  <div className="p-2 md:p-4 text-center bg-green-50 rounded">
                    <Typography
                      variant="h5"
                      className="text-green-600 font-bold text-lg md:text-3xl"
                    >
                      {statusCounts.total}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-green-700 text-xs md:text-base"
                    >
                      Total
                    </Typography>
                  </div>
                </div>
                <div className="w-full">
                  <div className="p-2 md:p-4 text-center bg-blue-50 rounded">
                    <Typography
                      variant="h5"
                      className="text-blue-600 font-bold text-lg md:text-3xl"
                    >
                      {statusCounts.applied}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-blue-700 text-xs md:text-base"
                    >
                      Applied
                    </Typography>
                  </div>
                </div>
                <div className="w-full">
                  <div className="p-2 md:p-4 text-center bg-purple-50 rounded">
                    <Typography
                      variant="h5"
                      className="text-purple-600 font-bold text-lg md:text-3xl"
                    >
                      {statusCounts.saved}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-purple-700 text-xs md:text-base"
                    >
                      Saved
                    </Typography>
                  </div>
                </div>
                <div className="w-full">
                  <div className="p-2 md:p-4 text-center bg-gray-50 rounded">
                    <Typography
                      variant="h5"
                      className="text-gray-600 font-bold text-lg md:text-3xl"
                    >
                      {statusCounts.closed}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-700 text-xs md:text-base"
                    >
                      Closed
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            {/* Opportunities Section */}
            <div className="mb-8 bg-gradient-to-b from-white to-gray-50 rounded-lg p-4">
              <div>
                {/* Add Opportunity Button and Filters - Mobile: stacked, Desktop: side by side */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowOpportunityDialog(true)}
                    className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                    size="large"
                  >
                    Add Opportunity
                  </Button>

                  <div className="flex flex-col sm:flex-row gap-2 w-full md:flex-1">
                    <TextField
                      size="small"
                      label="Search"
                      placeholder="Search company, position..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full md:flex-1"
                      style={{ minWidth: 300 }}
                      variant="outlined"
                    />

                    <FormControl
                      size="small"
                      className="w-full sm:w-auto"
                      style={{ minWidth: 120 }}
                    >
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={sortBy}
                        label="Sort By"
                        onChange={handleSortChange}
                      >
                        <MenuItem value="newest">Newest</MenuItem>
                        <MenuItem value="oldest">Oldest</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl
                      size="small"
                      className="w-full sm:w-auto"
                      style={{ minWidth: 120 }}
                    >
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filterStatus}
                        label="Status"
                        onChange={handleFilterChange}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="saved">Saved</MenuItem>
                        <MenuItem value="applied">Applied</MenuItem>
                        <MenuItem value="interview">Interview</MenuItem>
                        <MenuItem value="offer">Offer</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Download buttons: 50/50 on mobile */}
                    <div className="flex w-full gap-2 sm:w-auto">
                      <Button
                        onClick={handleExportAsPDF}
                        size="small"
                        title="Download PDF Summary"
                        startIcon={<FileDownloadIcon />}
                        className="w-1/2 sm:w-auto"
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                          padding: "8px",
                          color: "#1976d2",
                          minWidth: "auto",
                          "& .MuiButton-startIcon": {
                            marginRight: { xs: "8px", sm: "0px" },
                          },
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                          },
                        }}
                      >
                        PDF
                      </Button>
                      <Button
                        onClick={handleExportOpportunitiesAsTxt}
                        size="small"
                        title="Download ASCII Text Table"
                        startIcon={<FileDownloadIcon />}
                        className="w-1/2 sm:w-auto"
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                          padding: "8px",
                          color: "#1976d2",
                          minWidth: "auto",
                          "& .MuiButton-startIcon": {
                            marginRight: { xs: "8px", sm: "0px" },
                          },
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                          },
                        }}
                      >
                        TXT
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Opportunities Table - Desktop / Cards - Mobile */}

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  {getFilteredOpportunities().length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <WorkIcon className="mx-auto mb-2" fontSize="large" />
                      <Typography>No opportunities found</Typography>
                    </div>
                  ) : (
                    <TableContainer
                      component={Paper}
                      elevation={0}
                      sx={{
                        boxShadow: "none",
                        border: "none",
                        outline: "none",
                      }}
                    >
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell style={{ width: "30%" }}>
                              Company
                            </TableCell>
                            <TableCell style={{ width: "25%" }}>
                              Position
                            </TableCell>
                            <TableCell style={{ width: "12%" }}>
                              Last Changed
                            </TableCell>
                            <TableCell style={{ width: "10%" }}>
                              Days Open
                            </TableCell>
                            <TableCell style={{ width: "10%" }}>
                              Status
                            </TableCell>
                            <TableCell
                              style={{ width: "8%", textAlign: "right" }}
                            ></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedOpportunities.map((opportunity) => (
                            <React.Fragment key={opportunity.id}>
                              <TableRow
                                style={{
                                  backgroundColor: `${
                                    statusColors[opportunity.status]
                                  }10`,
                                }}
                                className="cursor-pointer hover:bg-gray-50"
                                sx={{
                                  "& td, & th": {
                                    borderBottom: "1px solid #F9FAFB", // Tailwind gray-200
                                  },
                                  "&:last-child td, &:last-child th": {
                                    borderBottom: 0,
                                  },
                                }}
                              >
                                <TableCell>{opportunity.company}</TableCell>
                                <TableCell>{opportunity.position}</TableCell>
                                <TableCell>
                                  {parseLocalDate(
                                    opportunity.dateApplied
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {getDaysSinceApplied(opportunity.dateApplied)}{" "}
                                  days
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={statusLabels[opportunity.status]}
                                    style={{
                                      backgroundColor:
                                        statusColors[opportunity.status],
                                      color: "white",
                                      cursor: "pointer",
                                    }}
                                    size="small"
                                    onClick={(e) => {
                                      setStatusChangeAnchor(e.currentTarget);
                                      setSelectedOpportunityForStatusChange(
                                        opportunity
                                      );
                                    }}
                                  />
                                </TableCell>
                                <TableCell style={{ textAlign: "right" }}>
                                  <IconButton
                                    onClick={() =>
                                      setExpandedRow(
                                        expandedRow === opportunity.id
                                          ? null
                                          : opportunity.id
                                      )
                                    }
                                  >
                                    {expandedRow === opportunity.id ? (
                                      <ExpandLessIcon />
                                    ) : (
                                      <ExpandMoreIcon />
                                    )}
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  style={{ paddingBottom: 0, paddingTop: 0 }}
                                  colSpan={7}
                                >
                                  <Collapse
                                    in={expandedRow === opportunity.id}
                                    timeout="auto"
                                    unmountOnExit
                                  >
                                    <Box className="p-4">
                                      {/* Two column layout */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column - Opportunity Details */}
                                        <div>
                                          <Typography
                                            variant="h6"
                                            style={{ marginBottom: "1.5rem" }}
                                          >
                                            Opportunity Details
                                          </Typography>

                                          {/* Description */}
                                          <div className="mb-4">
                                            <Typography
                                              variant="subtitle2"
                                              className="mb-2"
                                            >
                                              <span className="font-semibold">
                                                Description
                                              </span>
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              className="mb-2"
                                            >
                                              {opportunity.description ||
                                                "No description"}
                                            </Typography>
                                          </div>

                                          {/* Key-value pairs */}
                                          <div className="space-y-2 mb-4">
                                            <div>
                                              <Typography variant="body2">
                                                <span className="font-semibold">
                                                  Location:
                                                </span>{" "}
                                                {opportunity.location ||
                                                  "Not specified"}
                                              </Typography>
                                            </div>
                                            <div>
                                              <Typography variant="body2">
                                                <span className="font-semibold">
                                                  Salary:
                                                </span>{" "}
                                                {opportunity.salary ||
                                                  "Not specified"}
                                              </Typography>
                                            </div>
                                            {opportunity.jobUrl && (
                                              <div>
                                                <Typography variant="body2">
                                                  <span className="font-semibold">
                                                    Job Posting URL:
                                                  </span>{" "}
                                                  <a
                                                    href={opportunity.jobUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                  >
                                                    View Job Posting
                                                  </a>
                                                </Typography>
                                              </div>
                                            )}
                                            {opportunity.jobSource && (
                                              <div>
                                                <Typography variant="body2">
                                                  <span className="font-semibold">
                                                    Job Posting Source:
                                                  </span>{" "}
                                                  {opportunity.jobSource}
                                                </Typography>
                                              </div>
                                            )}
                                          </div>

                                          {/* Notes - only show if notes exist */}
                                          {opportunity.notes && (
                                            <div className="mb-4">
                                              <Typography
                                                variant="subtitle2"
                                                className="font-bold mb-2"
                                              >
                                                <span className="font-semibold">
                                                  Notes
                                                </span>
                                              </Typography>
                                              <Typography variant="body2">
                                                {opportunity.notes}
                                              </Typography>
                                            </div>
                                          )}
                                        </div>

                                        {/* Right Column - Interviews */}
                                        <div>
                                          <Typography
                                            variant="h6"
                                            className="mb-3"
                                          >
                                            Interviews (
                                            {opportunity.interviews.length})
                                          </Typography>

                                          {/* Interview list */}
                                          {opportunity.interviews.length > 0 ? (
                                            <div className="space-y-3 mb-6">
                                              {opportunity.interviews.map(
                                                (interview) => (
                                                  <div
                                                    key={interview.id}
                                                    className="rounded p-3 bg-gray-50"
                                                  >
                                                    <div className="flex justify-between">
                                                      <div className="flex-1">
                                                        {/* Date and Time */}
                                                        <Typography
                                                          variant="subtitle2"
                                                          className="text-gray-600 block leading-tight"
                                                        >
                                                          {new Date(
                                                            interview.date
                                                          ).toLocaleDateString()}
                                                          {interview.time &&
                                                            interview.time.trim() !==
                                                              "" &&
                                                            ` at ${interview.time}`}
                                                        </Typography>

                                                        {/* Interview Type */}
                                                        <Typography
                                                          variant="subtitle2"
                                                          className="font-semibold leading-tight"
                                                        >
                                                          {interview.type}
                                                        </Typography>

                                                        {/* Interviewer */}
                                                        {interview.interviewer && (
                                                          <Typography
                                                            variant="body2"
                                                            className="text-gray-600 leading-tight"
                                                          >
                                                            <span className="font-medium">
                                                              Interviewer:
                                                            </span>{" "}
                                                            {
                                                              interview.interviewer
                                                            }
                                                          </Typography>
                                                        )}

                                                        {/* Notes */}
                                                        {interview.notes && (
                                                          <Typography
                                                            variant="body2"
                                                            className="text-gray-600 mt-2"
                                                          >
                                                            <span className="font-medium">
                                                              Notes:
                                                            </span>{" "}
                                                            {interview.notes}
                                                          </Typography>
                                                        )}
                                                      </div>

                                                      {/* Delete button */}
                                                      <div
                                                        className="flex items-start justify-center"
                                                        style={{
                                                          height: "100%",
                                                          alignSelf: "center",
                                                        }}
                                                      >
                                                        <IconButton
                                                          size="small"
                                                          onClick={() =>
                                                            handleDeleteInterview(
                                                              opportunity.id,
                                                              interview.id
                                                            )
                                                          }
                                                          style={{
                                                            color: "#6b7280",
                                                            marginTop: "8px",
                                                          }}
                                                          className="ml-2"
                                                        >
                                                          <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          ) : (
                                            <Typography
                                              variant="body2"
                                              className="text-gray-500 mb-6"
                                            >
                                              No interviews scheduled
                                            </Typography>
                                          )}

                                          <Typography
                                            variant="h6"
                                            className="mb-3 mt-6"
                                            style={{ marginTop: "1.5rem" }}
                                          >
                                            Contacts (
                                            {opportunity.contacts.length})
                                          </Typography>

                                          {/* Contact list */}
                                          {opportunity.contacts.length > 0 ? (
                                            <div className="space-y-3 mb-4">
                                              {opportunity.contacts.map(
                                                (contact) => (
                                                  <div
                                                    key={contact.id}
                                                    className="rounded p-3 bg-gray-50"
                                                  >
                                                    <div className="flex justify-between items-center">
                                                      <div className="flex-1">
                                                        {/* Name, Role, and Company on first line */}
                                                        <Typography
                                                          variant="body2"
                                                          className="font-semibold mb-1"
                                                        >
                                                          {contact.name}
                                                          {contact.role &&
                                                            `, ${contact.role}`}
                                                          {contact.company &&
                                                            `, ${contact.company}`}
                                                        </Typography>

                                                        {/* Email and Phone on same line */}
                                                        {(contact.email ||
                                                          contact.phone) && (
                                                          <div className="mb-1">
                                                            {contact.email && (
                                                              <a
                                                                href={`mailto:${contact.email}`}
                                                                className="text-blue-600 hover:underline"
                                                              >
                                                                {contact.email}
                                                              </a>
                                                            )}
                                                            {contact.phone && (
                                                              <span>
                                                                {contact.email &&
                                                                  " "}
                                                                <a
                                                                  href={`tel:${contact.phone}`}
                                                                  className="text-blue-600 hover:underline"
                                                                >
                                                                  {formatPhoneNumber(
                                                                    contact.phone
                                                                  )}
                                                                </a>
                                                              </span>
                                                            )}
                                                          </div>
                                                        )}

                                                        {/* Notes if available */}
                                                        {contact.notes && (
                                                          <Typography
                                                            variant="body2"
                                                            className="text-gray-600 mt-2"
                                                          >
                                                            <span className="font-medium">
                                                              Notes:
                                                            </span>{" "}
                                                            {contact.notes}
                                                          </Typography>
                                                        )}
                                                      </div>

                                                      {/* Delete button */}
                                                      <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                          handleDeleteContact(
                                                            opportunity.id,
                                                            contact.id
                                                          )
                                                        }
                                                        style={{
                                                          color: "#6b7280",
                                                        }}
                                                        className="ml-2"
                                                      >
                                                        <DeleteIcon fontSize="small" />
                                                      </IconButton>
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          ) : (
                                            <Typography
                                              variant="body2"
                                              className="text-gray-500 mb-4"
                                            >
                                              No contacts added
                                            </Typography>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex justify-end space-x-3 pt-6 px-0 pb-2 gap-2">
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          className="px-4 py-2"
                                          onClick={() =>
                                            handleEditOpportunity(opportunity)
                                          }
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          className="px-4 py-2"
                                          onClick={() =>
                                            handleAddInterview(opportunity)
                                          }
                                        >
                                          Add Interview
                                        </Button>
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          className="px-4 py-2"
                                          onClick={() =>
                                            handleAddContact(opportunity)
                                          }
                                        >
                                          Add Contact
                                        </Button>
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            handleDeleteOpportunity(
                                              opportunity.id
                                            )
                                          }
                                          className="ml-2 p-2"
                                          style={{ color: "#dc2626" }}
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      </div>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {paginatedOpportunities.map((opportunity) => (
                    <Card
                      key={opportunity.id}
                      elevation={0}
                      sx={{
                        boxShadow: "none",
                        border: "none",
                        outline: "none",
                      }}
                      style={{
                        backgroundColor: `${
                          statusColors[opportunity.status]
                        }08`,
                        boxShadow: "none",
                        border: "none",
                        outline: "none",
                      }}
                    >
                      <CardContent
                        sx={{
                          paddingBottom: "0 !important",
                        }}
                      >
                        {/* Card Header */}
                        <div className="space-y-1 mb-3">
                          <Typography
                            variant="h6"
                            className="font-semibold"
                            sx={{
                              fontSize: "16px",
                              fontStyle: "bold",
                              width: "100%",
                            }}
                          >
                            {opportunity.company}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            className="text-gray-700"
                            sx={{ fontSize: "14px", width: "100%" }}
                          >
                            {opportunity.position}
                          </Typography>

                          {/* Date Info */}
                          <div className="mt-2 text-sm text-gray-600">
                            <span>
                              {parseLocalDate(
                                opportunity.dateApplied
                              ).toLocaleDateString()}{" "}
                              ({getDaysSinceApplied(opportunity.dateApplied)}{" "}
                              days ago)
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <Chip
                              label={statusLabels[opportunity.status]}
                              style={{
                                backgroundColor:
                                  statusColors[opportunity.status],
                                color: "white",
                                cursor: "pointer",
                              }}
                              size="small"
                              onClick={(e) => {
                                setStatusChangeAnchor(e.currentTarget);
                                setSelectedOpportunityForStatusChange(
                                  opportunity
                                );
                              }}
                            />
                            <IconButton
                              onClick={() =>
                                setExpandedRow(
                                  expandedRow === opportunity.id
                                    ? null
                                    : opportunity.id
                                )
                              }
                              size="small"
                            >
                              {expandedRow === opportunity.id ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="hidden sm:grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Date Changed</span>
                            <div className="font-medium">
                              {parseLocalDate(
                                opportunity.dateApplied
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Days Open:</span>
                            <div className="font-medium">
                              {getDaysSinceApplied(opportunity.dateApplied)}{" "}
                              days
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <Collapse
                          in={expandedRow === opportunity.id}
                          timeout="auto"
                          unmountOnExit
                        >
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            {/* Two column layout */}
                            <div className="space-y-4">
                              {/* Opportunity Details */}
                              <div>
                                <Typography
                                  variant="subtitle1"
                                  className="font-semibold mb-2"
                                >
                                  Opportunity Details
                                </Typography>

                                {/* Description */}
                                <div className="mb-3">
                                  <Typography
                                    variant="body2"
                                    className="text-gray-600 mb-1"
                                  >
                                    <span className="font-medium">
                                      Description:
                                    </span>
                                  </Typography>
                                  <Typography variant="body2">
                                    {opportunity.description ||
                                      "No description"}
                                  </Typography>
                                </div>

                                {/* Key-value pairs */}
                                <div className="space-y-2 mb-3">
                                  <Typography variant="body2">
                                    <span className="font-medium">
                                      Location:
                                    </span>{" "}
                                    {opportunity.location || "Not specified"}
                                  </Typography>
                                  <Typography variant="body2">
                                    <span className="font-medium">Salary:</span>{" "}
                                    {opportunity.salary || "Not specified"}
                                  </Typography>
                                  {opportunity.jobUrl && (
                                    <Typography variant="body2">
                                      <span className="font-medium">
                                        Job Posting URL:
                                      </span>{" "}
                                      <a
                                        href={opportunity.jobUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        View Job Posting
                                      </a>
                                    </Typography>
                                  )}
                                  {opportunity.jobSource && (
                                    <Typography variant="body2">
                                      <span className="font-medium">
                                        Job Posting Source:
                                      </span>{" "}
                                      {opportunity.jobSource}
                                    </Typography>
                                  )}
                                </div>

                                {/* Notes */}
                                {opportunity.notes && (
                                  <div className="mb-4">
                                    <Typography
                                      variant="body2"
                                      className="text-gray-600 mb-1"
                                    >
                                      <span className="font-medium">
                                        Notes:
                                      </span>
                                    </Typography>
                                    <Typography variant="body2">
                                      {opportunity.notes}
                                    </Typography>
                                  </div>
                                )}
                              </div>

                              {/* Interviews Section */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <Typography
                                    variant="subtitle1"
                                    className="font-semibold"
                                  >
                                    Interviews ({opportunity.interviews.length})
                                  </Typography>
                                  <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() =>
                                      handleAddInterview(opportunity)
                                    }
                                    className="text-blue-600"
                                  >
                                    Add
                                  </Button>
                                </div>

                                {opportunity.interviews.length > 0 ? (
                                  <div className="space-y-2">
                                    {opportunity.interviews.map((interview) => (
                                      <div
                                        key={interview.id}
                                        className="rounded p-2 bg-gray-50"
                                      >
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <Typography
                                              variant="body2"
                                              className="font-medium"
                                            >
                                              {interview.type}
                                            </Typography>
                                            <Typography
                                              variant="caption"
                                              className="text-gray-600"
                                            >
                                              {new Date(
                                                interview.date
                                              ).toLocaleDateString()}
                                              {interview.time &&
                                                ` at ${interview.time}`}
                                            </Typography>
                                            {interview.interviewer && (
                                              <Typography
                                                variant="caption"
                                                className="block text-gray-600"
                                              >
                                                {interview.interviewer}
                                              </Typography>
                                            )}
                                          </div>
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleDeleteInterview(
                                                opportunity.id,
                                                interview.id
                                              )
                                            }
                                            className="text-gray-400"
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    className="text-gray-500 italic"
                                  >
                                    No interviews scheduled
                                  </Typography>
                                )}
                              </div>

                              {/* Contacts Section */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <Typography
                                    variant="subtitle1"
                                    className="font-semibold"
                                  >
                                    Contacts ({opportunity.contacts.length})
                                  </Typography>
                                  <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() =>
                                      handleAddContact(opportunity)
                                    }
                                    className="text-blue-600"
                                  >
                                    Add
                                  </Button>
                                </div>

                                {opportunity.contacts.length > 0 ? (
                                  <div className="space-y-2">
                                    {opportunity.contacts.map((contact) => (
                                      <div
                                        key={contact.id}
                                        className="rounded p-2 bg-gray-50"
                                      >
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <Typography
                                              variant="body2"
                                              className="font-medium"
                                            >
                                              {contact.name}
                                            </Typography>
                                            <Typography
                                              variant="caption"
                                              className="text-gray-600 block"
                                            >
                                              {contact.role}{" "}
                                              {contact.company &&
                                                `at ${contact.company}`}
                                            </Typography>
                                            {contact.email && (
                                              <a
                                                href={`mailto:${contact.email}`}
                                                className="text-blue-600 hover:underline text-xs block"
                                              >
                                                {contact.email}
                                              </a>
                                            )}
                                            {contact.phone && (
                                              <a
                                                href={`tel:${contact.phone}`}
                                                className="text-blue-600 hover:underline text-xs block"
                                              >
                                                {formatPhoneNumber(
                                                  contact.phone
                                                )}
                                              </a>
                                            )}
                                          </div>
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleDeleteContact(
                                                opportunity.id,
                                                contact.id
                                              )
                                            }
                                            className="text-gray-400"
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    className="text-gray-500 italic"
                                  >
                                    No contacts added
                                  </Typography>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                                <Button
                                  size="small"
                                  startIcon={<EditIcon />}
                                  onClick={() =>
                                    handleEditOpportunity(opportunity)
                                  }
                                  variant="outlined"
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<DeleteIcon />}
                                  onClick={() =>
                                    handleDeleteOpportunity(opportunity.id)
                                  }
                                  variant="outlined"
                                  color="error"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Collapse>
                      </CardContent>
                    </Card>
                  ))}

                  {paginatedOpportunities.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <WorkIcon className="mx-auto mb-2" fontSize="large" />
                      <Typography>No opportunities found</Typography>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {getFilteredOpportunities().length > 0 && (
                  <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Typography variant="body2" className="text-gray-600">
                      {paginationInfo}
                    </Typography>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {totalPages > 1 && (
                        <Pagination
                          count={totalPages}
                          page={currentPage}
                          onChange={(event, value) => setCurrentPage(value)}
                          color="primary"
                          showFirstButton
                          showLastButton
                        />
                      )}

                      <div className="flex items-center gap-2">
                        <Typography variant="body2" className="text-gray-600">
                          Items per page:
                        </Typography>
                        <FormControl size="small" style={{ minWidth: 80 }}>
                          <Select
                            value={itemsPerPage.toString()}
                            onChange={handleItemsPerPageChange}
                            variant="outlined"
                          >
                            <MenuItem value="10">10</MenuItem>
                            <MenuItem value="20">20</MenuItem>
                            <MenuItem value="50">50</MenuItem>
                            <MenuItem value="100">100</MenuItem>
                            <MenuItem value="250">250</MenuItem>
                          </Select>
                        </FormControl>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tracking Log Section */}
            <div className="mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-4">
                  {/* Mobile layout: Stack vertically */}
                  <div className="block md:hidden">
                    <div
                      className="flex items-center gap-2 cursor-pointer mb-4"
                      onClick={() => setIsLogExpanded(!isLogExpanded)}
                    >
                      {isLogExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      <Typography variant="h6" className="text-gray-700">
                        ({(currentSearch.log || []).length}) Tracking Log
                      </Typography>
                    </div>

                    {isLogExpanded && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddLogEntry()}
                        className="bg-blue-600 hover:bg-blue-700 w-full"
                        size="large"
                      >
                        Add Log Entry
                      </Button>
                    )}
                  </div>

                  {/* Desktop layout: Same line with button right-justified */}
                  <div className="hidden md:flex justify-between items-center">
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => setIsLogExpanded(!isLogExpanded)}
                    >
                      {isLogExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      <Typography variant="h6" className="text-gray-700">
                        ({(currentSearch.log || []).length}) Tracking Log
                      </Typography>
                    </div>

                    {isLogExpanded && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddLogEntry()}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="large"
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </div>

                {isLogExpanded && (
                  <>
                    {/* Filter Controls - Responsive for mobile and desktop */}
                    <Box
                      className="mb-4"
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        alignItems: { sm: "center" },
                      }}
                    >
                      <TextField
                        placeholder="Search log entries..."
                        value={logSearchQuery}
                        onChange={(e) => {
                          setLogSearchQuery(e.target.value);
                          setLogCurrentPage(1);
                        }}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      />
                      {/* Date fields row for mobile (xs) */}
                      <Box
                        sx={{
                          display: { xs: "flex", sm: "none" },
                          flexDirection: "row",
                          gap: 2,
                          width: "100%",
                        }}
                      >
                        <TextField
                          type="date"
                          label="Start Date"
                          value={logStartDate}
                          onChange={(e) => {
                            setLogStartDate(e.target.value);
                            setLogCurrentPage(1);
                          }}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          sx={{ width: "50%" }}
                        />
                        <TextField
                          type="date"
                          label="End Date"
                          value={logEndDate}
                          onChange={(e) => {
                            setLogEndDate(e.target.value);
                            setLogCurrentPage(1);
                          }}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          sx={{ width: "50%" }}
                        />
                      </Box>
                      {/* Desktop controls group (sm and up) */}
                      <Box
                        sx={{
                          display: { xs: "none", sm: "flex" },
                          gap: 1,
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <TextField
                            type="date"
                            label="Start Date"
                            value={logStartDate}
                            onChange={(e) => {
                              setLogStartDate(e.target.value);
                              setLogCurrentPage(1);
                            }}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            sx={{
                              width: 130,
                              minWidth: 130,
                            }}
                          />
                          <TextField
                            type="date"
                            label="End Date"
                            value={logEndDate}
                            onChange={(e) => {
                              setLogEndDate(e.target.value);
                              setLogCurrentPage(1);
                            }}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            sx={{
                              width: 130,
                              minWidth: 130,
                            }}
                          />
                        </Box>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setLogStartDate("");
                            setLogEndDate("");
                            setLogSearchQuery("");
                            setLogCurrentPage(1);
                          }}
                          size="small"
                          sx={{
                            height: 40,
                            px: 2,
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleExportLogData}
                          size="small"
                          startIcon={<FileDownloadIcon />}
                          sx={{
                            height: 40,
                          }}
                          title="Export filtered log data as text file"
                        >
                          TXT
                        </Button>
                      </Box>
                    </Box>

                    <div className="space-y-3">
                      {getPaginatedLogEntries().map((logEntry) => {
                        return (
                          <div
                            key={logEntry.id}
                            className="bg-white rounded-lg p-3"
                          >
                            {/* Mobile layout: Stack content vertically */}
                            <div className="block md:hidden">
                              {/* Line 1: Status and Date */}
                              <div className="flex items-center gap-2 mb-1">
                                <Chip
                                  label={logEntry.type
                                    .replace("_", " ")
                                    .toUpperCase()}
                                  size="small"
                                  sx={{ fontSize: "12px" }}
                                  color={
                                    logEntry.type === "interview"
                                      ? "warning"
                                      : logEntry.type === "phone_call"
                                      ? "info"
                                      : logEntry.type === "status_change"
                                      ? "success"
                                      : "default"
                                  }
                                />
                                <Typography
                                  sx={{ fontSize: "12px", color: "black" }}
                                >
                                  {new Date(logEntry.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </Typography>
                              </div>

                              {/* Line 2: Position/Company (if available) */}
                              {logEntry.opportunityId && (
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: "black",
                                    marginBottom: "4px",
                                  }}
                                >
                                  {(() => {
                                    const opportunity =
                                      currentSearch.opportunities.find(
                                        (opp) =>
                                          opp.id === logEntry.opportunityId
                                      );
                                    if (opportunity) {
                                      return `${opportunity.position} at ${opportunity.company}`;
                                    }
                                    return "Unknown Position at Unknown Company";
                                  })()}
                                </Typography>
                              )}

                              {/* Line 3: Description/Notes */}
                              {logEntry.type === "phone_call" ? (
                                <div>
                                  <Typography
                                    sx={{
                                      fontSize: "12px",
                                      color: "black",
                                      fontWeight: "medium",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    {logEntry.recruiterId
                                      ? `${
                                          currentSearch.recruiters.find(
                                            (rec) =>
                                              rec.id === logEntry.recruiterId
                                          )?.name || "Unknown Recruiter"
                                        } Call`
                                      : "Recruiter Call"}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: "12px",
                                      color: "black",
                                    }}
                                  >
                                    {logEntry.description}
                                  </Typography>
                                </div>
                              ) : logEntry.type === "email" ? (
                                <div>
                                  <Typography
                                    sx={{
                                      fontSize: "12px",
                                      color: "black",
                                      fontWeight: "medium",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    {logEntry.otherContact
                                      ? `Email to ${logEntry.otherContact}`
                                      : logEntry.recruiterId
                                      ? `Email to ${
                                          currentSearch.recruiters.find(
                                            (rec) =>
                                              rec.id === logEntry.recruiterId
                                          )?.name || "Unknown Recruiter"
                                        }`
                                      : "Email"}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: "12px",
                                      color: "black",
                                    }}
                                  >
                                    {logEntry.description}
                                  </Typography>
                                </div>
                              ) : (
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: "black",
                                  }}
                                >
                                  {logEntry.description}
                                </Typography>
                              )}

                              {/* Notes if available */}
                              {logEntry.notes && (
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: "gray",
                                    marginTop: "4px",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {logEntry.notes}
                                </Typography>
                              )}
                            </div>

                            {/* Desktop layout: Keep existing layout */}
                            <div className="hidden md:flex items-start justify-between">
                              {/* Log entry content */}
                              <div className="flex-1">
                                {/* First line: Type, Date, and context */}
                                <div className="flex items-center gap-3">
                                  <Chip
                                    label={logEntry.type
                                      .replace("_", " ")
                                      .toUpperCase()}
                                    size="small"
                                    sx={{ fontSize: "12px" }}
                                    color={
                                      logEntry.type === "interview"
                                        ? "warning"
                                        : logEntry.type === "phone_call"
                                        ? "info"
                                        : logEntry.type === "status_change"
                                        ? "success"
                                        : "default"
                                    }
                                  />
                                  <Typography
                                    sx={{ fontSize: "12px", color: "black" }}
                                  >
                                    {new Date(logEntry.date).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </Typography>
                                  {logEntry.type === "phone_call" ? (
                                    <Typography
                                      sx={{
                                        fontSize: "12px",
                                        color: "black",
                                        fontWeight: "medium",
                                      }}
                                    >
                                      {logEntry.recruiterId
                                        ? `${
                                            currentSearch.recruiters.find(
                                              (rec) =>
                                                rec.id === logEntry.recruiterId
                                            )?.name || "Unknown Recruiter"
                                          } Call`
                                        : "Recruiter Call"}
                                    </Typography>
                                  ) : logEntry.type === "email" ? (
                                    <Typography
                                      sx={{
                                        fontSize: "12px",
                                        color: "black",
                                        fontWeight: "medium",
                                      }}
                                    >
                                      {logEntry.otherContact
                                        ? `Email to ${logEntry.otherContact}`
                                        : logEntry.recruiterId
                                        ? `Email to ${
                                            currentSearch.recruiters.find(
                                              (rec) =>
                                                rec.id === logEntry.recruiterId
                                            )?.name || "Unknown Recruiter"
                                          }`
                                        : "Email"}
                                    </Typography>
                                  ) : (
                                    <Typography
                                      sx={{
                                        fontSize: "12px",
                                        color: "black",
                                        fontWeight: "medium",
                                      }}
                                    >
                                      {logEntry.description}
                                    </Typography>
                                  )}
                                </div>

                                {/* Phone call description on separate line */}
                                {logEntry.type === "phone_call" && (
                                  <Typography
                                    sx={{
                                      fontSize: "12px",
                                      color: "black",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {logEntry.description}
                                  </Typography>
                                )}

                                {/* Email description on separate line */}
                                {logEntry.type === "email" && (
                                  <Typography
                                    sx={{
                                      fontSize: "12px",
                                      color: "black",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {logEntry.description}
                                  </Typography>
                                )}

                                {/* Second line: Company and Position */}
                                {logEntry.opportunityId && (
                                  <Typography
                                    sx={{
                                      fontSize: "12px",
                                      color: "black",
                                      marginTop: "8px",
                                    }}
                                  >
                                    {(() => {
                                      const opportunity =
                                        currentSearch.opportunities.find(
                                          (opp) =>
                                            opp.id === logEntry.opportunityId
                                        );
                                      if (opportunity) {
                                        return `${opportunity.position} at ${opportunity.company}`;
                                      }
                                      return "Unknown Position at Unknown Company";
                                    })()}
                                  </Typography>
                                )}

                                {/* Recruiter info if applicable (not for phone calls since it's already shown) */}
                                {logEntry.recruiterId &&
                                  logEntry.type !== "phone_call" && (
                                    <Typography
                                      sx={{
                                        fontSize: "12px",
                                        color: "black",
                                        marginTop: "2px",
                                      }}
                                    >
                                      Recruiter:{" "}
                                      {currentSearch.recruiters.find(
                                        (rec) => rec.id === logEntry.recruiterId
                                      )?.name || "Unknown Recruiter"}
                                    </Typography>
                                  )}

                                {/* Notes if available */}
                                {logEntry.notes && (
                                  <Typography
                                    sx={{
                                      fontSize: "12px",
                                      color: "gray",
                                      marginTop: "4px",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    {logEntry.notes}
                                  </Typography>
                                )}
                              </div>

                              {/* Actions - Only visible on desktop */}
                              <div className="flex space-x-1">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingLog(logEntry);
                                    setLogForm(logEntry);
                                    // Handle email editing state
                                    if (
                                      logEntry.type === "email" &&
                                      logEntry.otherContact
                                    ) {
                                      setShowEmailRecruiterOther(true);
                                      setEmailOtherContact(
                                        logEntry.otherContact
                                      );
                                    } else {
                                      setShowEmailRecruiterOther(false);
                                      setEmailOtherContact("");
                                    }
                                    setShowLogDialog(true);
                                  }}
                                  sx={{ color: "gray" }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteLog(logEntry.id)}
                                  sx={{ color: "gray" }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {(currentSearch?.log || []).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <LogIcon className="mx-auto mb-2" fontSize="large" />
                          <Typography>No log entries added yet</Typography>
                        </div>
                      )}

                      {/* Log Pagination */}
                      {(currentSearch?.log || []).length > 0 && (
                        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <Typography variant="body2" className="text-gray-600">
                            {getLogPaginationInfo()}
                          </Typography>

                          <div className="flex flex-col sm:flex-row items-center gap-4">
                            {getLogTotalPages() > 1 && (
                              <Pagination
                                count={getLogTotalPages()}
                                page={logCurrentPage}
                                onChange={(event, value) =>
                                  setLogCurrentPage(value)
                                }
                                color="primary"
                                showFirstButton
                                showLastButton
                              />
                            )}

                            <div className="flex items-center gap-2">
                              <Typography
                                variant="body2"
                                className="text-gray-600"
                              >
                                Items per page:
                              </Typography>
                              <FormControl
                                size="small"
                                style={{ minWidth: 80 }}
                              >
                                <Select
                                  value={logItemsPerPage.toString()}
                                  onChange={handleLogItemsPerPageChange}
                                  variant="outlined"
                                >
                                  <MenuItem value="5">5</MenuItem>
                                  <MenuItem value="10">10</MenuItem>
                                  <MenuItem value="25">25</MenuItem>
                                  <MenuItem value="50">50</MenuItem>
                                </Select>
                              </FormControl>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Recruiters and Resources Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recruiters Section */}
              <div className="w-full">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() =>
                        setIsRecruitersExpanded(!isRecruitersExpanded)
                      }
                    >
                      <div className="flex items-center gap-2">
                        {isRecruitersExpanded ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                        <Typography variant="h6" className="text-gray-700">
                          ({currentSearch.recruiters.length}) Recruiters
                        </Typography>
                      </div>
                    </div>
                    {isRecruitersExpanded && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowRecruiterDialog(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                        size="large"
                      >
                        Add
                      </Button>
                    )}
                  </div>

                  {isRecruitersExpanded && (
                    <div className="space-y-3">
                      {currentSearch.recruiters.map((recruiter) => (
                        <div
                          key={recruiter.id}
                          className="bg-gray-100 rounded-lg p-3"
                        >
                          <div>
                            {/* Mobile: Icons above content, Desktop: Icons on the right */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                              {/* Icons - Mobile: top, Desktop: right */}
                              <div className="flex space-x-1 justify-end md:order-2 md:self-start mb-2 md:mb-0">
                                {recruiter.notes?.trim() && (
                                  <IconButton
                                    size="small"
                                    className="text-orange-500 hover:text-orange-600"
                                    onClick={() =>
                                      handleEditRecruiter(recruiter)
                                    }
                                    title="View/Edit Notes"
                                  >
                                    <NotesIcon fontSize="small" />
                                  </IconButton>
                                )}
                                <IconButton
                                  size="small"
                                  className="text-gray-400 hover:text-gray-600"
                                  onClick={() => handleEditRecruiter(recruiter)}
                                  title="Edit Recruiter"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  className="text-gray-400 hover:text-red-500"
                                  onClick={() =>
                                    handleDeleteRecruiter(recruiter.id)
                                  }
                                  title="Delete Recruiter"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>

                              {/* Content - Mobile: below icons, Desktop: left side */}
                              <div className="flex items-start space-x-3 flex-1 md:order-1">
                                <div className="hidden md:block">
                                  <Avatar className="bg-purple-100 text-purple-600 mt-1">
                                    <PersonIcon />
                                  </Avatar>
                                </div>
                                <div className="flex-1 min-h-[80px]">
                                  <Typography
                                    variant="subtitle1"
                                    className="font-semibold leading-5"
                                  >
                                    {recruiter.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    className="text-gray-600 leading-5 mt-1"
                                  >
                                    {recruiter.company}
                                  </Typography>
                                  {recruiter.specialty && (
                                    <Typography
                                      variant="caption"
                                      className="text-gray-500 leading-4 block mt-1"
                                    >
                                      {recruiter.specialty}
                                    </Typography>
                                  )}
                                  <div className="flex flex-col space-y-1 mt-2">
                                    {recruiter.email && (
                                      <a
                                        href={`mailto:${recruiter.email}`}
                                        className="text-blue-600 hover:underline text-sm"
                                      >
                                        {recruiter.email}
                                      </a>
                                    )}
                                    {recruiter.phone && (
                                      <a
                                        href={`tel:${recruiter.phone}`}
                                        className="text-blue-600 hover:underline text-sm"
                                      >
                                        {formatPhoneNumber(recruiter.phone)}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {currentSearch.recruiters.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <PersonIcon
                            className="mx-auto mb-2"
                            fontSize="large"
                          />
                          <Typography>No recruiters added yet</Typography>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Online Resources Section */}
              <div className="w-full">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() =>
                        setIsResourcesExpanded(!isResourcesExpanded)
                      }
                    >
                      <div className="flex items-center gap-2">
                        {isResourcesExpanded ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                        <Typography variant="h6" className="text-gray-700">
                          ({currentSearch.resources.length}) Resources
                        </Typography>
                      </div>
                    </div>
                    {isResourcesExpanded && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowResourceDialog(true)}
                        className="bg-teal-600 hover:bg-teal-700"
                        size="large"
                      >
                        Add
                      </Button>
                    )}
                  </div>

                  {isResourcesExpanded && (
                    <div className="space-y-3">
                      {currentSearch.resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="bg-gray-100 rounded-lg p-3"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {resource.name}
                                  </a>
                                  <Chip
                                    label={resource.category}
                                    size="small"
                                  />
                                </div>
                                <Typography
                                  variant="body2"
                                  className="text-gray-600"
                                >
                                  {resource.description}
                                </Typography>
                              </div>
                              <div className="flex gap-1">
                                <IconButton
                                  size="small"
                                  style={{ color: "#6b7280" }}
                                  onClick={() => handleEditResource(resource)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  style={{ color: "#6b7280" }}
                                  onClick={() =>
                                    handleDeleteResource(resource.id)
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {currentSearch.resources.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <LinkIcon className="mx-auto mb-2" fontSize="large" />
                          <Typography>No resources added yet</Typography>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Export and Close Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => handleExportSearch()}
                size="large"
                className="w-full sm:w-auto"
              >
                Export as JSON
              </Button>
              <Button
                variant="outlined"
                startIcon={<TableChartIcon />}
                onClick={() => handleExportAsExcel()}
                size="large"
                className="w-full sm:w-auto"
              >
                Export as CSV
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={() => handleCloseJobSearch()}
                size="large"
                className="w-full sm:w-auto"
              >
                Close This Job Search
              </Button>
            </div>
          </div>
        )}

        {hasLoadedData && !currentSearch && searches.length > 0 && (
          <div className="text-center py-20">
            <Typography variant="h5" className="text-slate-600 mb-4">
              NO ACTIVE JOB SEARCH
            </Typography>
            <Typography variant="body1" className="text-slate-500 mb-6">
              Start a new search or view an archived one
            </Typography>
            <div className="pt-4">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowNewSearchDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 mb-8"
              >
                Start New Search
              </Button>
            </div>

            {/* Previous Job Searches */}
            <div className="max-w-4xl mx-auto mt-8">
              <Typography
                variant="subtitle1"
                className="text-slate-700 mb-3 text-left"
              >
                Previous Job Searches
              </Typography>
              <div className="grid gap-4">
                {searches
                  .filter((search) => search.closed || !search.isActive)
                  .map((search) => (
                    <Card key={search.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <Typography
                            variant="h6"
                            className="text-slate-800 mb-1 text-left"
                          >
                            {search.name}
                          </Typography>
                          <div className="flex gap-4 text-sm text-slate-600 mb-1">
                            <span>
                              Opportunities: {search.opportunities?.length || 0}
                            </span>
                            <span>
                              Recruiters: {search.recruiters?.length || 0}
                            </span>
                            <span>
                              Resources: {search.resources?.length || 0}
                            </span>
                          </div>
                          <Typography
                            variant="body2"
                            className="text-slate-500 text-left"
                          >
                            Created:{" "}
                            {new Date(search.created).toLocaleDateString()}
                            {search.closedDate && (
                              <>
                                {" "}
                                • Closed:{" "}
                                {new Date(
                                  search.closedDate
                                ).toLocaleDateString()}
                              </>
                            )}
                          </Typography>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              const reactivatedSearch = {
                                ...search,
                                isActive: true,
                                closed: 0,
                                closedDate: undefined,
                              };
                              setCurrentSearch(reactivatedSearch);
                              const updatedSearches = searches.map((s) =>
                                s.id === search.id ? reactivatedSearch : s
                              );
                              setSearches(updatedSearches);
                              localStorage.setItem(
                                "jobTrackerSearches",
                                JSON.stringify(updatedSearches)
                              );
                            }}
                          >
                            View
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSearch(search.id)}
                            style={{ color: "#dc2626", marginLeft: "8px" }}
                            title="Delete job search"
                            className="ml-2"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        )}

        {hasLoadedData && !currentSearch && searches.length === 0 && (
          <div className="text-center py-20">
            <WorkIcon sx={{ fontSize: 80, color: "#64748b", mb: 4 }} />
            <Typography variant="h5" className="text-slate-600 mb-4">
              Welcome to Job Tracker
            </Typography>
            <Typography variant="body1" className="text-slate-500 mb-6">
              Start tracking your job search journey
            </Typography>
            <div className="pt-4">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowNewSearchDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Your First Search
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}

      {/* New Search Dialog */}
      <Dialog
        open={showNewSearchDialog}
        onClose={() => setShowNewSearchDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle style={{ textAlign: "center", fontWeight: "bold" }}>
          Start New Job Search
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search Name"
            fullWidth
            variant="outlined"
            value={newSearchName}
            onChange={(e) => setNewSearchName(e.target.value)}
            placeholder="e.g., Software Engineer - 2025"
          />
        </DialogContent>
        <DialogActions
          style={{
            paddingBottom: "24px",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <Button
            onClick={() => setShowNewSearchDialog(false)}
            variant="outlined"
            size="large"
            style={{ minWidth: "120px" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateNewSearch}
            variant="contained"
            size="large"
            style={{ minWidth: "120px" }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Opportunity Dialog */}
      <Dialog
        open={showOpportunityDialog}
        onClose={() => {
          setShowOpportunityDialog(false);
          setEditingOpportunity(null);
          setOpportunityForm({});
          setIsJobSourceOther(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle style={{ fontSize: 24, fontWeight: "bold" }}>
          {editingOpportunity ? "Edit Job Opportunity" : "Add Job Opportunity"}
        </DialogTitle>
        <DialogContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="w-full">
              <TextField
                label="Company"
                fullWidth
                variant="outlined"
                value={opportunityForm.company || ""}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    company: e.target.value,
                  })
                }
              />
            </div>
            <div className="w-full">
              <TextField
                label="Position"
                fullWidth
                variant="outlined"
                value={opportunityForm.position || ""}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    position: e.target.value,
                  })
                }
              />
            </div>
            <div className="w-full">
              <TextField
                label="Date Changed"
                type="date"
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true } }}
                value={opportunityForm.dateApplied || ""}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    dateApplied: e.target.value,
                  })
                }
              />
            </div>
            <div className="w-full">
              <FormControl fullWidth variant="outlined">
                <InputLabel>Status</InputLabel>
                <Select
                  value={opportunityForm.status || "saved"}
                  label="Status"
                  onChange={(e) =>
                    setOpportunityForm({
                      ...opportunityForm,
                      status: e.target.value,
                    })
                  }
                >
                  <MenuItem value="saved">Saved</MenuItem>
                  <MenuItem value="applied">Applied</MenuItem>
                  <MenuItem value="interview">Interview</MenuItem>
                  <MenuItem value="offer">Offer</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className="w-full">
              <TextField
                label="Location"
                fullWidth
                variant="outlined"
                value={opportunityForm.location || ""}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    location: e.target.value,
                  })
                }
              />
            </div>
            <div className="w-full">
              <TextField
                label="Salary"
                fullWidth
                variant="outlined"
                value={opportunityForm.salary || ""}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    salary: e.target.value,
                  })
                }
                onBlur={(e) => {
                  // If user clicked into the field but left it empty, set to "Not Specified"
                  if (e.target.value.trim() === "") {
                    setOpportunityForm({
                      ...opportunityForm,
                      salary: "Not Specified",
                    });
                  }
                }}
              />
            </div>
            <div className="w-full md:col-span-1">
              <TextField
                label="Job URL"
                fullWidth
                variant="outlined"
                value={opportunityForm.jobUrl || ""}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    jobUrl: e.target.value,
                  })
                }
              />
            </div>
            <div className="w-full md:col-span-1">
              {isJobSourceOther ||
              (!currentSearch?.resources?.length &&
                !currentSearch?.recruiters?.length) ? (
                <div className="flex items-center gap-2">
                  {((currentSearch?.resources?.length ?? 0) > 0 ||
                    (currentSearch?.recruiters?.length ?? 0) > 0) && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setIsJobSourceOther(false);
                        setOpportunityForm({
                          ...opportunityForm,
                          jobSource: "",
                        });
                      }}
                      className="text-gray-600 hover:text-gray-800"
                      title="Back to dropdown"
                    >
                      <ArrowBackIcon />
                    </IconButton>
                  )}
                  <TextField
                    label="Job Source"
                    fullWidth
                    variant="outlined"
                    placeholder="Enter job source (e.g., LinkedIn, Indeed, Recruiter)"
                    value={opportunityForm.jobSource || ""}
                    onChange={(e) =>
                      setOpportunityForm({
                        ...opportunityForm,
                        jobSource: e.target.value,
                      })
                    }
                  />
                </div>
              ) : (
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Job Source</InputLabel>
                  <Select
                    value={opportunityForm.jobSource || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "Other") {
                        setIsJobSourceOther(true);
                        setOpportunityForm({
                          ...opportunityForm,
                          jobSource: "",
                        });
                      } else {
                        setOpportunityForm({
                          ...opportunityForm,
                          jobSource: value,
                        });
                      }
                    }}
                    label="Job Source"
                  >
                    {/* Resources from current search */}
                    {currentSearch?.resources?.map((resource) => (
                      <MenuItem key={resource.id} value={resource.name}>
                        {resource.name}
                      </MenuItem>
                    ))}

                    {/* Recruiters from current search */}
                    {currentSearch?.recruiters?.map((recruiter) => (
                      <MenuItem
                        key={`recruiter-${recruiter.id}`}
                        value={`Recruiter - ${recruiter.name}`}
                      >
                        Recruiter - {recruiter.name}
                      </MenuItem>
                    ))}

                    {/* Other option */}
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              )}
            </div>
            <div className="w-full md:col-span-2">
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={opportunityForm.description || ""}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="w-full md:col-span-2">
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={opportunityForm.notes || ""}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    notes: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions
          style={{
            paddingBottom: "24px",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <Button
            onClick={() => {
              setShowOpportunityDialog(false);
              setEditingOpportunity(null);
              setOpportunityForm({});
              setIsJobSourceOther(false);
            }}
            variant="outlined"
            size="large"
            style={{ minWidth: "120px" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddOpportunity}
            variant="contained"
            size="large"
            style={{ minWidth: "120px" }}
          >
            {editingOpportunity ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Recruiter Dialog */}
      <Dialog
        open={showRecruiterDialog}
        onClose={() => {
          setShowRecruiterDialog(false);
          setEditingRecruiter(null);
          setRecruiterForm({});
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingRecruiter ? "Edit Recruiter" : "Add Recruiter"}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            <div className="w-full">
              <TextField
                label="Name"
                fullWidth
                variant="outlined"
                value={recruiterForm.name || ""}
                onChange={(e) =>
                  setRecruiterForm({ ...recruiterForm, name: e.target.value })
                }
              />
            </div>
            <div className="w-full">
              <TextField
                label="Company"
                fullWidth
                variant="outlined"
                value={recruiterForm.company || ""}
                onChange={(e) =>
                  setRecruiterForm({
                    ...recruiterForm,
                    company: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full">
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={recruiterForm.email || ""}
                  onChange={(e) =>
                    setRecruiterForm({
                      ...recruiterForm,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div className="w-full">
                <TextField
                  label="Phone"
                  fullWidth
                  variant="outlined"
                  value={recruiterForm.phone || ""}
                  onChange={(e) =>
                    setRecruiterForm({
                      ...recruiterForm,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="w-full">
              <TextField
                label="Specialty"
                fullWidth
                variant="outlined"
                value={recruiterForm.specialty || ""}
                onChange={(e) =>
                  setRecruiterForm({
                    ...recruiterForm,
                    specialty: e.target.value,
                  })
                }
                placeholder="e.g., Software Engineering, Healthcare, Finance"
              />
            </div>
            <div className="w-full">
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={recruiterForm.notes || ""}
                onChange={(e) =>
                  setRecruiterForm({ ...recruiterForm, notes: e.target.value })
                }
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions
          style={{
            paddingBottom: "24px",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <Button
            onClick={() => {
              setShowRecruiterDialog(false);
              setEditingRecruiter(null);
              setRecruiterForm({});
            }}
            variant="outlined"
            size="large"
            style={{ minWidth: "120px" }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (recruiterForm.name && recruiterForm.company) {
                if (editingRecruiter) {
                  // Update existing recruiter
                  const updatedRecruiter: Recruiter = {
                    ...editingRecruiter,
                    name: recruiterForm.name,
                    company: recruiterForm.company,
                    email: recruiterForm.email,
                    phone: recruiterForm.phone,
                    specialty: recruiterForm.specialty,
                    notes: recruiterForm.notes,
                  };

                  if (currentSearch) {
                    const updatedRecruiters = currentSearch.recruiters.map(
                      (r) =>
                        r.id === editingRecruiter.id ? updatedRecruiter : r
                    );

                    const updatedSearch = {
                      ...currentSearch,
                      recruiters: updatedRecruiters,
                    };
                    setCurrentSearch(updatedSearch);
                    saveJobData(updatedSearch);
                  }
                } else {
                  // Add new recruiter
                  const newRecruiter: Recruiter = {
                    id: Date.now().toString(),
                    name: recruiterForm.name,
                    company: recruiterForm.company,
                    email: recruiterForm.email,
                    phone: recruiterForm.phone,
                    specialty: recruiterForm.specialty,
                    notes: recruiterForm.notes,
                  };

                  if (currentSearch) {
                    const updatedSearch = {
                      ...currentSearch,
                      recruiters: [...currentSearch.recruiters, newRecruiter],
                    };
                    setCurrentSearch(updatedSearch);
                    saveJobData(updatedSearch);
                  }
                }

                setShowRecruiterDialog(false);
                setEditingRecruiter(null);
                setRecruiterForm({});
              }
            }}
            variant="contained"
            size="large"
            style={{ minWidth: "120px" }}
          >
            {editingRecruiter ? "Update Recruiter" : "Add Recruiter"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Resource Dialog */}
      <Dialog
        open={showResourceDialog}
        onClose={() => {
          setShowResourceDialog(false);
          setEditingResource(null);
          setResourceForm({});
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingResource ? "Edit Resource" : "Add Online Resource"}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            <div className="w-full">
              <TextField
                label="Resource Name"
                fullWidth
                variant="outlined"
                value={resourceForm.name || ""}
                onChange={(e) =>
                  setResourceForm({ ...resourceForm, name: e.target.value })
                }
              />
            </div>
            <div className="w-full">
              <TextField
                label="URL"
                fullWidth
                variant="outlined"
                value={resourceForm.url || ""}
                onChange={(e) =>
                  setResourceForm({ ...resourceForm, url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="w-full">
              <FormControl fullWidth variant="outlined">
                <InputLabel>Category</InputLabel>
                <Select
                  value={resourceForm.category || ""}
                  label="Category"
                  onChange={(e) =>
                    setResourceForm({
                      ...resourceForm,
                      category: e.target.value,
                    })
                  }
                >
                  <MenuItem value="Job Board">Job Board</MenuItem>
                  <MenuItem value="Company">Company</MenuItem>
                  <MenuItem value="Networking">Networking</MenuItem>
                  <MenuItem value="Learning">Learning</MenuItem>
                  <MenuItem value="Tools">Tools</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className="w-full">
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={resourceForm.description || ""}
                onChange={(e) =>
                  setResourceForm({
                    ...resourceForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions
          style={{ paddingBottom: "24px", justifyContent: "center" }}
        >
          <Button
            onClick={() => {
              setShowResourceDialog(false);
              setEditingResource(null);
              setResourceForm({});
            }}
            variant="outlined"
            size="large"
            style={{ minWidth: "120px" }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (
                resourceForm.name &&
                resourceForm.url &&
                resourceForm.category
              ) {
                if (editingResource) {
                  // Update existing resource
                  const updatedResource: OnlineResource = {
                    ...editingResource,
                    name: resourceForm.name,
                    url: resourceForm.url,
                    category: resourceForm.category,
                    description: resourceForm.description,
                  };

                  if (currentSearch) {
                    const updatedSearch = {
                      ...currentSearch,
                      resources: currentSearch.resources.map((resource) =>
                        resource.id === editingResource.id
                          ? updatedResource
                          : resource
                      ),
                    };
                    setCurrentSearch(updatedSearch);
                    saveJobData(updatedSearch);
                  }
                } else {
                  // Add new resource
                  const newResource: OnlineResource = {
                    id: Date.now().toString(),
                    name: resourceForm.name,
                    url: resourceForm.url,
                    category: resourceForm.category,
                    description: resourceForm.description,
                  };

                  if (currentSearch) {
                    const updatedSearch = {
                      ...currentSearch,
                      resources: [...currentSearch.resources, newResource],
                    };
                    setCurrentSearch(updatedSearch);
                    saveJobData(updatedSearch);
                  }
                }

                setShowResourceDialog(false);
                setEditingResource(null);
                setResourceForm({});
              }
            }}
            variant="contained"
            size="large"
            style={{ minWidth: "120px" }}
          >
            {editingResource ? "Update Resource" : "Add Resource"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Log Entry Dialog */}
      <Dialog
        open={showLogDialog}
        onClose={() => {
          setShowLogDialog(false);
          setEditingLog(null);
          setLogForm({});
          setShowEmailRecruiterOther(false);
          setEmailOtherContact("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingLog ? "Edit Log Entry" : "Add Log Entry"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              mt: 2,
              mb: 2,
            }}
          >
            <FormControl fullWidth>
              <InputLabel>Entry Type</InputLabel>
              <Select
                value={logForm.type || ""}
                onChange={(e) =>
                  setLogForm({
                    ...logForm,
                    type: e.target.value as LogEntry["type"],
                  })
                }
                label="Entry Type"
              >
                <MenuItem value="phone_call">Phone Call</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="follow_up">Follow Up</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            {logForm.type === "phone_call" && (
              <FormControl fullWidth>
                <InputLabel>Recruiter (Optional)</InputLabel>
                <Select
                  value={logForm.recruiterId || ""}
                  onChange={(e) =>
                    setLogForm({ ...logForm, recruiterId: e.target.value })
                  }
                  label="Recruiter (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {currentSearch?.recruiters.map((recruiter) => (
                    <MenuItem key={recruiter.id} value={recruiter.id}>
                      {recruiter.name} - {recruiter.company}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {logForm.type === "email" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {!showEmailRecruiterOther ? (
                  <FormControl fullWidth>
                    <InputLabel>Email Contact</InputLabel>
                    <Select
                      value={logForm.recruiterId || ""}
                      onChange={(e) => {
                        if (e.target.value === "other") {
                          setShowEmailRecruiterOther(true);
                          setLogForm({ ...logForm, recruiterId: "" });
                        } else {
                          setLogForm({
                            ...logForm,
                            recruiterId: e.target.value,
                          });
                        }
                      }}
                      label="Email Contact"
                    >
                      <MenuItem value="">None</MenuItem>
                      {currentSearch?.recruiters.map((recruiter) => (
                        <MenuItem key={recruiter.id} value={recruiter.id}>
                          {recruiter.name} - {recruiter.company}
                        </MenuItem>
                      ))}
                      <MenuItem value="other">Other Contact...</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton
                      onClick={() => {
                        setShowEmailRecruiterOther(false);
                        setEmailOtherContact("");
                      }}
                      size="small"
                    >
                      <ArrowBackIcon />
                    </IconButton>
                    <TextField
                      fullWidth
                      label="Other Contact Name"
                      value={emailOtherContact}
                      onChange={(e) => setEmailOtherContact(e.target.value)}
                      placeholder="Enter contact name"
                    />
                  </Box>
                )}
              </Box>
            )}

            <TextField
              fullWidth
              label="Date & Time"
              type="datetime-local"
              value={logForm.date || ""}
              onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Related Opportunity (Optional)</InputLabel>
              <Select
                value={logForm.opportunityId || ""}
                onChange={(e) =>
                  setLogForm({ ...logForm, opportunityId: e.target.value })
                }
                label="Related Opportunity (Optional)"
              >
                <MenuItem value="">None</MenuItem>
                {currentSearch?.opportunities.map((opp) => (
                  <MenuItem key={opp.id} value={opp.id}>
                    {opp.company} - {opp.position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description"
              value={logForm.description || ""}
              onChange={(e) =>
                setLogForm({ ...logForm, description: e.target.value })
              }
              required
            />

            <TextField
              fullWidth
              label="Notes (Optional)"
              value={logForm.notes || ""}
              onChange={(e) =>
                setLogForm({ ...logForm, notes: e.target.value })
              }
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 3 }}>
          <Button
            onClick={() => {
              setShowLogDialog(false);
              setEditingLog(null);
              setLogForm({});
              setShowEmailRecruiterOther(false);
              setEmailOtherContact("");
            }}
            variant="outlined"
            size="large"
            style={{ minWidth: "120px" }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (
                !currentSearch ||
                !logForm.type ||
                !logForm.description ||
                !logForm.date
              )
                return;

              // Additional validation for email type with "other" contact
              if (
                logForm.type === "email" &&
                showEmailRecruiterOther &&
                !emailOtherContact.trim()
              )
                return;

              if (editingLog) {
                // Update existing log entry
                const updatedLogEntry = {
                  ...editingLog,
                  ...logForm,
                  otherContact: showEmailRecruiterOther
                    ? emailOtherContact
                    : undefined,
                };

                const updatedLog = currentSearch.log.map((entry) =>
                  entry.id === editingLog.id ? updatedLogEntry : entry
                );

                const updatedSearch = {
                  ...currentSearch,
                  log: updatedLog,
                };

                setCurrentSearch(updatedSearch);
                saveJobData(updatedSearch);
              } else {
                // Add new log entry
                const newLogEntry: LogEntry = {
                  id: Date.now().toString(),
                  type: logForm.type,
                  date: logForm.date,
                  description: logForm.description,
                  notes: logForm.notes,
                  opportunityId: logForm.opportunityId,
                  recruiterId: logForm.recruiterId,
                  otherContact: showEmailRecruiterOther
                    ? emailOtherContact
                    : undefined,
                };

                const updatedSearch = {
                  ...currentSearch,
                  log: [...(currentSearch.log || []), newLogEntry],
                };

                setCurrentSearch(updatedSearch);
                saveJobData(updatedSearch);

                // Expand the log section to show the new entry
                setIsLogExpanded(true);
              }

              setShowLogDialog(false);
              setEditingLog(null);
              setLogForm({});
              setShowEmailRecruiterOther(false);
              setEmailOtherContact("");
            }}
            variant="contained"
            size="large"
            style={{ minWidth: "120px" }}
          >
            {editingLog ? "Update Entry" : "Add Entry"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Interview Dialog */}
      <Dialog
        open={showInterviewDialog}
        onClose={() => {
          setShowInterviewDialog(false);
          setInterviewForm({});
          setCurrentOpportunityForInterview(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle style={{ fontWeight: "bold" }}>Add Interview</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Date *
                </label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={interviewForm.date || ""}
                  onChange={(e) =>
                    setInterviewForm({
                      ...interviewForm,
                      date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={interviewForm.time || ""}
                  onChange={(e) =>
                    setInterviewForm({
                      ...interviewForm,
                      time: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="w-full">
              <FormControl fullWidth variant="outlined" required>
                <InputLabel>Interview Type *</InputLabel>
                <Select
                  value={interviewForm.type || ""}
                  label="Interview Type *"
                  onChange={(e) =>
                    setInterviewForm({
                      ...interviewForm,
                      type: e.target.value,
                    })
                  }
                >
                  <MenuItem value="Phone Screen">Phone Screen</MenuItem>
                  <MenuItem value="Video Call">Video Call</MenuItem>
                  <MenuItem value="In-Person">In-Person</MenuItem>
                  <MenuItem value="Technical">Technical</MenuItem>
                  <MenuItem value="Panel">Panel</MenuItem>
                  <MenuItem value="Final">Final</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className="w-full">
              <TextField
                label="Interviewer(s)"
                fullWidth
                variant="outlined"
                value={interviewForm.interviewer || ""}
                onChange={(e) =>
                  setInterviewForm({
                    ...interviewForm,
                    interviewer: e.target.value,
                  })
                }
                placeholder="e.g., John Smith, Jane Doe"
              />
            </div>
            <div className="w-full">
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={interviewForm.notes || ""}
                onChange={(e) =>
                  setInterviewForm({
                    ...interviewForm,
                    notes: e.target.value,
                  })
                }
                placeholder="Interview details, preparation notes, etc."
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions
          style={{
            paddingBottom: "24px",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <Button
            onClick={() => {
              setShowInterviewDialog(false);
              setInterviewForm({});
              setCurrentOpportunityForInterview(null);
            }}
            variant="outlined"
            size="large"
            style={{ minWidth: "120px" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveInterview}
            variant="contained"
            size="large"
            style={{ minWidth: "120px" }}
            disabled={!interviewForm.date || !interviewForm.type}
          >
            Add Interview
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog
        open={showContactDialog}
        onClose={() => {
          setShowContactDialog(false);
          setContactForm({});
          setCurrentOpportunityForContact(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle style={{ fontWeight: "bold" }}>Add Contact</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            {/* Option to select from existing recruiters */}
            {currentSearch && currentSearch.recruiters.length > 0 && (
              <div className="w-full">
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Select from Recruiters (Optional)</InputLabel>
                  <Select
                    value=""
                    label="Select from Recruiters (Optional)"
                    onChange={(e) => {
                      const selectedRecruiter = currentSearch.recruiters.find(
                        (r) => r.id === e.target.value
                      );
                      if (selectedRecruiter) {
                        setContactForm({
                          name: selectedRecruiter.name,
                          role: selectedRecruiter.specialty || "Recruiter",
                          company: selectedRecruiter.company,
                          email: selectedRecruiter.email,
                          phone: selectedRecruiter.phone,
                          notes: selectedRecruiter.notes,
                        });
                      }
                    }}
                  >
                    {currentSearch.recruiters.map((recruiter) => (
                      <MenuItem key={recruiter.id} value={recruiter.id}>
                        {recruiter.name} - {recruiter.company}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography
                  variant="caption"
                  className="text-gray-500 mt-1 block"
                >
                  Select a recruiter to auto-fill contact details, or manually
                  enter new contact below
                </Typography>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full">
                <TextField
                  label="Name"
                  fullWidth
                  variant="outlined"
                  value={contactForm.name || ""}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="w-full">
                <TextField
                  label="Role/Title"
                  fullWidth
                  variant="outlined"
                  value={contactForm.role || ""}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      role: e.target.value,
                    })
                  }
                  placeholder="e.g., Engineering Manager"
                />
              </div>
            </div>
            <div className="w-full">
              <TextField
                label="Company"
                fullWidth
                variant="outlined"
                value={contactForm.company || ""}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    company: e.target.value,
                  })
                }
                placeholder="e.g., Google, Microsoft, etc."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full">
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={contactForm.email || ""}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="john@company.com"
                />
              </div>
              <div className="w-full">
                <TextField
                  label="Phone"
                  type="tel"
                  fullWidth
                  variant="outlined"
                  value={contactForm.phone || ""}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      phone: e.target.value,
                    })
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="w-full">
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={contactForm.notes || ""}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    notes: e.target.value,
                  })
                }
                placeholder="How you met, conversation notes, follow-up reminders, etc."
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions
          style={{
            paddingBottom: "24px",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <Button
            onClick={() => {
              setShowContactDialog(false);
              setContactForm({});
              setCurrentOpportunityForContact(null);
            }}
            variant="outlined"
            size="large"
            style={{ minWidth: "120px" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveContact}
            variant="contained"
            size="large"
            style={{ minWidth: "120px" }}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Status Change Menu */}
      <Menu
        anchorEl={statusChangeAnchor}
        open={Boolean(statusChangeAnchor)}
        onClose={() => {
          setStatusChangeAnchor(null);
          setSelectedOpportunityForStatusChange(null);
        }}
      >
        <MenuItem
          onClick={() =>
            selectedOpportunityForStatusChange &&
            handleQuickStatusChange(selectedOpportunityForStatusChange, "saved")
          }
        >
          Saved
        </MenuItem>
        <MenuItem
          onClick={() =>
            selectedOpportunityForStatusChange &&
            handleQuickStatusChange(
              selectedOpportunityForStatusChange,
              "applied"
            )
          }
        >
          Applied
        </MenuItem>
        <MenuItem
          onClick={() =>
            selectedOpportunityForStatusChange &&
            handleQuickStatusChange(selectedOpportunityForStatusChange, "offer")
          }
        >
          Offer
        </MenuItem>
        <MenuItem
          onClick={() =>
            selectedOpportunityForStatusChange &&
            handleQuickStatusChange(
              selectedOpportunityForStatusChange,
              "rejected"
            )
          }
        >
          Rejected
        </MenuItem>
        <MenuItem
          onClick={() =>
            selectedOpportunityForStatusChange &&
            handleQuickStatusChange(
              selectedOpportunityForStatusChange,
              "closed"
            )
          }
        >
          Closed
        </MenuItem>
      </Menu>

      {renderFooter()}
    </div>
  );
}
