"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Button,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  IconButton,
  Modal,
  Box,
  TextField,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  ButtonGroup,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import Image from "next/image";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TwainStoryWriter from "./TwainStoryWriter";
import TwainStoryPricingModal from "./TwainStoryPricingModal";
import { useUserPreferences } from "../hooks/useUserPreferences";

// Utility function to process Google profile image URL
const processGoogleImageUrl = (url: string): string => {
  // Remove size parameters and add our own
  const baseUrl = url.split("=")[0];
  return `${baseUrl}=s40-c`;
};

// Custom Avatar Component
interface UserAvatarProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } | null;
  onError?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ session, onError }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fallback avatar component
  const FallbackAvatar = () => (
    <Avatar
      sx={{
        width: 40,
        height: 40,
        bgcolor: "rgb(19, 135, 194)",
        color: "white",
        fontSize: "16px",
        fontWeight: 600,
      }}
    >
      {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "?"}
    </Avatar>
  );

  if (!session?.user?.image || imageError) {
    return <FallbackAvatar />;
  }

  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        backgroundColor: imageLoaded ? "transparent" : "rgb(19, 135, 194)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!imageLoaded && (
        <span
          style={{
            color: "white",
            fontSize: "16px",
            fontWeight: 600,
            position: "absolute",
            zIndex: 1,
          }}
        >
          {session?.user?.name
            ? session.user.name.charAt(0).toUpperCase()
            : "?"}
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={processGoogleImageUrl(session.user.image)}
        alt={session?.user?.name || "User"}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          objectFit: "cover",
          display: imageLoaded ? "block" : "none",
        }}
        onLoad={() => {
          setImageLoaded(true);
          console.log(
            "Avatar image loaded successfully:",
            session?.user?.image
          );
        }}
        onError={() => {
          const originalUrl = session?.user?.image;
          const processedUrl = originalUrl
            ? processGoogleImageUrl(originalUrl)
            : "N/A";
          console.error(
            "Avatar image failed to load. Original URL:",
            originalUrl
          );
          console.error("Processed URL:", processedUrl);
          setImageError(true);
          onError?.();
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

// Type definitions
interface Book {
  id: number;
  title: string;
  subtitle?: string;
  author: string;
  edition: string;
  copyrightYear: string;
  wordCount: number;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

// Local storage utilities
const getBooksStorageKey = (userEmail: string): string => {
  return `twain-story-builder-books-${userEmail}`;
};

const loadBooksFromStorage = (userEmail?: string): Book[] => {
  if (typeof window === "undefined" || !userEmail) return [];
  try {
    const storageKey = getBooksStorageKey(userEmail);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading books from localStorage:", error);
    return [];
  }
};

const saveBooksToStorage = (books: Book[], userEmail?: string): void => {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    const storageKey = getBooksStorageKey(userEmail);
    localStorage.setItem(storageKey, JSON.stringify(books));
  } catch (error) {
    console.error("Error saving books to localStorage:", error);
  }
};

const generateBookId = (existingBooks: Book[]): number => {
  return existingBooks.length > 0
    ? Math.max(...existingBooks.map((book) => book.id)) + 1
    : 1;
};

const updateBookWordCount = (
  bookId: number,
  wordCount: number,
  userEmail?: string
): void => {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    const books = loadBooksFromStorage(userEmail);
    const updatedBooks = books.map((book) =>
      book.id === bookId
        ? { ...book, wordCount, updatedAt: new Date().toISOString() }
        : book
    );
    saveBooksToStorage(updatedBooks, userEmail);
  } catch (error) {
    console.error("Error updating word count:", error);
  }
};

const updateQuickStoryWordCount = (
  storyId: number,
  wordCount: number,
  userEmail?: string
): void => {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    const quickStories = loadQuickStoriesFromStorage(userEmail);
    const updatedQuickStories = quickStories.map((story) =>
      story.id === storyId
        ? { ...story, wordCount, updatedAt: new Date().toISOString() }
        : story
    );
    saveQuickStoriesToStorage(updatedQuickStories, userEmail);
  } catch (error) {
    console.error("Error updating quick story word count:", error);
  }
};

// Quick Stories localStorage utilities
const getQuickStoriesStorageKey = (userEmail: string): string => {
  return `twain-story-builder-quickstories-${userEmail}`;
};

const loadQuickStoriesFromStorage = (userEmail?: string): Book[] => {
  if (typeof window === "undefined" || !userEmail) return [];
  try {
    const storageKey = getQuickStoriesStorageKey(userEmail);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading quick stories from localStorage:", error);
    return [];
  }
};

const saveQuickStoriesToStorage = (
  stories: Book[],
  userEmail?: string
): void => {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    const storageKey = getQuickStoriesStorageKey(userEmail);
    localStorage.setItem(storageKey, JSON.stringify(stories));
  } catch (error) {
    console.error("Error saving quick stories to localStorage:", error);
  }
};

const generateQuickStoryId = (existingStories: Book[]): number => {
  return existingStories.length > 0
    ? Math.max(...existingStories.map((story) => story.id)) + 1
    : 1;
};

// Plan utility functions
const getPlanFeatures = (
  planType: "free" | "basic" | "professional" | "enterprise"
): string[] => {
  const features: Record<string, string[]> = {
    free: ["local-storage", "basic-writing", "export-txt", "up-to-3-books"],
    basic: [
      "cloud-storage",
      "unlimited-books",
      "advanced-writing",
      "export-pdf",
      "export-docx",
      "basic-templates",
      "email-support",
    ],
    professional: [
      "cloud-storage",
      "unlimited-books",
      "advanced-writing",
      "export-all-formats",
      "premium-templates",
      "collaboration",
      "version-history",
      "priority-support",
      "custom-branding",
    ],
    enterprise: [
      "cloud-storage",
      "unlimited-books",
      "advanced-writing",
      "export-all-formats",
      "premium-templates",
      "team-collaboration",
      "advanced-version-history",
      "dedicated-support",
      "custom-integrations",
      "sso",
      "admin-dashboard",
    ],
  };

  return features[planType] || features.free;
};

const getPlanEndDate = (
  planType: "free" | "basic" | "professional" | "enterprise"
): string | undefined => {
  if (planType === "free") {
    return undefined; // Free plan doesn't expire
  }

  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1); // Add 1 year
  return endDate.toISOString();
};

// Helper function to get plan chip properties
const getPlanChipProps = (
  planType: "free" | "basic" | "professional" | "enterprise"
) => {
  switch (planType) {
    case "free":
      return {
        label: "Free",
        color: "default" as const,
        sx: {
          backgroundColor: "#9e9e9e",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          height: "32px",
        },
      };
    case "professional":
      return {
        label: "Pro",
        color: "error" as const,
        sx: {
          backgroundColor: "#f44336",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          height: "32px",
        },
      };
    case "enterprise":
      return {
        label: "Enterprise",
        color: "primary" as const,
        sx: {
          backgroundColor: "#2196f3",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          height: "32px",
        },
      };
    default:
      return {
        label: "Free",
        color: "default" as const,
        sx: {
          backgroundColor: "#9e9e9e",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          height: "32px",
        },
      };
  }
};

