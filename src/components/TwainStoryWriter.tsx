"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Modal,
  Box,
  TextField,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CloseIcon from "@mui/icons-material/Close";
import FaceOutlinedIcon from "@mui/icons-material/FaceOutlined";

// Define Quill types
interface QuillInstance {
  root: HTMLElement;
  focus(): void;
  getContents(): unknown;
  setContents(delta: unknown): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}

interface Idea {
  id: string;
  title: string;
  notes: string;
  createdAt: Date;
}

interface Character {
  id: string;
  avatar?: string; // base64 image data
  name: string;
  gender: string;
  backstory: string;
  characterization: string;
  voice: string;
  appearance: string;
  friendsFamily: string;
  favorites: string;
  misc: string;
  createdAt: Date;
}

interface TwainStoryWriterProps {
  book: { id: number; title: string; wordCount: number };
  onBackToBookshelf: () => void;
}

const TwainStoryWriter: React.FC<TwainStoryWriterProps> = ({
  book,
  onBackToBookshelf,
}) => {
  const quillRef = useRef<HTMLDivElement | null>(null);
  const [quillInstance, setQuillInstance] = useState<QuillInstance | null>(
    null
  );
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [createIdeaModalOpen, setCreateIdeaModalOpen] = useState(false);
  const [createCharacterModalOpen, setCreateCharacterModalOpen] =
    useState(false);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaNotes, setIdeaNotes] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characterGender, setCharacterGender] = useState("");
  const [characterBackstory, setCharacterBackstory] = useState("");
  const [characterCharacterization, setCharacterCharacterization] =
    useState("");
  const [characterVoice, setCharacterVoice] = useState("");
  const [characterAppearance, setCharacterAppearance] = useState("");
  const [characterFriendsFamily, setCharacterFriendsFamily] = useState("");
  const [characterFavorites, setCharacterFavorites] = useState("");
  const [characterMisc, setCharacterMisc] = useState("");
  const [characterAvatar, setCharacterAvatar] = useState<string | null>(null);

  // Initialize Quill editor
  useEffect(() => {
    if (typeof window !== "undefined" && quillRef.current && !quillInstance) {
      // Load Quill CSS first
      const linkElement = document.createElement("link");
      linkElement.rel = "stylesheet";
      linkElement.href = "https://cdn.quilljs.com/1.3.6/quill.bubble.css";
      document.head.appendChild(linkElement);

      // Then load Quill
      import("quill")
        .then((Quill) => {
          if (quillRef.current) {
            const quill = new Quill.default(quillRef.current, {
              theme: "bubble",
              placeholder: "Start writing your story...",
              modules: {
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  [{ indent: "-1" }, { indent: "+1" }],
                  [{ align: [] }],
                  ["blockquote", "code-block"],
                  ["clean"],
                ],
              },
            });

            // Set custom font for editor content
            quill.root.style.fontFamily = "'Crimson Text', serif";
            quill.root.style.fontSize = "18px";
            quill.root.style.lineHeight = "1.6";

            setQuillInstance(quill);
          }
        })
        .catch((error) => {
          console.error("Failed to load Quill:", error);
        });
    }
  }, [quillInstance]);

  // Load ideas from localStorage on component mount
  useEffect(() => {
    const storedIdeas = localStorage.getItem(`twain-ideas-${book.id}`);
    if (storedIdeas) {
      try {
        const parsedIdeas = JSON.parse(storedIdeas).map(
          (idea: Omit<Idea, "createdAt"> & { createdAt: string }) => ({
            ...idea,
            createdAt: new Date(idea.createdAt),
          })
        );
        setIdeas(parsedIdeas);
      } catch (error) {
        console.error("Failed to parse stored ideas:", error);
      }
    }
  }, [book.id]);

  // Load characters from localStorage on component mount
  useEffect(() => {
    const storedCharacters = localStorage.getItem(
      `twain-characters-${book.id}`
    );
    if (storedCharacters) {
      try {
        const parsedCharacters = JSON.parse(storedCharacters).map(
          (
            character: Omit<Character, "createdAt"> & { createdAt: string }
          ) => ({
            ...character,
            createdAt: new Date(character.createdAt),
          })
        );
        setCharacters(parsedCharacters);
      } catch (error) {
        console.error("Failed to parse stored characters:", error);
      }
    }
  }, [book.id]);

  const handleCreateIdeaClick = () => {
    setCreateIdeaModalOpen(true);
  };

  const handleCreateIdeaModalClose = () => {
    setCreateIdeaModalOpen(false);
    setIdeaTitle("");
    setIdeaNotes("");
  };

  const handleCreateIdea = () => {
    if (ideaTitle.trim()) {
      const newIdea: Idea = {
        id: Date.now().toString(),
        title: ideaTitle.trim(),
        notes: ideaNotes.trim(),
        createdAt: new Date(),
      };

      const updatedIdeas = [...ideas, newIdea];
      setIdeas(updatedIdeas);

      // Store in localStorage
      localStorage.setItem(
        `twain-ideas-${book.id}`,
        JSON.stringify(updatedIdeas)
      );

      handleCreateIdeaModalClose();
    }
  };

  const handleCreateCharacterClick = () => {
    setCreateCharacterModalOpen(true);
  };

  const handleCreateCharacterModalClose = () => {
    setCreateCharacterModalOpen(false);
    setCharacterName("");
    setCharacterGender("");
    setCharacterBackstory("");
    setCharacterCharacterization("");
    setCharacterVoice("");
    setCharacterAppearance("");
    setCharacterFriendsFamily("");
    setCharacterFavorites("");
    setCharacterMisc("");
    setCharacterAvatar(null);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCharacterAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCharacter = () => {
    if (characterName.trim()) {
      const newCharacter: Character = {
        id: Date.now().toString(),
        avatar: characterAvatar || undefined,
        name: characterName.trim(),
        gender: characterGender.trim(),
        backstory: characterBackstory.trim(),
        characterization: characterCharacterization.trim(),
        voice: characterVoice.trim(),
        appearance: characterAppearance.trim(),
        friendsFamily: characterFriendsFamily.trim(),
        favorites: characterFavorites.trim(),
        misc: characterMisc.trim(),
        createdAt: new Date(),
      };

      const updatedCharacters = [...characters, newCharacter];
      setCharacters(updatedCharacters);

      // Store in localStorage
      localStorage.setItem(
        `twain-characters-${book.id}`,
        JSON.stringify(updatedCharacters)
      );

      handleCreateCharacterModalClose();
    }
  };

  const accordionSections = [
    {
      title: "IDEAS",
      content: "Store your creative ideas and inspiration here...",
    },
    {
      title: "CHARACTERS",
      content:
        "Develop your characters, their backgrounds, motivations, and relationships...",
    },
    {
      title: "OUTLINE",
      content: "Structure your story with chapter outlines and plot points...",
    },
    {
      title: "CHAPTERS",
      content: "Create and organize your story chapters...",
    },
    {
      title: "PARTS",
      content:
        "Organize your story into parts. Parts are made up of chapters...",
    },
  ];
  return (
    <div className="h-screen flex">
      {/* Column 1: Sidebar with Accordions - 300px wide */}
      <div className="w-[300px] bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header with Back Button */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <IconButton
              onClick={onBackToBookshelf}
              size="small"
              sx={{
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

        {/* Accordion Sections */}
        <div className="flex-1 overflow-y-auto">
          {accordionSections.map((section) => (
            <Accordion
              key={section.title}
              disableGutters
              elevation={0}
              sx={{
                "&:before": {
                  display: "none",
                },
                borderBottom: "1px solid rgb(229, 231, 235)",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: "transparent",
                  minHeight: "56px",
                  "&.Mui-expanded": {
                    minHeight: "56px",
                  },
                  "& .MuiAccordionSummary-content": {
                    margin: "12px 0",
                    "&.Mui-expanded": {
                      margin: "12px 0",
                    },
                  },
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <IconButton
                    component="span"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (section.title === "IDEAS") {
                        handleCreateIdeaClick();
                      } else if (section.title === "CHARACTERS") {
                        handleCreateCharacterClick();
                      }
                    }}
                    sx={{
                      color: "rgb(19, 135, 194)",
                      padding: "2px",
                      "&:hover": {
                        backgroundColor: "rgba(19, 135, 194, 0.1)",
                      },
                    }}
                  >
                    <AddCircleOutlinedIcon sx={{ fontSize: "18px" }} />
                  </IconButton>
                  <Typography
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "#1f2937",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {section.title}
                  </Typography>
                </div>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  padding: "16px 24px",
                  backgroundColor: "rgb(249, 250, 251)",
                }}
              >
                {section.title === "IDEAS" && ideas.length > 0 ? (
                  <div className="space-y-3">
                    {ideas.map((idea) => (
                      <div
                        key={idea.id}
                        className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200"
                      >
                        <DescriptionOutlinedIcon
                          sx={{
                            fontSize: 20,
                            color: "rgb(107, 114, 128)",
                            marginTop: "2px",
                          }}
                        />
                        <div className="flex-1">
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 500,
                              fontSize: "14px",
                              color: "#1f2937",
                              lineHeight: 1.4,
                            }}
                          >
                            {idea.title.length > 100
                              ? `${idea.title.substring(0, 100)}...`
                              : idea.title}
                          </Typography>
                          {idea.notes && (
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 400,
                                fontSize: "12px",
                                color: "rgb(107, 114, 128)",
                                lineHeight: 1.4,
                                marginTop: "4px",
                              }}
                            >
                              {idea.notes.length > 150
                                ? `${idea.notes.substring(0, 150)}...`
                                : idea.notes}
                            </Typography>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : section.title === "CHARACTERS" && characters.length > 0 ? (
                  <div className="space-y-3">
                    {characters.map((character) => (
                      <div
                        key={character.id}
                        className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200"
                      >
                        {character.avatar ? (
                          <img
                            src={character.avatar}
                            alt="Avatar"
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <FaceOutlinedIcon
                            sx={{
                              fontSize: 40,
                              color: "rgb(107, 114, 128)",
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 500,
                              fontSize: "14px",
                              color: "#1f2937",
                              lineHeight: 1.4,
                            }}
                          >
                            {character.name}
                          </Typography>
                          {character.gender && (
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 400,
                                fontSize: "12px",
                                color: "rgb(107, 114, 128)",
                                lineHeight: 1.4,
                                marginTop: "4px",
                              }}
                            >
                              Gender: {character.gender}
                            </Typography>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      fontWeight: 400,
                      fontSize: "13px",
                      color: "rgb(107, 114, 128)",
                      lineHeight: 1.5,
                    }}
                  >
                    {section.content}
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </div>

      {/* Column 2: Quill Editor - Flexible width */}
      <div className="flex-1 flex flex-col">
        {/* Header with Title */}
        <div
          className="p-4 border-b min-h-[67px] border-gray-200 bg-white flex items-center"
          style={{ zIndex: 10 }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 600,
              fontSize: "20px",
              color: "#1f2937",
              lineHeight: 1,
              display: "block",
            }}
          >
            {book?.title || "Untitled Book"}
          </Typography>
        </div>

        {/* Editor Container */}
        <div className="flex-1 relative p-4">
          <div
            ref={quillRef}
            className="h-full bg-white rounded-lg"
            style={{
              fontFamily: "'Crimson Text', serif",
              fontSize: "16px",
              minHeight: "400px",
            }}
          />
        </div>

        {/* Demo Notice */}
        <div className="w-full bg-red-400 text-center py-4 text-white font-medium">
          DEMO ONLY - NO FUNCTIONALITY AT THIS TIME
        </div>
      </div>

      {/* Column 3: Reserved for future features */}
      <div className="w-0">
        {/* This column is ready for future expansion */}
      </div>

      {/* Create Idea Modal */}
      <Modal
        open={createIdeaModalOpen}
        onClose={handleCreateIdeaModalClose}
        aria-labelledby="create-idea-modal-title"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
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
              id="create-idea-modal-title"
              variant="h6"
              component="h2"
              sx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 600,
                margin: 0,
              }}
            >
              Create New Idea
            </Typography>
            <IconButton
              onClick={handleCreateIdeaModalClose}
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
              label="Idea Title"
              value={ideaTitle}
              onChange={(e) => setIdeaTitle(e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
              autoFocus
            />
            <TextField
              fullWidth
              label="Notes (optional)"
              value={ideaNotes}
              onChange={(e) => setIdeaNotes(e.target.value)}
              variant="outlined"
              multiline
              rows={4}
              sx={{ mb: 4 }}
            />
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "space-between",
              }}
            >
              <Button
                onClick={handleCreateIdeaModalClose}
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
                onClick={handleCreateIdea}
                variant="contained"
                disabled={!ideaTitle.trim()}
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
                Create Idea
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Create Character Modal */}
      <Modal
        open={createCharacterModalOpen}
        onClose={handleCreateCharacterModalClose}
        aria-labelledby="create-character-modal-title"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            maxHeight: "80vh",
            bgcolor: "background.paper",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          {/* Header */}
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
              id="create-character-modal-title"
              variant="h6"
              component="h2"
              sx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 600,
                margin: 0,
              }}
            >
              Create New Character
            </Typography>
            <IconButton
              onClick={handleCreateCharacterModalClose}
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
          <Box sx={{ p: 4, overflowY: "auto", maxHeight: "calc(80vh - 80px)" }}>
            {/* Avatar Upload */}
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: "none" }}
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload">
                <IconButton component="span">
                  {characterAvatar ? (
                    <img
                      src={characterAvatar}
                      alt="Avatar Preview"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <FaceOutlinedIcon sx={{ fontSize: 40 }} />
                  )}
                </IconButton>
              </label>
            </Box>

            <TextField
              fullWidth
              label="Name"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
              autoFocus
            />
            <TextField
              fullWidth
              label="Gender"
              value={characterGender}
              onChange={(e) => setCharacterGender(e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Backstory"
              value={characterBackstory}
              onChange={(e) => setCharacterBackstory(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Characterization (Personality, Traits, motivations, etc)"
              value={characterCharacterization}
              onChange={(e) => setCharacterCharacterization(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Voice (Speech, vocab, sense of humor, etc)"
              value={characterVoice}
              onChange={(e) => setCharacterVoice(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Appearance (Height, weight, build, hair/eye color, etc)"
              value={characterAppearance}
              onChange={(e) => setCharacterAppearance(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Friends & Family (Relation to other characters)"
              value={characterFriendsFamily}
              onChange={(e) => setCharacterFriendsFamily(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Favorites (sport, food, animal, music, etc)"
              value={characterFavorites}
              onChange={(e) => setCharacterFavorites(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Misc (title, religion, etc)"
              value={characterMisc}
              onChange={(e) => setCharacterMisc(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "space-between",
              }}
            >
              <Button
                onClick={handleCreateCharacterModalClose}
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
                onClick={handleCreateCharacter}
                variant="contained"
                disabled={!characterName.trim()}
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
                Create Character
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default TwainStoryWriter;
