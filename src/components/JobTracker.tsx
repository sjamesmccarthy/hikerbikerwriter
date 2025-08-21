"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
} from "@mui/icons-material";
import {
  FormControl,
  InputLabel,
  Select,
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
} from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";

interface JobOpportunity {
  id: string;
  company: string;
  position: string;
  dateApplied: string;
  status: "applied" | "interview" | "offer" | "rejected" | "closed";
  description?: string;
  jobUrl?: string;
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
  description?: string;
  category: string;
}

interface JobSearch {
  id: string;
  name: string;
  isActive: boolean;
  opportunities: JobOpportunity[];
  recruiters: Recruiter[];
  resources: OnlineResource[];
  created: string;
  closed?: number;
  closedDate?: string;
}

const statusColors = {
  applied: "#2196F3",
  interview: "#FF9800",
  offer: "#4CAF50",
  rejected: "#F44336",
  closed: "#9E9E9E",
};

const statusLabels = {
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

export default function JobTracker() {
  const { data: session, status } = useSession();
  const [searches, setSearches] = useState<JobSearch[]>([]);
  const [currentSearch, setCurrentSearch] = useState<JobSearch | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Dialog states
  const [showNewSearchDialog, setShowNewSearchDialog] = useState(false);
  const [showOpportunityDialog, setShowOpportunityDialog] = useState(false);
  const [showRecruiterDialog, setShowRecruiterDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);

  // Editing states
  const [editingOpportunity, setEditingOpportunity] =
    useState<JobOpportunity | null>(null);
  const [editingRecruiter, setEditingRecruiter] = useState<Recruiter | null>(
    null
  );
  const [currentOpportunityForInterview, setCurrentOpportunityForInterview] =
    useState<JobOpportunity | null>(null);
  const [currentOpportunityForContact, setCurrentOpportunityForContact] =
    useState<JobOpportunity | null>(null);

  // Form states
  const [newSearchName, setNewSearchName] = useState("");
  const [opportunityForm, setOpportunityForm] = useState<
    Partial<JobOpportunity>
  >({});
  const [recruiterForm, setRecruiterForm] = useState<Partial<Recruiter>>({});
  const [resourceForm, setResourceForm] = useState<Partial<OnlineResource>>({});
  const [interviewForm, setInterviewForm] = useState<Partial<Interview>>({});
  const [contactForm, setContactForm] = useState<Partial<Contact>>({});

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

  const handleAppSelect = (path: string) => {
    setIsAppsMenuOpen(false);
    setOpenSubmenu(null);
    window.location.href = path;
  };

  useEffect(() => {
    if (session?.user?.email) {
      loadJobData();
    }
  }, [session, status]);

  const loadJobData = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setSearches(data.searches || []);
        const activeSearch = data.searches?.find((s: JobSearch) => s.isActive);
        setCurrentSearch(activeSearch || null);
      }
    } catch (error) {
      console.error("Error loading job data:", error);
    }
  };

  const saveJobData = async (searchData: JobSearch) => {
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchData),
      });
      if (response.ok) {
        loadJobData();
      }
    } catch (error) {
      console.error("Error saving job data:", error);
    }
  };

  const getStatusCounts = () => {
    if (!currentSearch) return { applied: 0, closed: 0, active: 0 };

    const opportunities = currentSearch.opportunities;
    return {
      applied: opportunities.length, // Total number of jobs applied to
      closed: opportunities.filter(
        (o) => o.status === "closed" || o.status === "rejected"
      ).length,
      active: opportunities.filter(
        (o) => o.status === "interview" || o.status === "offer"
      ).length,
    };
  };

  const getDaysSinceApplied = (dateApplied: string) => {
    const applied = new Date(dateApplied);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - applied.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getFilteredOpportunities = () => {
    if (!currentSearch) return [];

    let filtered = currentSearch.opportunities;

    if (filterStatus !== "all") {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
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

  const handleCreateNewSearch = () => {
    if (!newSearchName.trim()) return;

    const newSearch: JobSearch = {
      id: Date.now().toString(),
      name: newSearchName,
      isActive: true,
      opportunities: [],
      recruiters: [],
      resources: [],
      created: new Date().toISOString(),
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

  const handleArchiveSearch = () => {
    if (!currentSearch) return;

    const updatedSearch = { ...currentSearch, isActive: false };
    const updatedSearches = searches.map((s) =>
      s.id === currentSearch.id ? updatedSearch : s
    );

    setSearches(updatedSearches);
    setCurrentSearch(null);
    saveJobData(updatedSearch);
  };

  const handleAddOpportunity = () => {
    if (!currentSearch || !opportunityForm.company || !opportunityForm.position)
      return;

    if (editingOpportunity) {
      // Update existing opportunity
      const updatedOpportunity: JobOpportunity = {
        ...editingOpportunity,
        company: opportunityForm.company,
        position: opportunityForm.position,
        dateApplied:
          opportunityForm.dateApplied || editingOpportunity.dateApplied,
        status: opportunityForm.status || editingOpportunity.status,
        description: opportunityForm.description,
        jobUrl: opportunityForm.jobUrl,
        salary: opportunityForm.salary,
        location: opportunityForm.location,
        notes: opportunityForm.notes,
      };

      const updatedSearch = {
        ...currentSearch,
        opportunities: currentSearch.opportunities.map((opp) =>
          opp.id === editingOpportunity.id ? updatedOpportunity : opp
        ),
      };

      setCurrentSearch(updatedSearch);
      saveJobData(updatedSearch);
    } else {
      // Add new opportunity
      const newOpportunity: JobOpportunity = {
        id: Date.now().toString(),
        company: opportunityForm.company,
        position: opportunityForm.position,
        dateApplied:
          opportunityForm.dateApplied || new Date().toISOString().split("T")[0],
        status: opportunityForm.status || "applied",
        description: opportunityForm.description,
        jobUrl: opportunityForm.jobUrl,
        salary: opportunityForm.salary,
        location: opportunityForm.location,
        interviews: [],
        contacts: [],
        notes: opportunityForm.notes,
      };

      const updatedSearch = {
        ...currentSearch,
        opportunities: [...currentSearch.opportunities, newOpportunity],
      };

      setCurrentSearch(updatedSearch);
      saveJobData(updatedSearch);
    }

    setShowOpportunityDialog(false);
    setOpportunityForm({});
    setEditingOpportunity(null);
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

  const handleEditOpportunity = (opportunity: JobOpportunity) => {
    setEditingOpportunity(opportunity);
    setOpportunityForm(opportunity);
    setShowOpportunityDialog(true);
  };

  const handleAddInterview = (opportunity: JobOpportunity) => {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
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

    const updatedOpportunities = currentSearch.opportunities.map((opp) =>
      opp.id === currentOpportunityForInterview.id
        ? {
            ...opp,
            interviews: [...opp.interviews, newInterview],
            status: "interview" as const, // Automatically update status to interview
          }
        : opp
    );

    const updatedSearch = {
      ...currentSearch,
      opportunities: updatedOpportunities,
    };

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

    const updatedSearch = {
      ...currentSearch,
      opportunities: updatedOpportunities,
    };

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
        <div className="flex justify-center items-center h-96">
          <div className="text-xl">Loading...</div>
        </div>
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
              className="text-slate-600 mb-8 max-w-2xl mx-auto"
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
  const filteredOpportunities = getFilteredOpportunities();

  return (
    <div>
      {renderHeader()}

      {/* Auth UI - same pattern as FieldNotes */}
      <div className="flex justify-center sm:justify-end px-3 py-2 bg-white border-b border-gray-200">
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

      <div className="max-w-7xl mx-auto p-6">
        {currentSearch && (
          <div>
            {/* Search Title */}
            <h1 className="text-3xl font-bold text-left mb-6">
              {currentSearch.name} Job Search
            </h1>

            {/* Progress Table */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="w-full">
                  <Paper className="p-4 text-center bg-blue-50">
                    <Typography
                      variant="h4"
                      className="text-blue-600 font-bold"
                    >
                      {statusCounts.applied}
                    </Typography>
                    <Typography variant="h6" className="text-slate-600">
                      Applied
                    </Typography>
                  </Paper>
                </div>
                <div className="w-full">
                  <Paper className="p-4 text-center bg-orange-50">
                    <Typography
                      variant="h4"
                      className="text-orange-600 font-bold"
                    >
                      {statusCounts.active}
                    </Typography>
                    <Typography variant="h6" className="text-slate-600">
                      Active
                    </Typography>
                  </Paper>
                </div>
                <div className="w-full">
                  <Paper className="p-4 text-center bg-gray-50">
                    <Typography
                      variant="h4"
                      className="text-gray-600 font-bold"
                    >
                      {statusCounts.closed}
                    </Typography>
                    <Typography variant="h6" className="text-slate-600">
                      Closed
                    </Typography>
                  </Paper>
                </div>
              </div>
            </div>

            {/* Opportunities Section */}
            <Card className="mb-8">
              <CardContent>
                {/* Add Opportunity Button with Filters */}
                <div className="flex justify-between items-center mb-4">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowOpportunityDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                    size="large"
                  >
                    Add Opportunity
                  </Button>

                  <div className="flex space-x-4 gap-2">
                    <FormControl size="small" style={{ minWidth: 120 }}>
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={sortBy}
                        label="Sort By"
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <MenuItem value="newest">Newest</MenuItem>
                        <MenuItem value="oldest">Oldest</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl size="small" style={{ minWidth: 120 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filterStatus}
                        label="Status"
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="applied">Applied</MenuItem>
                        <MenuItem value="interview">Interview</MenuItem>
                        <MenuItem value="offer">Offer</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </div>

                {/* Opportunities Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ width: "30%" }}>Company</TableCell>
                        <TableCell style={{ width: "25%" }}>Position</TableCell>
                        <TableCell style={{ width: "12%" }}>
                          Date Applied
                        </TableCell>
                        <TableCell style={{ width: "10%" }}>
                          Days Since
                        </TableCell>
                        <TableCell style={{ width: "10%" }}>Status</TableCell>
                        <TableCell
                          style={{ width: "8%", textAlign: "right" }}
                        ></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredOpportunities.map((opportunity) => (
                        <React.Fragment key={opportunity.id}>
                          <TableRow
                            style={{
                              backgroundColor: `${
                                statusColors[opportunity.status]
                              }10`,
                            }}
                            className="cursor-pointer hover:bg-gray-50"
                          >
                            <TableCell>{opportunity.company}</TableCell>
                            <TableCell>{opportunity.position}</TableCell>
                            <TableCell>
                              {new Date(
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
                                }}
                                size="small"
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
                                                Job Posting:
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
                                      <Typography variant="h6" className="mb-3">
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
                                                className="border border-gray-200 rounded p-3 bg-gray-50"
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
                                                        {interview.interviewer}
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
                                        Contacts ({opportunity.contacts.length})
                                      </Typography>

                                      {/* Contact list */}
                                      {opportunity.contacts.length > 0 ? (
                                        <div className="space-y-3 mb-4">
                                          {opportunity.contacts.map(
                                            (contact) => (
                                              <div
                                                key={contact.id}
                                                className="border border-gray-200 rounded p-3 bg-gray-50"
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
                                                    style={{ color: "#6b7280" }}
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
                                        handleDeleteOpportunity(opportunity.id)
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
              </CardContent>
            </Card>

            {/* Recruiters and Resources Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recruiters Section */}
              <div className="w-full">
                <Card>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowRecruiterDialog(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                        size="large"
                      >
                        Add Recruiter
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {currentSearch.recruiters.map((recruiter) => (
                        <Card
                          key={recruiter.id}
                          className="border border-gray-200"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="bg-purple-100 text-purple-600">
                                  <PersonIcon />
                                </Avatar>
                                <div>
                                  <Typography
                                    variant="subtitle1"
                                    className="font-semibold"
                                  >
                                    {recruiter.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    className="text-gray-600"
                                  >
                                    {recruiter.company}
                                  </Typography>
                                  {recruiter.specialty && (
                                    <Typography
                                      variant="caption"
                                      className="text-gray-500"
                                    >
                                      {recruiter.specialty}
                                    </Typography>
                                  )}
                                  <div className="flex space-x-2 mt-2">
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
                              <div className="flex space-x-1">
                                <IconButton
                                  size="small"
                                  className="text-gray-400"
                                  onClick={() => handleEditRecruiter(recruiter)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  style={{ color: "#6b7280" }}
                                  onClick={() =>
                                    handleDeleteRecruiter(recruiter.id)
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
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
                  </CardContent>
                </Card>
              </div>

              {/* Online Resources Section */}
              <div className="w-full">
                <Card>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowResourceDialog(true)}
                        className="bg-teal-600 hover:bg-teal-700"
                        size="large"
                      >
                        Add Resource
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {currentSearch.resources.map((resource) => (
                        <Card
                          key={resource.id}
                          className="border border-gray-200"
                        >
                          <CardContent className="px-4 pt-4 pb-2">
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
                          </CardContent>
                        </Card>
                      ))}

                      {currentSearch.resources.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <LinkIcon className="mx-auto mb-2" fontSize="large" />
                          <Typography>No resources added yet</Typography>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Close Job Search Button */}
            <div className="flex justify-end mt-8">
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleCloseJobSearch()}
                size="large"
              >
                Close This Job Search
              </Button>
            </div>
          </div>
        )}

        {!currentSearch && searches.length > 0 && (
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
                    <Card
                      key={search.id}
                      className="p-4 border border-slate-200"
                    >
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

        {!currentSearch && searches.length === 0 && (
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
                label="Date Applied"
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
                  value={opportunityForm.status || "applied"}
                  label="Status"
                  onChange={(e) =>
                    setOpportunityForm({
                      ...opportunityForm,
                      status: e.target.value,
                    })
                  }
                >
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
              />
            </div>
            <div className="w-full md:col-span-2">
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
            {editingOpportunity ? "Update Opportunity" : "Add Opportunity"}
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

      {/* Add Resource Dialog */}
      <Dialog
        open={showResourceDialog}
        onClose={() => setShowResourceDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Online Resource</DialogTitle>
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
            onClick={() => setShowResourceDialog(false)}
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

                setShowResourceDialog(false);
                setResourceForm({});
              }
            }}
            variant="contained"
            size="large"
            style={{ minWidth: "120px" }}
          >
            Add Resource
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

      {renderFooter()}
    </div>
  );
}
