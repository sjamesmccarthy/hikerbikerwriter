"use client";

import React, { useState, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { HistoryEduOutlined as HistoryEduOutlinedIcon } from "@mui/icons-material";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import Image from "next/image";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TwainStoryWriter from "./TwainStoryWriter";

const TwainStoryBuilder: React.FC = () => {
  const { data: session, status } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createBookModalOpen, setCreateBookModalOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [currentView, setCurrentView] = useState<
    "bookshelf" | "manage" | "write"
  >("bookshelf");
  const [selectedBook, setSelectedBook] = useState<{
    id: number;
    title: string;
    wordCount: number;
  } | null>(null);
  const [managedBookTitle, setManagedBookTitle] = useState("");
  const [managedBookAuthor, setManagedBookAuthor] = useState("");
  const [managedBookSubtitle, setManagedBookSubtitle] = useState("");
  const [managedBookEdition, setManagedBookEdition] = useState("First Edition");
  const [managedBookCopyrightYear, setManagedBookCopyrightYear] = useState(
    new Date().getFullYear().toString()
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Select a random Twain image (1-6)
  const randomImageNumber = Math.floor(Math.random() * 6) + 1;
  const backgroundImage = `/images/twain${randomImageNumber}.png`;

  // Debug: Log which image is being used
  console.log("Loading Twain image:", backgroundImage);

  // Generate stable random titles for each book (won't change on re-render)
  const stableBookData = useState(() => {
    const bookTitles = [
      "Midnight River Dreams",
      "Golden Mountain Trails",
      "Silent Ocean Whispers",
      "Dancing Forest Shadows",
      "Ancient Stone Secrets",
      "Burning Sky Adventures",
      "Lost Valley Mysteries",
      "Frozen Lake Tales",
    ];

    return [1, 2, 3, 4].map((book) => ({
      id: book,
      title: bookTitles[Math.floor(Math.random() * bookTitles.length)],
      wordCount: Math.floor(Math.random() * 346),
    }));
  })[0];

  const handleSignIn = () => {
    signIn("google");
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

  const handleCreateBookClick = () => {
    setCreateBookModalOpen(true);
  };

  const handleCreateBookModalClose = () => {
    setCreateBookModalOpen(false);
    setBookTitle("");
  };

  const handleCreateBook = () => {
    if (bookTitle.trim()) {
      // TODO: Add logic to create the book
      console.log("Creating book:", bookTitle);
      handleCreateBookModalClose();
    }
  };

  const handleManageBook = (book: {
    id: number;
    title: string;
    wordCount: number;
  }) => {
    setSelectedBook(book);
    setManagedBookTitle(book.title);
    setManagedBookAuthor(""); // TODO: Load actual author from book data
    setManagedBookSubtitle(""); // TODO: Load actual subtitle from book data
    setManagedBookEdition("First Edition"); // TODO: Load actual edition from book data
    setManagedBookCopyrightYear(new Date().getFullYear().toString()); // TODO: Load actual copyright year from book data
    setCurrentView("manage");
  };

  const handleBackToBookshelf = () => {
    setCurrentView("bookshelf");
    setSelectedBook(null);
    setManagedBookTitle("");
    setManagedBookAuthor("");
    setManagedBookSubtitle("");
    setManagedBookEdition("First Edition");
    setManagedBookCopyrightYear(new Date().getFullYear().toString());
  };

  const handleSaveBook = () => {
    if (managedBookTitle.trim() && managedBookAuthor.trim()) {
      // TODO: Add logic to save the book
      console.log(
        "Saving book:",
        managedBookTitle,
        managedBookSubtitle ? `(${managedBookSubtitle})` : "",
        "by",
        managedBookAuthor,
        "-",
        managedBookEdition,
        "©",
        managedBookCopyrightYear
      );
      handleBackToBookshelf();
    }
  };

  const handleCoverUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Add logic to handle the uploaded file
      console.log("Selected file:", file.name);
    }
  };

  const handleArchiveBook = () => {
    if (selectedBook) {
      // TODO: Add logic to archive the book
      console.log("Archiving book:", selectedBook.title);
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
      // TODO: Add logic to delete the book
      console.log("Deleting book:", selectedBook.title);
      handleBackToBookshelf();
    }
  };

  const handleWriteBook = (book: {
    id: number;
    title: string;
    wordCount: number;
  }) => {
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
            <div className="absolute top-4 right-4">
              <IconButton onClick={handleMenuOpen}>
                <Avatar
                  src={session?.user?.image || undefined}
                  alt={session?.user?.name || "User"}
                  sx={{ width: 40, height: 40 }}
                />
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
                <MenuItem onClick={handleMenuClose}>Account Settings</MenuItem>
                <MenuItem onClick={handleLogout}>Log Out</MenuItem>
              </Menu>
            </div>

            <HistoryEduOutlinedIcon
              sx={{ fontSize: 120, color: "white", marginBottom: 2 }}
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
          <main className="flex-1 bg-gray-100 p-8">
            <div className="w-[90%] md:w-[60%] mx-auto">
              <div className="">
                <div className="space-y-6">
                  {/* Book Cover and Title Edit */}
                  <div className="flex gap-8 items-start">
                    {/* Book Card with Upload Icon */}
                    <div
                      className="bg-white border border-gray-200 flex flex-col rounded-md cursor-pointer"
                      style={{
                        width: "176px",
                        height: "268px",
                        borderLeft: "8px solid rgb(100, 114, 127)",
                      }}
                      onClick={handleCoverUpload}
                    >
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
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: "none" }}
                      />
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
          <div className="absolute top-4 right-4">
            <IconButton onClick={handleMenuOpen}>
              <Avatar
                src={session?.user?.image || undefined}
                alt={session?.user?.name || "User"}
                sx={{ width: 40, height: 40 }}
              />
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
              <MenuItem onClick={handleMenuClose}>Account Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Log Out</MenuItem>
            </Menu>
          </div>

          <HistoryEduOutlinedIcon
            sx={{ fontSize: 120, color: "white", marginBottom: 2 }}
          />
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 600,
              marginBottom: 1,
            }}
          >
            Welcome Back, James
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
            This is your bookshelf, where you can write, plan, edit and typeset
            your books
          </Typography>
        </header>

        {/* Main content area - flexible height */}
        <main className="flex-1 bg-gray-100 p-8">
          <div className="w-[90%] md:w-[80%] mx-auto">
            {/* Books grid container with custom spacing */}
            <div
              style={{
                display: "grid",
                width: "100%",
                rowGap: "2.5rem",
                gridTemplateColumns: "repeat(auto-fill,minmax(10rem,1fr))",
                gridColumnGap: "1.25rem",
                justifyItems: "center",
                paddingBottom: "2rem",
                WebkitTransition: "all .3s ease 0ms",
                transition: "all .3s ease 0ms",
              }}
            >
              {/* Create/Import book card - first card */}
              <div
                className="hover:shadow-md transition-shadow cursor-pointer flex flex-col rounded-md"
                style={{
                  width: "176px",
                  height: "268px",
                  backgroundColor: "rgb(227, 230, 230)",
                }}
              >
                <div className="flex-1 flex flex-col justify-center items-center p-4 space-y-4">
                  {/* Create Book Button */}
                  <button
                    className="w-full flex flex-col items-center space-y-2 p-3 rounded cursor-pointer"
                    onClick={handleCreateBookClick}
                  >
                    <AddCircleOutlinedIcon
                      sx={{
                        fontSize: 64,
                        color: "rgb(19, 135, 194)",
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
                </div>
              </div>

              {/* Placeholder book cards */}
              {stableBookData.map((bookData) => {
                return (
                  <div
                    key={bookData.id}
                    className="bg-white hover:shadow-md cursor-pointer flex flex-col rounded-md relative group"
                    style={{
                      width: "176px",
                      height: "268px",
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
                    <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center space-x-4 opacity-0 group-hover:opacity-90 transition-opacity duration-200 rounded-md">
                      <SettingsOutlinedIcon
                        onClick={() => handleManageBook(bookData)}
                        sx={{
                          fontSize: 32,
                          color: "rgb(19, 135, 194)",
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
                          color: "rgb(19, 135, 194)",
                          cursor: "pointer",
                          transition: "transform 0.2s ease",
                          "&:hover": {
                            transform: "scale(1.1)",
                          },
                        }}
                      />
                    </div>

                    <div className="w-full h-48 bg-white flex items-start justify-start p-3">
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
                    </div>
                    <div className="px-4 pb-4 flex items-end justify-center flex-1">
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Demo Notice */}
        <div className="w-full bg-red-400 text-center py-4 text-white font-medium">
          DEMO ONLY - NO FUNCTIONALITY AT THIS TIME
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
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 450,
              bgcolor: "background.paper",
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
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
            <Box sx={{ p: 4 }}>
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
      </div>
    );
  }

  // User is not logged in - show the login screen
  return (
    <div
      className="min-h-screen flex"
      style={{
        fontFamily: "'Crimson-Text', serif",
        color: "rgb(136, 185, 84)",
      }}
    >
      {/* Column 1 - Login Panel (50%) */}
      <div className="w-1/2 bg-white flex flex-col">
        {/* Icon in top left */}
        <div className="p-10">
          <HistoryEduOutlinedIcon
            sx={{ fontSize: 80, color: "rgb(136, 185, 84)" }}
          />
        </div>

        {/* Centered login content */}
        <div className="flex-1 flex flex-col justify-center px-12">
          <div className="space-y-6 pl-20 pr-8 py-12">
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

        {/* Request Access in bottom left */}
        <div className="p-6">
          <Typography
            variant="body2"
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
        </div>
      </div>

      {/* Column 2 - Image (50%) */}
      <div className="w-1/2 relative min-h-screen">
        <Image
          src={backgroundImage}
          alt="Twain Story Builder"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
};

export default TwainStoryBuilder;
