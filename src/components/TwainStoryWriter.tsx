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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CloseIcon from "@mui/icons-material/Close";
import FaceOutlinedIcon from "@mui/icons-material/FaceOutlined";
import CancelIcon from "@mui/icons-material/Cancel";

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

interface Chapter {
  id: string;
  title: string;
  content: string; // JSON string of Quill delta
  createdAt: Date;
}

interface Outline {
  id: string;
  title: string;
  content: string; // JSON string of Quill delta
  createdAt: Date;
}

interface Part {
  id: string;
  title: string;
  chapterIds: string[]; // Array of chapter IDs
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
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [isEditingOutline, setIsEditingOutline] = useState(false);
  const [currentOutline, setCurrentOutline] = useState<Outline | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [createIdeaModalOpen, setCreateIdeaModalOpen] = useState(false);
  const [createCharacterModalOpen, setCreateCharacterModalOpen] =
    useState(false);
  const [createPartModalOpen, setCreatePartModalOpen] = useState(false);
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
  const [partTitle, setPartTitle] = useState("");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);

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

            // Add auto-save on text change
            quill.on("text-change", () => {
              if (
                (isEditingChapter && currentChapter) ||
                (isEditingOutline && currentOutline)
              ) {
                const item = currentChapter || currentOutline;
                if (item) {
                  const delta = quill.getContents();
                  const updatedItem = {
                    ...item,
                    content: JSON.stringify(delta),
                  };
                  if (currentChapter) {
                    const updatedChapters = chapters.map((ch) =>
                      ch.id === currentChapter.id ? updatedItem : ch
                    );
                    setChapters(updatedChapters);
                    localStorage.setItem(
                      `twain-chapters-${book.id}`,
                      JSON.stringify(updatedChapters)
                    );
                  } else if (currentOutline) {
                    const updatedOutlines = outlines.map((ol) =>
                      ol.id === currentOutline.id ? updatedItem : ol
                    );
                    setOutlines(updatedOutlines);
                    localStorage.setItem(
                      `twain-outlines-${book.id}`,
                      JSON.stringify(updatedOutlines)
                    );
                  }
                }
              }
            });

            setQuillInstance(quill);
          }
        })
        .catch((error) => {
          console.error("Failed to load Quill:", error);
        });
    }
  }, []);

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

  // Load chapters from localStorage on component mount
  useEffect(() => {
    const storedChapters = localStorage.getItem(`twain-chapters-${book.id}`);
    if (storedChapters) {
      try {
        const parsedChapters = JSON.parse(storedChapters).map(
          (chapter: Omit<Chapter, "createdAt"> & { createdAt: string }) => ({
            ...chapter,
            createdAt: new Date(chapter.createdAt),
          })
        );
        setChapters(parsedChapters);
      } catch (error) {
        console.error("Failed to parse stored chapters:", error);
      }
    }
  }, [book.id]);

  // Load outlines from localStorage on component mount
  useEffect(() => {
    const storedOutlines = localStorage.getItem(`twain-outlines-${book.id}`);
    if (storedOutlines) {
      try {
        const parsedOutlines = JSON.parse(storedOutlines).map(
          (outline: Omit<Outline, "createdAt"> & { createdAt: string }) => ({
            ...outline,
            createdAt: new Date(outline.createdAt),
          })
        );
        setOutlines(parsedOutlines);
      } catch (error) {
        console.error("Failed to parse stored outlines:", error);
      }
    }
  }, [book.id]);

  // Load parts from localStorage on component mount
  useEffect(() => {
    const storedParts = localStorage.getItem(`twain-parts-${book.id}`);
    if (storedParts) {
      try {
        const parsedParts = JSON.parse(storedParts).map(
          (part: Omit<Part, "createdAt"> & { createdAt: string }) => ({
            ...part,
            createdAt: new Date(part.createdAt),
          })
        );
        setParts(parsedParts);
      } catch (error) {
        console.error("Failed to parse stored parts:", error);
      }
    }
  }, [book.id]);

  // Calculate total word count when chapters or outlines change
  useEffect(() => {
    const calculateWordCount = () => {
      let total = 0;
      [...chapters, ...outlines].forEach((item) => {
        try {
          const delta = JSON.parse(item.content);
          const words = delta.ops.reduce(
            (acc: number, op: { insert?: unknown }) => {
              if (op.insert && typeof op.insert === "string") {
                return (
                  acc +
                  op.insert.split(/\s+/).filter((w: string) => w.length > 0)
                    .length
                );
              }
              return acc;
            },
            0
          );
          total += words;
        } catch {
          // ignore parsing errors
        }
      });
      setTotalWordCount(total);
    };
    calculateWordCount();
  }, [chapters, outlines]);

  // Set Quill content when currentChapter or currentOutline changes
  useEffect(() => {
    if (quillInstance && (currentChapter || currentOutline)) {
      const item = currentChapter || currentOutline;
      if (item) {
        const delta = JSON.parse(item.content);
        quillInstance.setContents(delta);
        quillInstance.focus();
      }
    }
  }, [quillInstance, currentChapter, currentOutline]);

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

  const handleCreateChapterClick = () => {
    const chapterNumber = chapters.length + 1;
    const defaultDelta = { ops: [{ insert: `Chapter ${chapterNumber}\n` }] };
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: `Chapter ${chapterNumber}`,
      content: JSON.stringify(defaultDelta),
      createdAt: new Date(),
    };

    const updatedChapters = [...chapters, newChapter];
    setChapters(updatedChapters);

    // Store in localStorage
    localStorage.setItem(
      `twain-chapters-${book.id}`,
      JSON.stringify(updatedChapters)
    );

    // Set editing mode
    setCurrentChapter(newChapter);
    setIsEditingChapter(true);
  };

  const handleCreateOutlineClick = () => {
    const outlineNumber = outlines.length + 1;
    const defaultDelta = { ops: [{ insert: `Outline ${outlineNumber}\n` }] };
    const newOutline: Outline = {
      id: Date.now().toString(),
      title: `Outline ${outlineNumber}`,
      content: JSON.stringify(defaultDelta),
      createdAt: new Date(),
    };

    const updatedOutlines = [...outlines, newOutline];
    setOutlines(updatedOutlines);

    // Store in localStorage
    localStorage.setItem(
      `twain-outlines-${book.id}`,
      JSON.stringify(updatedOutlines)
    );

    // Set editing mode
    setCurrentOutline(newOutline);
    setIsEditingOutline(true);
  };

  const handleCreatePartClick = () => {
    setCreatePartModalOpen(true);
  };

  const handleCreatePartModalClose = () => {
    setCreatePartModalOpen(false);
    setPartTitle("");
    setSelectedChapterIds([]);
  };

  const handleCreatePart = () => {
    if (partTitle.trim() && selectedChapterIds.length > 0) {
      const newPart: Part = {
        id: Date.now().toString(),
        title: partTitle.trim(),
        chapterIds: selectedChapterIds,
        createdAt: new Date(),
      };

      const updatedParts = [...parts, newPart];
      setParts(updatedParts);

      // Store in localStorage
      localStorage.setItem(
        `twain-parts-${book.id}`,
        JSON.stringify(updatedParts)
      );

      handleCreatePartModalClose();
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    setIsEditingChapter(true);
  };

  const handleEditOutline = (outline: Outline) => {
    setCurrentOutline(outline);
    setIsEditingOutline(true);
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
                      } else if (section.title === "CHAPTERS") {
                        handleCreateChapterClick();
                      } else if (section.title === "OUTLINE") {
                        handleCreateOutlineClick();
                      } else if (section.title === "PARTS") {
                        handleCreatePartClick();
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
                      fontSize: "18px",
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
                ) : section.title === "OUTLINE" && outlines.length > 0 ? (
                  <div className="space-y-3">
                    {outlines.map((outline) => (
                      <div
                        key={outline.id}
                        className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleEditOutline(outline)}
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
                            {outline.title}
                          </Typography>
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
                            Created:{" "}
                            {new Date(outline.createdAt).toLocaleDateString()}
                          </Typography>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : section.title === "CHAPTERS" && chapters.length > 0 ? (
                  <div className="space-y-3">
                    {chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleEditChapter(chapter)}
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
                            {chapter.title}
                          </Typography>
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
                            Created:{" "}
                            {new Date(chapter.createdAt).toLocaleDateString()}
                          </Typography>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : section.title === "PARTS" && parts.length > 0 ? (
                  <div className="space-y-3">
                    {parts.map((part) => (
                      <div
                        key={part.id}
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
                            {part.title}
                          </Typography>
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
                            Chapters: {part.chapterIds.length} | Created:{" "}
                            {new Date(part.createdAt).toLocaleDateString()}
                          </Typography>
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
          className="p-4 border-b min-h-[67px] border-gray-200 bg-white flex items-center justify-between"
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
            }}
          >
            {book?.title || "Untitled Book"}
            {isEditingChapter && currentChapter
              ? ` : ${currentChapter.title}`
              : ""}
            {isEditingOutline && currentOutline
              ? ` : ${currentOutline.title}`
              : ""}
          </Typography>
          {isEditingChapter || isEditingOutline ? (
            <IconButton
              onClick={() => {
                if (quillInstance && (currentChapter || currentOutline)) {
                  const item = currentChapter || currentOutline;
                  if (item) {
                    const delta = quillInstance.getContents();
                    const updatedItem = {
                      ...item,
                      content: JSON.stringify(delta),
                    };
                    if (currentChapter) {
                      const updatedChapters = chapters.map((ch) =>
                        ch.id === currentChapter.id ? updatedItem : ch
                      );
                      setChapters(updatedChapters);
                      localStorage.setItem(
                        `twain-chapters-${book.id}`,
                        JSON.stringify(updatedChapters)
                      );
                    } else if (currentOutline) {
                      const updatedOutlines = outlines.map((ol) =>
                        ol.id === currentOutline.id ? updatedItem : ol
                      );
                      setOutlines(updatedOutlines);
                      localStorage.setItem(
                        `twain-outlines-${book.id}`,
                        JSON.stringify(updatedOutlines)
                      );
                    }
                  }
                }
                setIsEditingChapter(false);
                setCurrentChapter(null);
                setIsEditingOutline(false);
                setCurrentOutline(null);
              }}
              sx={{
                color: "rgb(19, 135, 194)",
                "&:hover": {
                  backgroundColor: "rgba(19, 135, 194, 0.1)",
                },
              }}
            >
              <CancelIcon />
            </IconButton>
          ) : null}
        </div>

        {/* Dashboard Container */}
        <div className="flex-1 relative p-4">
          <div
            ref={quillRef}
            className={`h-full ${
              isEditingChapter || isEditingOutline ? "" : "hidden"
            }`}
          ></div>
          <div
            className={`h-full bg-white rounded-lg p-6 ${
              isEditingChapter || isEditingOutline ? "hidden" : ""
            }`}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 600,
                fontSize: "24px",
                color: "#1f2937",
                marginBottom: "24px",
              }}
            >
              Story Dashboard
            </Typography>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col items-center text-center">
                  <DescriptionOutlinedIcon
                    sx={{
                      fontSize: 32,
                      color: "rgb(19, 135, 194)",
                      marginBottom: "8px",
                    }}
                  />
                  <div>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 600,
                        fontSize: "18px",
                        color: "#1f2937",
                      }}
                    >
                      {ideas.length}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 400,
                        fontSize: "14px",
                        color: "rgb(107, 114, 128)",
                      }}
                    >
                      Ideas
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col items-center text-center">
                  <FaceOutlinedIcon
                    sx={{
                      fontSize: 32,
                      color: "rgb(19, 135, 194)",
                      marginBottom: "8px",
                    }}
                  />
                  <div>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 600,
                        fontSize: "18px",
                        color: "#1f2937",
                      }}
                    >
                      {characters.length}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 400,
                        fontSize: "14px",
                        color: "rgb(107, 114, 128)",
                      }}
                    >
                      Characters
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col items-center text-center">
                  <DescriptionOutlinedIcon
                    sx={{
                      fontSize: 32,
                      color: "rgb(19, 135, 194)",
                      marginBottom: "8px",
                    }}
                  />
                  <div>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 600,
                        fontSize: "18px",
                        color: "#1f2937",
                      }}
                    >
                      {chapters.length}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 400,
                        fontSize: "14px",
                        color: "rgb(107, 114, 128)",
                      }}
                    >
                      Chapters
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col items-center text-center">
                  <DescriptionOutlinedIcon
                    sx={{
                      fontSize: 32,
                      color: "rgb(19, 135, 194)",
                      marginBottom: "8px",
                    }}
                  />
                  <div>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 600,
                        fontSize: "18px",
                        color: "#1f2937",
                      }}
                    >
                      {outlines.length}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 400,
                        fontSize: "14px",
                        color: "rgb(107, 114, 128)",
                      }}
                    >
                      Outlines
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col items-center text-center">
                  <DescriptionOutlinedIcon
                    sx={{
                      fontSize: 32,
                      color: "rgb(19, 135, 194)",
                      marginBottom: "8px",
                    }}
                  />
                  <div>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 600,
                        fontSize: "18px",
                        color: "#1f2937",
                      }}
                    >
                      {parts.length}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 400,
                        fontSize: "14px",
                        color: "rgb(107, 114, 128)",
                      }}
                    >
                      Parts
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col items-center text-center">
                  <DescriptionOutlinedIcon
                    sx={{
                      fontSize: 32,
                      color: "rgb(19, 135, 194)",
                      marginBottom: "8px",
                    }}
                  />
                  <div>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 600,
                        fontSize: "18px",
                        color: "#1f2937",
                      }}
                    >
                      {totalWordCount}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 400,
                        fontSize: "14px",
                        color: "rgb(107, 114, 128)",
                      }}
                    >
                      Words
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  fontSize: "18px",
                  color: "#1f2937",
                  marginBottom: "16px",
                }}
              >
                Quick Actions
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Button
                  variant="outlined"
                  onClick={handleCreateIdeaClick}
                  startIcon={<AddCircleOutlinedIcon />}
                  sx={{
                    justifyContent: "flex-start",
                    padding: "12px 16px",
                    borderColor: "rgb(19, 135, 194)",
                    color: "rgb(19, 135, 194)",
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    "&:hover": {
                      borderColor: "rgb(15, 108, 155)",
                      backgroundColor: "rgba(19, 135, 194, 0.04)",
                    },
                  }}
                >
                  Add New Idea
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCreateCharacterClick}
                  startIcon={<FaceOutlinedIcon />}
                  sx={{
                    justifyContent: "flex-start",
                    padding: "12px 16px",
                    borderColor: "rgb(19, 135, 194)",
                    color: "rgb(19, 135, 194)",
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    "&:hover": {
                      borderColor: "rgb(15, 108, 155)",
                      backgroundColor: "rgba(19, 135, 194, 0.04)",
                    },
                  }}
                >
                  Add Character
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCreateOutlineClick}
                  startIcon={<DescriptionOutlinedIcon />}
                  sx={{
                    justifyContent: "flex-start",
                    padding: "12px 16px",
                    borderColor: "rgb(19, 135, 194)",
                    color: "rgb(19, 135, 194)",
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    "&:hover": {
                      borderColor: "rgb(15, 108, 155)",
                      backgroundColor: "rgba(19, 135, 194, 0.04)",
                    },
                  }}
                >
                  Create Outline
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCreatePartClick}
                  startIcon={<DescriptionOutlinedIcon />}
                  sx={{
                    justifyContent: "flex-start",
                    padding: "12px 16px",
                    borderColor: "rgb(19, 135, 194)",
                    color: "rgb(19, 135, 194)",
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    "&:hover": {
                      borderColor: "rgb(15, 108, 155)",
                      backgroundColor: "rgba(19, 135, 194, 0.04)",
                    },
                  }}
                >
                  Create Part
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCreateChapterClick}
                  startIcon={<DescriptionOutlinedIcon />}
                  sx={{
                    justifyContent: "flex-start",
                    padding: "12px 16px",
                    borderColor: "rgb(19, 135, 194)",
                    color: "rgb(19, 135, 194)",
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    "&:hover": {
                      borderColor: "rgb(15, 108, 155)",
                      backgroundColor: "rgba(19, 135, 194, 0.04)",
                    },
                  }}
                >
                  Write Chapter
                </Button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-8 mt-8">
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  fontSize: "18px",
                  color: "#1f2937",
                  marginBottom: "16px",
                }}
              >
                Recent Activity
              </Typography>
              <div className="space-y-3">
                {[...ideas, ...characters, ...chapters, ...outlines, ...parts]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .slice(0, 5)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      {"notes" in item ? (
                        <DescriptionOutlinedIcon
                          sx={{
                            fontSize: 20,
                            color: "rgb(107, 114, 128)",
                          }}
                        />
                      ) : "gender" in item ? (
                        <FaceOutlinedIcon
                          sx={{
                            fontSize: 20,
                            color: "rgb(107, 114, 128)",
                          }}
                        />
                      ) : "content" in item && "title" in item ? (
                        <DescriptionOutlinedIcon
                          sx={{
                            fontSize: 20,
                            color: "rgb(107, 114, 128)",
                          }}
                        />
                      ) : (
                        <DescriptionOutlinedIcon
                          sx={{
                            fontSize: 20,
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
                          }}
                        >
                          {"notes" in item
                            ? `New idea: ${item.title}`
                            : "gender" in item
                            ? `New character: ${item.name}`
                            : "content" in item && "title" in item
                            ? `New ${
                                chapters.some((c) => c.id === item.id)
                                  ? "chapter"
                                  : outlines.some((o) => o.id === item.id)
                                  ? "outline"
                                  : "part"
                              }: ${item.title}`
                            : `New item`}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "'Rubik', sans-serif",
                            fontWeight: 400,
                            fontSize: "12px",
                            color: "rgb(107, 114, 128)",
                          }}
                        >
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Typography>
                      </div>
                    </div>
                  ))}
                {ideas.length === 0 &&
                  characters.length === 0 &&
                  chapters.length === 0 &&
                  outlines.length === 0 &&
                  parts.length === 0 && (
                    <div className="text-center py-8">
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          fontWeight: 400,
                          fontSize: "14px",
                          color: "rgb(107, 114, 128)",
                        }}
                      >
                        No recent activity. Start by creating your first idea or
                        character!
                      </Typography>
                    </div>
                  )}
              </div>
            </div>

            {/* Demo Notice */}
            <div className="w-full bg-red-400 text-center py-4 text-white font-medium">
              DEMO ONLY - NO FUNCTIONALITY AT THIS TIME
            </div>
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
            <Box
              sx={{ p: 4, overflowY: "auto", maxHeight: "calc(80vh - 80px)" }}
            >
              {/* Avatar Upload */}
              <Box
                sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}
              >
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

        {/* Create Part Modal */}
        <Modal
          open={createPartModalOpen}
          onClose={handleCreatePartModalClose}
          aria-labelledby="create-part-modal-title"
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
                id="create-part-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Create New Part
              </Typography>
              <IconButton
                onClick={handleCreatePartModalClose}
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
                label="Part Title"
                value={partTitle}
                onChange={(e) => setPartTitle(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
                autoFocus
              />
              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Select Chapters</InputLabel>
                <Select
                  multiple
                  value={selectedChapterIds}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedChapterIds(
                      typeof value === "string" ? value.split(",") : value
                    );
                  }}
                  renderValue={(selected) =>
                    chapters
                      .filter((chapter) => selected.includes(chapter.id))
                      .map((chapter) => chapter.title)
                      .join(", ")
                  }
                  label="Select Chapters"
                >
                  {chapters
                    .filter(
                      (chapter) =>
                        !parts.some((part) =>
                          part.chapterIds.includes(chapter.id)
                        )
                    )
                    .map((chapter) => (
                      <MenuItem key={chapter.id} value={chapter.id}>
                        <Checkbox
                          checked={selectedChapterIds.includes(chapter.id)}
                        />
                        <ListItemText primary={chapter.title} />
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                }}
              >
                <Button
                  onClick={handleCreatePartModalClose}
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
                  onClick={handleCreatePart}
                  variant="contained"
                  disabled={
                    !partTitle.trim() || selectedChapterIds.length === 0
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
                  Create Part
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>
      </div>
    </div>
  );
};

export default TwainStoryWriter;