const TwainStoryBuilder: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    preferences,
    planType,
    isActivePlan,
    loginInfo,
    updatePlan,
    checkFeature,
  } = useUserPreferences();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createBookModalOpen, setCreateBookModalOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [createStoryModalOpen, setCreateStoryModalOpen] = useState(false);
  const [storyTitle, setStoryTitle] = useState("");
  const [currentView, setCurrentView] = useState<
    "bookshelf" | "manage" | "write" | "account"
  >("bookshelf");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [quickStories, setQuickStories] = useState<Book[]>([]);
  const [isQuickStoryMode, setIsQuickStoryMode] = useState(false);
  const [filter, setFilter] = useState<"all" | "books" | "stories">("all");
  const [managedBookTitle, setManagedBookTitle] = useState("");
  const [managedBookAuthor, setManagedBookAuthor] = useState("");
  const [managedBookSubtitle, setManagedBookSubtitle] = useState("");
  const [managedBookEdition, setManagedBookEdition] = useState("First Edition");
  const [managedBookCopyrightYear, setManagedBookCopyrightYear] = useState(
    new Date().getFullYear().toString()
  );
  const [notification, setNotification] = useState<string>("");
  const [showPricing, setShowPricing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Select a random Twain image (1-6)
  const randomImageNumber = Math.floor(Math.random() * 6) + 1;
  const backgroundImage = `/images/twain${randomImageNumber}.png`;

  // Debug: Log which image is being used
  console.log("Loading Twain image:", backgroundImage);

  // Debug: Log session data
  console.log("Session status:", status);
  console.log("Session data:", session);
  console.log("User image URL:", session?.user?.image);

  // Notification helper
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 3000);
  };

  // Load books from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storedBooks = loadBooksFromStorage(session.user.email);
      setBooks(storedBooks);
    }
  }, [session?.user?.email]);

  // Load quick stories from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storedQuickStories = loadQuickStoriesFromStorage(
        session.user.email
      );
      setQuickStories(storedQuickStories);
    }
  }, [session?.user?.email]);

  const handleSignIn = () => {
    signIn("google");
  };

  const handleRequestAccess = () => {
    router.push("/auth/signup");
  };

  const handleShowPricing = () => {
    setShowPricing(true);
  };

  const handleClosePricing = () => {
    setShowPricing(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    signOut();
  };

  const handleAccountSettings = () => {
    handleMenuClose();
    setCurrentView("account");
  };

  const handleUpgradePlan = (
    newPlanType: "basic" | "professional" | "enterprise"
  ) => {
    // This would typically integrate with a payment system
    // For now, we'll just update the local preferences
    updatePlan({
      type: newPlanType,
      status: "active",
      startDate: new Date().toISOString(),
      endDate: getPlanEndDate(newPlanType),
      features: getPlanFeatures(newPlanType),
    });

    showNotification(
      `Successfully upgraded to ${
        newPlanType.charAt(0).toUpperCase() + newPlanType.slice(1)
      } plan!`
    );
    setShowPricing(false);
  };

  const handleCreateBookClick = () => {
    setCreateBookModalOpen(true);
  };

  const handleCreateBookModalClose = () => {
    setCreateBookModalOpen(false);
    setBookTitle("");
  };

  const handleCreateBook = () => {
    if (bookTitle.trim()) {
      const newBook: Book = {
        id: generateBookId(books),
        title: bookTitle.trim(),
        subtitle: "",
        author: session?.user?.name || "Unknown Author",
        edition: "First Edition",
        copyrightYear: new Date().getFullYear().toString(),
        wordCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedBooks = [...books, newBook];
      setBooks(updatedBooks);
      if (session?.user?.email) {
        saveBooksToStorage(updatedBooks, session.user.email);
      }

      // Close modal first to prevent any rendering conflicts
      handleCreateBookModalClose();

      // Set the new book as selected and switch to write view
      setIsQuickStoryMode(false);
      setSelectedBook(newBook);
      setCurrentView("write");
      showNotification(`"${newBook.title}" has been created successfully!`);
      console.log("Book created successfully:", newBook.title);
    }
  };

  const handleCreateStoryClick = () => {
    setCreateStoryModalOpen(true);
  };

  const handleCreateStoryModalClose = () => {
    setCreateStoryModalOpen(false);
    setStoryTitle("");
  };

  const handleCreateStory = () => {
    if (storyTitle.trim()) {
      const quickStoryBook: Book = {
        id: generateQuickStoryId(quickStories),
        title: storyTitle.trim(),
        subtitle: "",
        author: session?.user?.name || "Unknown Author",
        edition: "First Edition",
        copyrightYear: new Date().getFullYear().toString(),
        wordCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedQuickStories = [...quickStories, quickStoryBook];
      setQuickStories(updatedQuickStories);
      if (session?.user?.email) {
        saveQuickStoriesToStorage(updatedQuickStories, session.user.email);
      }

      // Close modal first to prevent any rendering conflicts
      handleCreateStoryModalClose();

      // Set quick story mode and switch to write view
      setIsQuickStoryMode(true);
      setSelectedBook(quickStoryBook);
      setCurrentView("write");
      showNotification(`"${quickStoryBook.title}" story is ready to write!`);
    }
  };

  const handleManageBook = (book: Book) => {
    setSelectedBook(book);
    setManagedBookTitle(book.title);
    setManagedBookAuthor(book.author);
    setManagedBookSubtitle(book.subtitle || "");
    setManagedBookEdition(book.edition);
    setManagedBookCopyrightYear(book.copyrightYear);
    setCurrentView("manage");
  };

  const handleBackToBookshelf = () => {
    setCurrentView("bookshelf");
    setSelectedBook(null);
    setIsQuickStoryMode(false);
    setManagedBookTitle("");
    setManagedBookAuthor("");
    setManagedBookSubtitle("");
    setManagedBookEdition("First Edition");
    setManagedBookCopyrightYear(new Date().getFullYear().toString());

    // Reload books from localStorage to pick up any word count updates
    if (session?.user?.email) {
      const updatedBooks = loadBooksFromStorage(session.user.email);
      setBooks(updatedBooks);
    }
  };

  const handleSaveBook = () => {
    if (managedBookTitle.trim() && managedBookAuthor.trim() && selectedBook) {
      const updatedBook: Book = {
        ...selectedBook,
        title: managedBookTitle.trim(),
        subtitle: managedBookSubtitle.trim(),
        author: managedBookAuthor.trim(),
        edition: managedBookEdition,
        copyrightYear: managedBookCopyrightYear,
        updatedAt: new Date().toISOString(),
      };

      const updatedBooks = books.map((book) =>
        book.id === selectedBook.id ? updatedBook : book
      );

      setBooks(updatedBooks);
      if (session?.user?.email) {
        saveBooksToStorage(updatedBooks, session.user.email);
      }

      showNotification(`"${updatedBook.title}" has been saved successfully!`);
      console.log("Book saved successfully:", updatedBook.title);
      handleBackToBookshelf();
    }
  };

  const handleCoverUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the upload click
    if (selectedBook) {
      const updatedBook = {
        ...selectedBook,
        coverImage: undefined,
        updatedAt: new Date().toISOString(),
      };

      setSelectedBook(updatedBook);

      // Update the books array
      const updatedBooks = books.map((book) =>
        book.id === selectedBook.id ? updatedBook : book
      );
      setBooks(updatedBooks);

      // Save to localStorage
      if (session?.user?.email) {
        saveBooksToStorage(updatedBooks, session.user.email);
      }

      showNotification("Cover image removed successfully!");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        showNotification("Please select an image file.");
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification("Image file size must be less than 5MB.");
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        if (selectedBook) {
          const updatedBook = {
            ...selectedBook,
            coverImage: base64String,
            updatedAt: new Date().toISOString(),
          };

          setSelectedBook(updatedBook);

          // Update the books array
          const updatedBooks = books.map((book) =>
            book.id === selectedBook.id ? updatedBook : book
          );
          setBooks(updatedBooks);

          // Save to localStorage
          if (session?.user?.email) {
            saveBooksToStorage(updatedBooks, session.user.email);
          }

          showNotification("Cover image uploaded successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleArchiveBook = () => {
    if (selectedBook) {
      // For now, we'll just mark it as archived by adding an archived flag
      // In a real implementation, you might move it to a separate archived collection
      console.log("Archiving book:", selectedBook.title);
      // TODO: Implement archiving logic when needed
      handleBackToBookshelf();
    }
  };

  const handleDeleteBook = () => {
    if (
      selectedBook &&
      window.confirm(
        `Are you sure you want to permanently delete "${selectedBook.title}"?`
      )
    ) {
      const updatedBooks = books.filter((book) => book.id !== selectedBook.id);
      setBooks(updatedBooks);
      if (session?.user?.email) {
        saveBooksToStorage(updatedBooks, session.user.email);
      }

      showNotification(`"${selectedBook.title}" has been deleted.`);
      console.log("Book deleted successfully:", selectedBook.title);
      handleBackToBookshelf();
    }
  };

  const handleDeleteStory = (story: Book) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${story.title}"?`
      )
    ) {
      const updatedQuickStories = quickStories.filter((s) => s.id !== story.id);
      setQuickStories(updatedQuickStories);
      if (session?.user?.email) {
        saveQuickStoriesToStorage(updatedQuickStories, session.user.email);
      }

      showNotification(`"${story.title}" story has been deleted.`);
      console.log("Story deleted successfully:", story.title);
    }
  };

  const handleWriteBook = (book: Book) => {
    setSelectedBook(book);
    setCurrentView("write");
  };

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-gray-800"
        style={{ fontFamily: "'Crimson-Text', sans-serif" }}
      >
        <Typography>Loading...</Typography>
      </div>
    );
  }

  if (session) {
    // User is logged in - show the bookshelf interface, manage page, or writer
    if (currentView === "write" && selectedBook) {
      return (
        <TwainStoryWriter
          book={selectedBook}
          onBackToBookshelf={handleBackToBookshelf}
          isQuickStoryMode={isQuickStoryMode}
          autoStartStory={isQuickStoryMode}
        />
      );
    }

    if (currentView === "manage" && selectedBook) {
      return (
        <div className="min-h-screen flex flex-col">
          {/* Header - 300px tall */}
          <header
            className="h-[300px] flex flex-col justify-center items-center text-white relative"
            style={{ backgroundColor: "rgb(38, 52, 63)" }}
          >
            {/* Profile Menu - Top Right */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <IconButton onClick={handleMenuOpen}>
                <UserAvatar session={session} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <div className="ml-2 pb-1 pt-2">
                  <Chip {...getPlanChipProps(planType)} />
                </div>
                <MenuItem onClick={handleAccountSettings}>
                  Account Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>Log Out</MenuItem>
              </Menu>
            </div>

            <Image
              src="/images/twain-logo.png"
              alt="Twain Logo"
              width={120}
              height={120}
              style={{
                filter: "invert(1) brightness(100%)",
                marginBottom: "16px",
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 600,
                marginBottom: 1,
              }}
            >
              Manage Book
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 300,
                fontSize: "14px",
                textAlign: "center",
                maxWidth: "600px",
              }}
            >
              Edit your book details, cover image and manage settings
            </Typography>
          </header>

          {/* Navigation Bar */}
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="w-[90%] md:w-[80%] mx-auto flex items-center">
              <IconButton
                onClick={handleBackToBookshelf}
                sx={{
                  mr: 2,
                  color: "rgb(19, 135, 194)",
                  "&:hover": {
                    backgroundColor: "rgba(19, 135, 194, 0.1)",
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </div>
          </div>

          {/* Main content area - Book Management Form */}
          <main className="flex-1 bg-gray-100 p-4 lg:p-8">
            <div className="w-[95%] lg:w-[60%] mx-auto">
              <div className="">
                <div className="space-y-6">
                  {/* Book Cover and Title Edit */}
                  <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-start">
                    {/* Book Card with Upload Icon */}
                    <div className="flex flex-col items-center w-full lg:w-auto">
                      <div
                        className="bg-white shadow-sm flex flex-col rounded-r-md cursor-pointer relative overflow-hidden w-full lg:w-[176px]"
                        style={{
                          aspectRatio: "176/268",
                          borderLeft: "8px solid rgb(100, 114, 127)",
                          maxWidth: "100%",
                          height: "auto",
                        }}
                        onClick={handleCoverUpload}
                      >
                        {selectedBook?.coverImage ? (
                          <div className="w-full h-full relative">
                            <Image
                              src={selectedBook.coverImage}
                              alt="Book cover preview"
                              fill
                              style={{ objectFit: "cover" }}
                              className="rounded-r-sm"
                            />
                            {/* Upload overlay on hover */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-r-sm">
                              <CloudUploadOutlinedIcon
                                sx={{
                                  fontSize: 48,
                                  color: "white",
                                }}
                              />
                              <span className="text-sm text-white mt-2">
                                Change Cover
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center">
                            <CloudUploadOutlinedIcon
                              sx={{
                                fontSize: 64,
                                color: "rgb(156, 163, 175)",
                              }}
                            />
                            <span className="text-sm text-gray-600 mt-2">
                              Upload Cover
                            </span>
                            {/* Info icon with tooltip */}
                            <Tooltip
                              title="For the best results, your book cover image should have a dimension ratio of 1:1.6, and measure at least 2500px on the longest side."
                              placement="top"
                              arrow
                            >
                              <InfoOutlinedIcon
                                sx={{
                                  fontSize: 16,
                                  color: "rgb(156, 163, 175)",
                                  marginTop: "4px",
                                }}
                              />
                            </Tooltip>
                          </div>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          style={{ display: "none" }}
                        />
                      </div>

                      {/* Remove button - only show when cover exists */}
                      {selectedBook?.coverImage && (
                        <button
                          onClick={handleRemoveCover}
                          className="mt-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center justify-center cursor-pointer"
                          title="Remove cover image"
                        >
                          <DeleteOutlinedIcon sx={{ fontSize: 14 }} />
                          <span className="text-xs ml-1">Remove Cover</span>
                        </button>
                      )}
                    </div>
                    {/* Title TextField */}
                    <div className="flex-1">
                      <TextField
                        fullWidth
                        label="Book Title"
                        value={managedBookTitle}
                        onChange={(e) => setManagedBookTitle(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Sub Title (optional)"
                        value={managedBookSubtitle}
                        onChange={(e) => setManagedBookSubtitle(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Author Name or Pen Name"
                        value={managedBookAuthor}
                        onChange={(e) => setManagedBookAuthor(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <div className="flex gap-4">
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel>Edition</InputLabel>
                          <Select
                            value={managedBookEdition}
                            label="Edition"
                            onChange={(e) =>
                              setManagedBookEdition(e.target.value)
                            }
                          >
                            <MenuItem value="First Edition">
                              First Edition
                            </MenuItem>
                            <MenuItem value="Second Edition">
                              Second Edition
                            </MenuItem>
                            <MenuItem value="Third Edition">
                              Third Edition
                            </MenuItem>
                            <MenuItem value="Fourth Edition">
                              Fourth Edition
                            </MenuItem>
                            <MenuItem value="Fifth Edition">
                              Fifth Edition
                            </MenuItem>
                            <MenuItem value="Sixth Edition">
                              Sixth Edition
                            </MenuItem>
                            <MenuItem value="Seventh Edition">
                              Seventh Edition
                            </MenuItem>
                            <MenuItem value="Eighth Edition">
                              Eighth Edition
                            </MenuItem>
                            <MenuItem value="Ninth Edition">
                              Ninth Edition
                            </MenuItem>
                            <MenuItem value="Tenth Edition">
                              Tenth Edition
                            </MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          sx={{ flex: 1 }}
                          label="Copyright Year"
                          value={managedBookCopyrightYear}
                          onChange={(e) =>
                            setManagedBookCopyrightYear(e.target.value)
                          }
                          variant="outlined"
                          type="number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      onClick={handleArchiveBook}
                      variant="outlined"
                      startIcon={<Inventory2OutlinedIcon />}
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        fontFamily: "'Rubik', sans-serif",
                        py: 1.5,
                        borderColor: "rgb(156, 163, 175)",
                        color: "rgb(107, 114, 128)",
                        "&:hover": {
                          borderColor: "rgb(107, 114, 128)",
                          backgroundColor: "rgba(107, 114, 128, 0.1)",
                        },
                      }}
                    >
                      Archive Book
                    </Button>
                    <Button
                      onClick={handleDeleteBook}
                      variant="outlined"
                      startIcon={<DeleteForeverOutlinedIcon />}
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        fontFamily: "'Rubik', sans-serif",
                        py: 1.5,
                        borderColor: "rgb(248, 113, 113)",
                        color: "rgb(248, 113, 113)",
                        "&:hover": {
                          borderColor: "rgb(239, 68, 68)",
                          backgroundColor: "rgba(248, 113, 113, 0.1)",
                          color: "rgb(239, 68, 68)",
                        },
                      }}
                    >
                      Delete Permanently
                    </Button>
                    <Button
                      onClick={handleSaveBook}
                      variant="contained"
                      disabled={
                        !managedBookTitle.trim() || !managedBookAuthor.trim()
                      }
                      sx={{
                        flex: 1,
                        backgroundColor: "rgb(19, 135, 194)",
                        textTransform: "none",
                        fontFamily: "'Rubik', sans-serif",
                        py: 1.5,
                        boxShadow: "none",
                        "&:hover": {
                          backgroundColor: "rgb(15, 108, 155)",
                          boxShadow: "none",
                        },
                        "&:disabled": {
                          boxShadow: "none",
                        },
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer - 100px tall */}
          <footer className="h-[100px] flex items-center justify-center bg-gray-200">
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontFamily: "'Rubik', sans-serif" }}
            >
              © 2025 Twain Story Builder. All rights reserved.
            </Typography>
          </footer>

          {/* Pricing Modal - Available for manage book view */}
          <TwainStoryPricingModal
            open={showPricing}
            onClose={handleClosePricing}
            onUpgrade={handleUpgradePlan}
          />
        </div>
      );
    }

    if (currentView === "account") {
      return (
        <div className="min-h-screen flex flex-col">
          {/* Header - 300px tall */}
          <header
            className="h-[300px] flex flex-col justify-center items-center text-white relative"
            style={{ backgroundColor: "rgb(38, 52, 63)" }}
          >
            {/* Profile Menu - Top Right */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <IconButton onClick={handleMenuOpen}>
                <UserAvatar session={session} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <div className="ml-2 pb-1 pt-2">
                  <Chip {...getPlanChipProps(planType)} />
                </div>
                <MenuItem onClick={handleAccountSettings}>
                  Account Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>Log Out</MenuItem>
              </Menu>
            </div>

            <Image
              src="/images/twain-logo.png"
              alt="Twain Logo"
              width={120}
              height={120}
              style={{
                filter: "invert(1) brightness(100%)",
                marginBottom: "16px",
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 600,
                marginBottom: 1,
              }}
            >
              Account Settings
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 300,
                fontSize: "14px",
                textAlign: "center",
                maxWidth: "600px",
              }}
            >
              Manage your account preferences and settings
            </Typography>
          </header>

          {/* Navigation Bar */}
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="w-[90%] md:w-[80%] mx-auto flex items-center">
              <IconButton
                onClick={handleBackToBookshelf}
                sx={{
                  mr: 2,
                  color: "rgb(19, 135, 194)",
                  "&:hover": {
                    backgroundColor: "rgba(19, 135, 194, 0.1)",
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </div>
          </div>

          {/* Main content area - Account Settings Form */}
          <main className="flex-1 bg-gray-100 p-4 lg:p-8">
            <div className="w-[95%] lg:w-[60%] mx-auto">
              <div className="space-y-6">
                {/* User Profile Section */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      fontWeight: 600,
                      marginBottom: 3,
                      color: "rgb(31, 41, 55)",
                    }}
                  >
                    Profile Information
                  </Typography>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center gap-2">
                          <UserAvatar session={session} />
                          {/* <Chip {...getPlanChipProps(planType)} /> */}
                        </div>
                        <div>
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 500,
                              color: "rgb(31, 41, 55)",
                            }}
                          >
                            {session?.user?.name || "Unknown User"}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              color: "rgb(107, 114, 128)",
                            }}
                          >
                            {session?.user?.email || "No email provided"}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              color: "rgb(107, 114, 128)",
                              fontStyle: "italic",
                            }}
                          >
                            A member since{" "}
                            {new Date(
                              preferences.accountCreatedAt
                            ).toLocaleDateString()}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              color: "rgb(107, 114, 128)",
                              fontSize: "12px",
                            }}
                          >
                            {loginInfo.loginCount} logins • Last seen{" "}
                            {new Date(loginInfo.lastLogin).toLocaleDateString()}
                          </Typography>
                        </div>
                      </div>
                      <Button
                        onClick={handleLogout}
                        variant="outlined"
                        size="small"
                        sx={{
                          textTransform: "none",
                          fontFamily: "'Rubik', sans-serif",
                          borderColor: "rgb(209, 213, 219)",
                          color: "rgb(107, 114, 128)",
                          "&:hover": {
                            borderColor: "rgb(239, 68, 68)",
                            color: "rgb(239, 68, 68)",
                            backgroundColor: "rgba(239, 68, 68, 0.04)",
                          },
                        }}
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Account Statistics */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      fontWeight: 600,
                      marginBottom: 3,
                      color: "rgb(31, 41, 55)",
                    }}
                  >
                    Your Writing Statistics
                  </Typography>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          fontWeight: 700,
                          color: "rgb(19, 135, 194)",
                        }}
                      >
                        {books.length}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          color: "rgb(107, 114, 128)",
                        }}
                      >
                        Books
                      </Typography>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          fontWeight: 700,
                          color: "rgb(19, 135, 194)",
                        }}
                      >
                        {quickStories.length}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          color: "rgb(107, 114, 128)",
                        }}
                      >
                        Stories
                      </Typography>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          fontWeight: 700,
                          color: "rgb(19, 135, 194)",
                        }}
                      >
                        {books.reduce(
                          (total, book) => total + book.wordCount,
                          0
                        ) +
                          quickStories.reduce(
                            (total, story) => total + story.wordCount,
                            0
                          )}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          color: "rgb(107, 114, 128)",
                        }}
                      >
                        Total Words
                      </Typography>
                    </div>
                  </div>
                </div>

                {/* Plan & Features */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      fontWeight: 600,
                      marginBottom: 3,
                      color: "rgb(31, 41, 55)",
                    }}
                  >
                    Current Plan & Features
                  </Typography>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "'Rubik', sans-serif",
                            fontWeight: 600,
                            color: "rgb(31, 41, 55)",
                          }}
                        >
                          {planType.charAt(0).toUpperCase() + planType.slice(1)}{" "}
                          Plan
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "'Rubik', sans-serif",
                            color: "rgb(107, 114, 128)",
                          }}
                        >
                          {isActivePlan ? "Active" : "Expired"} •{" "}
                          {checkFeature("cloud-storage")
                            ? "Cloud Storage"
                            : "Local Storage Only"}
                        </Typography>
                      </div>
                      {planType === "free" && (
                        <Button
                          onClick={handleShowPricing}
                          variant="outlined"
                          size="small"
                          sx={{
                            textTransform: "none",
                            fontFamily: "'Rubik', sans-serif",
                            borderColor: "rgb(19, 135, 194)",
                            color: "rgb(19, 135, 194)",
                            "&:hover": {
                              backgroundColor: "rgba(19, 135, 194, 0.04)",
                            },
                          }}
                        >
                          Upgrade
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        {
                          feature: "unlimited-books",
                          label: "Unlimited Books",
                        },
                        { feature: "cloud-storage", label: "Cloud Storage" },
                        { feature: "export-pdf", label: "PDF Export" },
                        { feature: "export-docx", label: "Word Export" },
                        { feature: "collaboration", label: "Collaboration" },
                        {
                          feature: "version-history",
                          label: "Version History",
                        },
                      ].map(({ feature, label }) => (
                        <div key={feature} className="flex items-center">
                          <span
                            className={`mr-2 ${
                              checkFeature(feature)
                                ? "text-green-500"
                                : "text-gray-400"
                            }`}
                          >
                            {checkFeature(feature) ? "✓" : "✗"}
                          </span>
                          <span
                            className={`${
                              checkFeature(feature)
                                ? "text-gray-700"
                                : "text-gray-400"
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      fontWeight: 600,
                      marginBottom: 3,
                      color: "rgb(31, 41, 55)",
                    }}
                  >
                    Account Actions
                  </Typography>

                  <div className="flex gap-4">
                    <Button
                      variant="outlined"
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        fontFamily: "'Rubik', sans-serif",
                        py: 1.5,
                        borderColor: "rgb(209, 213, 219)",
                        color: "rgb(107, 114, 128)",
                        "&:hover": {
                          borderColor: "rgb(19, 135, 194)",
                          backgroundColor: "rgba(19, 135, 194, 0.04)",
                        },
                      }}
                    >
                      Export All Data
                    </Button>

                    <Button
                      variant="outlined"
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        fontFamily: "'Rubik', sans-serif",
                        py: 1.5,
                        borderColor: "rgb(239, 68, 68)",
                        color: "rgb(239, 68, 68)",
                        "&:hover": {
                          borderColor: "rgb(220, 38, 38)",
                          backgroundColor: "rgba(239, 68, 68, 0.04)",
                        },
                      }}
                    >
                      Permanently Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer - 100px tall */}
          <footer className="h-[100px] flex items-center justify-center bg-gray-200">
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontFamily: "'Rubik', sans-serif" }}
            >
              © 2025 Twain Story Builder. All rights reserved.
            </Typography>
          </footer>

          {/* Pricing Modal - Available for account settings */}
          <TwainStoryPricingModal
            open={showPricing}
            onClose={handleClosePricing}
            onUpgrade={handleUpgradePlan}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col">
        {/* Header - 300px tall */}
        <header
          className="h-[300px] flex flex-col justify-center items-center text-white relative"
          style={{ backgroundColor: "rgb(38, 52, 63)" }}
        >
          {/* Profile Menu - Top Right */}
          <div className="absolute top-4 right-4 flex items-center">
            <div className="relative">
              <IconButton onClick={handleMenuOpen}>
                <UserAvatar session={session} />
              </IconButton>
            </div>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <div className="ml-2 pb-1 pt-2">
                <Chip {...getPlanChipProps(planType)} />
              </div>
              <MenuItem onClick={handleAccountSettings}>
                Account Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>Log Out</MenuItem>
            </Menu>
          </div>

          <Image
            src="/images/twain-logo.png"
            alt="Twain Logo"
            width={120}
            height={120}
            style={{
              filter: "invert(1) brightness(100%)",
              marginBottom: "32px",
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 600,
              marginBottom: 1,
            }}
          >
            <span className="block sm:hidden">Welcome Back</span>
            <span className="hidden sm:block">
              Welcome Back, {session?.user?.name?.split(" ")[0] || "Writer"}
            </span>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 300,
              fontSize: "14px",
              textAlign: "center",
              maxWidth: "600px",
              px: { xs: 3, sm: 0 },
            }}
          >
            This is your bookshelf, where you can write, plan, edit and typeset
            your books
          </Typography>
        </header>

        {/* Main content area - flexible height */}
        <main className="flex-1 bg-gray-100 p-4 sm:p-8">
          <div className="w-[95%] sm:w-[90%] md:w-[80%] mx-auto">
            {/* Filter buttons */}
            <div className="flex justify-center mb-6">
              <ButtonGroup
                variant="outlined"
                aria-label="filter books and stories"
                sx={{
                  "& .MuiButton-root": {
                    fontFamily: "'Rubik', sans-serif",
                    textTransform: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    px: 3,
                    py: 1,
                    borderColor: "rgb(209, 213, 219)",
                    color: "rgb(107, 114, 128)",
                    "&:hover": {
                      borderColor: "rgb(19, 135, 194)",
                      backgroundColor: "rgba(19, 135, 194, 0.04)",
                    },
                  },
                  "& .MuiButton-root.Mui-selected": {
                    backgroundColor: "rgb(19, 135, 194)",
                    color: "white",
                    borderColor: "rgb(19, 135, 194)",
                    "&:hover": {
                      backgroundColor: "rgb(15, 108, 155)",
                      borderColor: "rgb(15, 108, 155)",
                    },
                  },
                }}
              >
                <Button
                  onClick={() => setFilter("all")}
                  className={filter === "all" ? "Mui-selected" : ""}
                >
                  All ({books.length + quickStories.length})
                </Button>
                <Button
                  onClick={() => setFilter("books")}
                  className={filter === "books" ? "Mui-selected" : ""}
                >
                  Books ({books.length})
                </Button>
                <Button
                  onClick={() => setFilter("stories")}
                  className={filter === "stories" ? "Mui-selected" : ""}
                >
                  Stories ({quickStories.length})
                </Button>
              </ButtonGroup>
            </div>

            {/* Books flex container with custom spacing */}
            <div
              style={{
                display: "grid",
                width: "100%",
                rowGap: "1rem",
                gridTemplateColumns: "repeat(2, 1fr)",
                gridColumnGap: "0.75rem",
                justifyItems: "center",
                paddingBottom: "1rem",
                WebkitTransition: "all .3s ease 0ms",
                transition: "all .3s ease 0ms",
              }}
              className="sm:!flex sm:flex-wrap sm:justify-start sm:gap-0 sm:!w-full"
            >
              {/* Create/Import book card - first card - only show if there are existing books or stories */}
              {(books.length > 0 || quickStories.length > 0) &&
                !(filter === "stories" && quickStories.length === 0) &&
                !(filter === "books" && books.length === 0) && (
                  <div
                    className="hover:shadow-md transition-shadow cursor-pointer flex flex-col rounded-md w-full max-w-[176px] sm:w-[176px] sm:max-w-none"
                    style={{
                      aspectRatio: "176/268",
                      backgroundColor: "rgb(227, 230, 230)",
                    }}
                  >
                    <div className="flex-1 flex flex-col justify-center items-center p-2 space-y-2">
                      {/* Create Book Button */}
                      <button
                        className="w-full flex flex-col items-center space-y-1 p-2 rounded cursor-pointer"
                        onClick={handleCreateBookClick}
                      >
                        <AddCircleOutlinedIcon
                          sx={{
                            fontSize: 64,
                            color: "rgb(100, 114, 127)",
                            transition: "transform 0.2s ease",
                            "&:hover": {
                              transform: "scale(1.1)",
                            },
                          }}
                        />
                        <span className="text-sm font-medium text-gray-800">
                          Create book
                        </span>
                      </button>

                      {/* Divider Line */}
                      <div className="w-full border-b border-gray-300 my-2"></div>

                      {/* Create Story Button */}
                      <button
                        className="w-full flex flex-col items-center space-y-1 p-2 rounded cursor-pointer"
                        onClick={handleCreateStoryClick}
                      >
                        <AddCircleOutlinedIcon
                          sx={{
                            fontSize: 64,
                            color: "rgb(34, 197, 94)",
                            transition: "transform 0.2s ease",
                            "&:hover": {
                              transform: "scale(1.1)",
                            },
                          }}
                        />
                        <span className="text-sm font-medium text-gray-800">
                          Create Story
                        </span>
                      </button>
                    </div>
                  </div>
                )}

              {/* Book cards */}
              {(filter === "all" || filter === "books") &&
                books.map((bookData: Book) => {
                  return (
                    <div
                      key={bookData.id}
                      className="bg-white hover:shadow-md cursor-pointer flex flex-col rounded-r-md relative group w-full max-w-[176px] sm:w-[176px] sm:max-w-none"
                      style={{
                        aspectRatio: "176/268",
                        borderLeft: "8px solid rgb(100, 114, 127)",
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {/* Hover overlay with icons - covers entire card */}
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-r-md z-10">
                        {/* Book info - always show */}
                        <div className="text-center mb-4">
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: "'Alike', serif",
                              fontSize: "16px",
                              fontWeight: "bold",
                              color: "white",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                              mb: 1,
                            }}
                          >
                            {bookData.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontSize: "13px",
                              fontWeight: 400,
                              color: "white",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                            }}
                          >
                            {bookData.wordCount} words
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontSize: "12px",
                              fontWeight: 300,
                              color: "rgba(255,255,255,0.9)",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                              mt: 0.25,
                            }}
                          >
                            Started on{" "}
                            {new Date(bookData.createdAt).toLocaleDateString()}
                          </Typography>
                        </div>

                        {/* Action icons */}
                        <div className="flex items-center space-x-4">
                          <SettingsOutlinedIcon
                            onClick={() => handleManageBook(bookData)}
                            sx={{
                              fontSize: 32,
                              color: "white",
                              cursor: "pointer",
                              transition: "transform 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                              },
                            }}
                          />
                          <DrawOutlinedIcon
                            onClick={() => handleWriteBook(bookData)}
                            sx={{
                              fontSize: 32,
                              color: "white",
                              cursor: "pointer",
                              transition: "transform 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                              },
                            }}
                          />
                        </div>
                      </div>

                      {bookData.coverImage ? (
                        // Cover image fills entire card - no text overlay
                        <div className="w-full flex-1 relative z-0 overflow-hidden">
                          <Image
                            src={bookData.coverImage}
                            alt={`${bookData.title} cover`}
                            fill
                            style={{ objectFit: "cover" }}
                            className="rounded-r-sm"
                          />
                        </div>
                      ) : (
                        // No cover image - traditional layout
                        <>
                          <div className="w-full h-48 bg-white flex items-start justify-start p-2 relative overflow-hidden">
                            <div className="flex flex-col">
                              <Typography
                                variant="body1"
                                sx={{
                                  fontFamily: "'Alike', serif",
                                  fontSize: "18px",
                                  fontWeight: "bold",
                                  color: "text.secondary",
                                }}
                              >
                                {bookData.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Rubik', sans-serif",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: "rgb(100, 114, 127)", // Blue-gray text to match book border
                                  mt: 0.5,
                                }}
                              >
                                BOOK
                              </Typography>
                            </div>
                          </div>
                          <div className="px-3 pb-3 flex items-end justify-center flex-1">
                            <div className="text-center">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Rubik', sans-serif",
                                  fontSize: "14px",
                                  fontWeight: 400,
                                  textAlign: "center",
                                }}
                              >
                                {bookData.wordCount} words
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Rubik', sans-serif",
                                  fontSize: "12px",
                                  fontWeight: 300,
                                  textAlign: "center",
                                  color: "text.secondary",
                                  mt: 0.5,
                                }}
                              >
                                Started on{" "}
                                {new Date(
                                  bookData.createdAt
                                ).toLocaleDateString()}
                              </Typography>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

              {/* Empty state message */}
              {filter === "all" &&
                books.length === 0 &&
                quickStories.length === 0 && (
                  <div
                    className="col-span-2 sm:col-span-full flex items-center justify-center w-full"
                    style={{ minHeight: "120px" }}
                  >
                    <div className="p-6 w-full text-center">
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "'Alike', serif",
                          fontSize: "24px",
                          fontWeight: 500,
                          color: "rgb(75, 85, 99)",
                          lineHeight: 1.5,
                          mb: 2,
                        }}
                      >
                        You haven&apos;t written anything,
                        <br /> why not get going my scribe and create a book or
                        story.
                      </Typography>
                      <div className="flex items-center justify-center space-x-4 pt-6">
                        <button
                          onClick={handleCreateBookClick}
                          className="flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                          style={{ backgroundColor: "rgb(100, 114, 127)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgb(80, 94, 107)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgb(100, 114, 127)";
                          }}
                        >
                          <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                          <span className="font-medium">Create Book</span>
                        </button>
                        {/* <span className="text-blue-400">|</span> */}
                        <button
                          onClick={handleCreateStoryClick}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                        >
                          <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                          <span className="font-medium">Create Story</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              {/* Empty state message */}
              {filter === "books" && books.length === 0 && (
                <div
                  className="col-span-2 sm:col-span-full flex items-center justify-center w-full"
                  style={{ minHeight: "120px" }}
                >
                  <div className="p-6 w-full text-center">
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "'Alike', serif",
                        fontSize: "24px",
                        fontWeight: 500,
                        color: "rgb(75, 85, 99)",
                        lineHeight: 1.5,
                        mb: 2,
                      }}
                    >
                      You haven&apos;t written anything,
                      <br /> why not get going my scribe and create a book.
                    </Typography>
                    <div className="flex items-center justify-center space-x-4 pt-6">
                      <button
                        onClick={handleCreateBookClick}
                        className="flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                        style={{ backgroundColor: "rgb(100, 114, 127)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgb(80, 94, 107)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgb(100, 114, 127)";
                        }}
                      >
                        <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                        <span className="font-medium">Create Book</span>
                      </button>
                      {/* <span className="text-blue-400">|</span> */}
                      <button
                        onClick={handleCreateStoryClick}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                      >
                        <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                        <span className="font-medium">Create Story</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Story cards */}
              {(filter === "all" || filter === "stories") &&
                quickStories.map((storyData: Book) => {
                  return (
                    <div
                      key={`story-${storyData.id}`}
                      className="bg-white hover:shadow-md cursor-pointer flex flex-col rounded-r-md relative group w-full max-w-[176px] sm:w-[176px] sm:max-w-none"
                      style={{
                        aspectRatio: "176/268",
                        borderLeft: "8px solid rgb(34, 197, 94)", // Green border
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {/* Hover overlay with icons - covers entire card */}
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-r-md z-10">
                        {/* Story info */}
                        <div className="text-center mb-4">
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: "'Alike', serif",
                              fontSize: "16px",
                              fontWeight: "bold",
                              color: "white",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                              mb: 1,
                            }}
                          >
                            {storyData.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontSize: "13px",
                              fontWeight: 400,
                              color: "white",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                            }}
                          >
                            {storyData.wordCount} words
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontSize: "12px",
                              fontWeight: 300,
                              color: "rgba(255,255,255,0.9)",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                              mt: 0.25,
                            }}
                          >
                            Started on{" "}
                            {new Date(storyData.createdAt).toLocaleDateString()}
                          </Typography>
                        </div>

                        {/* Action icons */}
                        <div className="flex items-center space-x-4">
                          <DrawOutlinedIcon
                            onClick={() => {
                              setSelectedBook(storyData);
                              setIsQuickStoryMode(true);
                              setCurrentView("write");
                            }}
                            sx={{
                              fontSize: 32,
                              color: "white",
                              cursor: "pointer",
                              transition: "transform 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                              },
                            }}
                          />
                          <DeleteOutlineOutlinedIcon
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStory(storyData);
                            }}
                            sx={{
                              fontSize: 32,
                              color: "white",
                              cursor: "pointer",
                              transition: "transform 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                                color: "#ff6b6b",
                              },
                            }}
                          />
                        </div>
                      </div>

                      {/* No cover image - traditional layout with green accent */}
                      <div className="w-full h-48 bg-white flex items-start justify-start p-2 relative overflow-hidden">
                        <div className="flex flex-col">
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: "'Alike', serif",
                              fontSize: "18px",
                              fontWeight: "bold",
                              color: "text.secondary",
                            }}
                          >
                            {storyData.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "rgb(34, 197, 94)", // Green text
                              mt: 0.5,
                            }}
                          >
                            STORY
                          </Typography>
                        </div>
                      </div>
                      <div className="px-3 pb-3 flex items-end justify-center flex-1">
                        <div className="text-center">
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontSize: "14px",
                              fontWeight: 400,
                              textAlign: "center",
                            }}
                          >
                            {storyData.wordCount} words
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontSize: "12px",
                              fontWeight: 300,
                              textAlign: "center",
                              color: "text.secondary",
                              mt: 0.5,
                            }}
                          >
                            Started on{" "}
                            {new Date(storyData.createdAt).toLocaleDateString()}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Empty state for stories */}
              {filter === "stories" && quickStories.length === 0 && (
                <div
                  className="col-span-2 sm:col-span-full flex items-center justify-center w-full"
                  style={{ minHeight: "120px" }}
                >
                  <div className="p-6 w-full text-center">
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "'Alike', serif",
                        fontSize: "24px",
                        fontWeight: 500,
                        color: "rgb(75, 85, 99)",
                        lineHeight: 1.5,
                        mb: 2,
                      }}
                    >
                      You haven&apos;t written anything,
                      <br /> why not get going my scribe and create a story.
                    </Typography>
                    <div className="flex items-center justify-center space-x-4 pt-6">
                      <button
                        onClick={handleCreateBookClick}
                        className="flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                        style={{ backgroundColor: "rgb(100, 114, 127)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgb(80, 94, 107)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgb(100, 114, 127)";
                        }}
                      >
                        <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                        <span className="font-medium">Create Book</span>
                      </button>
                      {/* <span className="text-blue-400">|</span> */}
                      <button
                        onClick={handleCreateStoryClick}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                      >
                        <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                        <span className="font-medium">Create Story</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Plan Status Notice */}
        <div
          className="w-full text-center py-4 px-8 text-gray-200 text-xs"
          style={{ backgroundColor: "rgb(38, 52, 63)" }}
        >
          You are subscribed to the{" "}
          {planType.charAt(0).toUpperCase() + planType.slice(1)} plan.
          <br />
          {planType === "free" &&
            "Data may be periodically cleared from local storage when you clear cache. Your content will also not be accessible across devices"}
          {!isActivePlan && planType !== "free" && "Your plan has expired"}.
          <br />
          {(planType === "free" || !isActivePlan) && (
            <>
              <span
                onClick={handleShowPricing}
                className="underline cursor-pointer hover:text-white transition-colors duration-200"
              >
                {planType === "free"
                  ? "Upgrade to a paid plan"
                  : "Renew your subscription"}
              </span>{" "}
              to retain your data permanently and access it across all your
              devices.
            </>
          )}
          {isActivePlan && planType !== "free" && (
            <span className="text-green-200">
              Enjoy unlimited cloud storage and premium features!
            </span>
          )}
        </div>

        {/* Footer - 100px tall */}
        <footer className="h-[100px] flex items-center justify-center bg-gray-200">
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: "'Rubik', sans-serif" }}
          >
            © 2025 Twain Story Builder. All rights reserved.
          </Typography>
        </footer>

        {/* Create Book Modal */}
        <Modal
          open={createBookModalOpen}
          onClose={handleCreateBookModalClose}
          aria-labelledby="create-book-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: { xs: 0, sm: "50%" },
              left: { xs: 0, sm: "50%" },
              transform: { xs: "none", sm: "translate(-50%, -50%)" },
              width: { xs: "100%", sm: 450 },
              height: { xs: "100vh", sm: "auto" },
              bgcolor: "background.paper",
              borderRadius: { xs: 0, sm: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              display: { xs: "flex", sm: "block" },
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            {/* Header with same background as page header */}
            <Box
              sx={{
                backgroundColor: "rgb(38, 52, 63)",
                color: "white",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                id="create-book-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Create New Book
              </Typography>
              <IconButton
                onClick={handleCreateBookModalClose}
                sx={{
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Modal content */}
            <Box
              sx={{
                p: { xs: 3, sm: 4 },
                flex: { xs: 1, sm: "none" },
                display: { xs: "flex", sm: "block" },
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              <TextField
                fullWidth
                label="Book Title"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                variant="outlined"
                sx={{ mb: 4 }}
                autoFocus
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                }}
              >
                <Button
                  onClick={handleCreateBookModalClose}
                  variant="outlined"
                  sx={{
                    flex: 1,
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBook}
                  variant="contained"
                  disabled={!bookTitle.trim()}
                  sx={{
                    flex: 1,
                    backgroundColor: "rgb(19, 135, 194)",
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    py: 1.5,
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "rgb(15, 108, 155)",
                      boxShadow: "none",
                    },
                    "&:disabled": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Create Book
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Create Story Modal */}
        <Modal
          open={createStoryModalOpen}
          onClose={handleCreateStoryModalClose}
          aria-labelledby="create-story-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: { xs: 0, sm: "50%" },
              left: { xs: 0, sm: "50%" },
              transform: { xs: "none", sm: "translate(-50%, -50%)" },
              width: { xs: "100%", sm: 450 },
              height: { xs: "100vh", sm: "auto" },
              bgcolor: "background.paper",
              borderRadius: { xs: 0, sm: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              display: { xs: "flex", sm: "block" },
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            {/* Header with same background as page header */}
            <Box
              sx={{
                backgroundColor: "rgb(38, 52, 63)",
                color: "white",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                id="create-story-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Create New Story
              </Typography>
              <IconButton
                onClick={handleCreateStoryModalClose}
                sx={{
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Modal content */}
            <Box
              sx={{
                p: { xs: 3, sm: 4 },
                flex: { xs: 1, sm: "none" },
                display: { xs: "flex", sm: "block" },
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              <TextField
                fullWidth
                label="Story Title"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                variant="outlined"
                sx={{ mb: 4 }}
                autoFocus
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                }}
              >
                <Button
                  onClick={handleCreateStoryModalClose}
                  variant="outlined"
                  sx={{
                    flex: 1,
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStory}
                  variant="contained"
                  disabled={!storyTitle.trim()}
                  sx={{
                    flex: 1,
                    backgroundColor: "rgb(19, 135, 194)",
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    py: 1.5,
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "rgb(15, 108, 155)",
                      boxShadow: "none",
                    },
                    "&:disabled": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Create Story
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Notification */}
        {notification && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              backgroundColor: "rgb(34, 197, 94)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 9999,
              fontFamily: "'Rubik', sans-serif",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {notification}
          </div>
        )}

        {/* Pricing Modal - Available for logged-in users */}
        <TwainStoryPricingModal
          open={showPricing}
          onClose={handleClosePricing}
          onUpgrade={handleUpgradePlan}
        />
      </div>
    );
  }

  // User is not logged in - show the login screen
  return (
    <>
      <div
        className="h-screen flex flex-col md:flex-row"
        style={{
          fontFamily: "'Crimson-Text', serif",
          color: "rgb(136, 185, 84)",
        }}
      >
        {/* Mobile: Single container with background image, Desktop: Login Panel (50%) */}
        <div
          className="w-full md:w-1/2 bg-white flex flex-col relative md:bg-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Content layer */}
          <div className="relative z-10 flex flex-col sm:h-full h-screen">
            {/* Icon in top left */}
            <div className="pt-32 pl-16 md:pt-32 md:pl-32">
              <Image
                src="/images/twain-logo.png"
                alt="Twain Logo"
                width={160}
                height={160}
              />
            </div>

            {/* Centered login content */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-12">
              <div className="space-y-6 pl-4 pr-4 py-8 md:pl-20 md:pr-8 md:py-12">
                <Typography
                  variant="body1"
                  sx={{
                    color: "#1f2937",
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 400,
                    letterSpacing: 0,
                    fontStretch: "100%",
                    marginBottom: "8px",
                  }}
                >
                  Welcome Back Writer!
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    color: "#1f2937",
                    fontFamily: "'Crimson-Text', serif",
                    fontWeight: 400,
                    letterSpacing: 0,
                    fontStretch: "100%",
                    lineHeight: 1.2,
                    marginBottom: "32px",
                  }}
                >
                  Log in to Twain Story Builder
                </Typography>

                <Button
                  variant="contained"
                  onClick={handleSignIn}
                  sx={{
                    backgroundColor: "#4285f4",
                    color: "white",
                    padding: "12px 24px",
                    fontSize: "16px",
                    textTransform: "none",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    "&:hover": {
                      backgroundColor: "#3367d6",
                    },
                    "&:disabled": {
                      backgroundColor: "#cccccc",
                    },
                  }}
                  startIcon={
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53L2.18 16.93C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07L2.18 7.07C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                    </svg>
                  }
                >
                  Sign in with Google
                </Button>
              </div>
            </div>

            {/* Request Access and Pricing - bottom aligned on mobile, normal position on desktop */}
            <div className="mt-auto p-4 md:p-6 md:mt-0">
              <div className="flex items-center justify-between">
                <Typography
                  variant="body2"
                  onClick={handleRequestAccess}
                  sx={{
                    color: "rgb(136, 185, 84)",
                    fontFamily: "'Crimson-Text', serif",
                    fontStretch: "100%",
                    letterSpacing: 0,
                    cursor: "pointer",
                    "&:hover": {
                      color: "rgb(100, 140, 60)",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Request Access
                </Typography>
                <Typography
                  variant="body2"
                  onClick={handleShowPricing}
                  sx={{
                    color: "rgb(136, 185, 84)",
                    fontFamily: "'Crimson-Text', serif",
                    fontStretch: "100%",
                    letterSpacing: 0,
                    cursor: "pointer",
                    "&:hover": {
                      color: "rgb(100, 140, 60)",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Pricing
                </Typography>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Image Column (hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
          <Image
            src={backgroundImage}
            alt="Twain Story Builder"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Pricing Modal - Available globally for all views */}
      <TwainStoryPricingModal
        open={showPricing}
        onClose={handleClosePricing}
        onUpgrade={handleUpgradePlan}
      />
    </>
  );
};

// Export utility functions for use by other components
export {
  loadBooksFromStorage,
  saveBooksToStorage,
  updateBookWordCount,
  getBooksStorageKey,
  loadQuickStoriesFromStorage,
  saveQuickStoriesToStorage,
  updateQuickStoryWordCount,
  getQuickStoriesStorageKey,
};
export type { Book };

export default TwainStoryBuilder;
