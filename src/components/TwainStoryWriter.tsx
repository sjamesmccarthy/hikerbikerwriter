"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { updateBookWordCount } from "./TwainStoryBuilder";
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
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import PetsIcon from "@mui/icons-material/Pets";
import TransgenderIcon from "@mui/icons-material/Transgender";
import BatchPredictionIcon from "@mui/icons-material/BatchPrediction";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import AddIcon from "@mui/icons-material/Add";

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

interface Story {
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
  storyIds: string[]; // Array of story IDs
  createdAt: Date;
}

interface RecentActivity {
  id: string;
  type: "idea" | "character" | "story" | "chapter" | "outline" | "part";
  title: string;
  createdAt: Date;
}

type StoryItem = Idea | Character | Story | Chapter | Outline | Part;

// Type definitions - should match the ones in TwainStoryBuilder
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

interface TwainStoryWriterProps {
  book: Book;
  onBackToBookshelf: () => void;
}

// Storage key helpers
const getStorageKey = (
  type: string,
  bookId: number,
  userEmail?: string
): string => {
  if (!userEmail) return `twain-${type}-${bookId}`;
  return `twain-${type}-${bookId}-${userEmail}`;
};

// Storage utilities
const saveToStorage = (
  type: string,
  data: unknown[],
  bookId: number,
  userEmail?: string
): void => {
  if (!userEmail) return;
  try {
    const storageKey = getStorageKey(type, bookId, userEmail);
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${type} to localStorage:`, error);
  }
};

const TwainStoryWriter: React.FC<TwainStoryWriterProps> = ({
  book,
  onBackToBookshelf,
}) => {
  const { data: session } = useSession();
  const quillRef = useRef<HTMLDivElement | null>(null);
  const [quillInstance, setQuillInstance] = useState<QuillInstance | null>(
    null
  );
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [isEditingOutline, setIsEditingOutline] = useState(false);
  const [currentOutline, setCurrentOutline] = useState<Outline | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [currentEditorWordCount, setCurrentEditorWordCount] = useState(0);
  const [createIdeaModalOpen, setCreateIdeaModalOpen] = useState(false);
  const [createCharacterModalOpen, setCreateCharacterModalOpen] =
    useState(false);
  const [createChapterModalOpen, setCreateChapterModalOpen] = useState(false);
  const [createStoryModalOpen, setCreateStoryModalOpen] = useState(false);
  const [createPartModalOpen, setCreatePartModalOpen] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaNotes, setIdeaNotes] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
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
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(
    null
  );
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [allAccordionsExpanded, setAllAccordionsExpanded] = useState(false);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(
    new Set()
  ); // Start with all collapsed
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const quillInitializedRef = useRef(false);

  // Initialize Quill editor
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      quillRef.current &&
      !quillInitializedRef.current
    ) {
      quillInitializedRef.current = true;

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
                  [
                    {
                      align: [],
                    },
                  ],
                  [{ indent: "-1" }, { indent: "+1" }],
                  ["blockquote"],
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
          quillInitializedRef.current = false; // Reset on error
        });
    }
  }, []);

  // Load ideas from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey("ideas", book.id, session.user.email);
      const storedIdeas = localStorage.getItem(storageKey);
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
    }
  }, [book.id, session?.user?.email]);

  // Load characters from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "characters",
        book.id,
        session.user.email
      );
      const storedCharacters = localStorage.getItem(storageKey);
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
    }
  }, [book.id, session?.user?.email]);

  // Load chapters from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey("chapters", book.id, session.user.email);
      const storedChapters = localStorage.getItem(storageKey);
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
    }
  }, [book.id, session?.user?.email]);

  // Load stories from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey("stories", book.id, session.user.email);
      const storedStories = localStorage.getItem(storageKey);
      if (storedStories) {
        try {
          const parsedStories = JSON.parse(storedStories).map(
            (story: Omit<Story, "createdAt"> & { createdAt: string }) => ({
              ...story,
              createdAt: new Date(story.createdAt),
            })
          );
          setStories(parsedStories);
        } catch (error) {
          console.error("Failed to parse stored stories:", error);
        }
      }
    }
  }, [book.id, session?.user?.email]);

  // Load outlines from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey("outlines", book.id, session.user.email);
      const storedOutlines = localStorage.getItem(storageKey);
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
    }
  }, [book.id, session?.user?.email]);

  // Load parts from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey("parts", book.id, session.user.email);
      const storedParts = localStorage.getItem(storageKey);
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
    }
  }, [book.id, session?.user?.email]);

  // Calculate total word count when chapters, stories, or outlines change
  useEffect(() => {
    const calculateWordCount = () => {
      let total = 0;
      [...chapters, ...stories, ...outlines].forEach((item) => {
        try {
          const delta = JSON.parse(item.content);
          const words = delta.ops.reduce(
            (acc: number, op: { insert?: unknown }) => {
              if (op.insert && typeof op.insert === "string") {
                // Clean the text by trimming and removing extra whitespace
                const cleanText = op.insert.trim();
                if (cleanText.length === 0) {
                  return acc;
                }
                const wordsInOp = cleanText
                  .split(/\s+/)
                  .filter((w: string) => w.length > 0);
                return acc + wordsInOp.length;
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

      // Update the book's word count in localStorage
      if (session?.user?.email) {
        updateBookWordCount(book.id, total, session.user.email);
      }
    };
    calculateWordCount();
  }, [chapters, stories, outlines, book.id, session?.user?.email]);

  // Set Quill content when currentChapter, currentStory, or currentOutline changes
  useEffect(() => {
    if (quillInstance && (currentChapter || currentStory || currentOutline)) {
      const item = currentChapter || currentStory || currentOutline;
      if (item) {
        const delta = JSON.parse(item.content);
        quillInstance.setContents(delta);
        quillInstance.focus();
      }
    }
  }, [quillInstance, currentChapter, currentStory, currentOutline]);

  // Auto-save function
  const handleAutoSave = useCallback(() => {
    if (
      (isEditingChapter && currentChapter) ||
      (isEditingStory && currentStory) ||
      (isEditingOutline && currentOutline)
    ) {
      const item = currentChapter || currentStory || currentOutline;
      if (item && quillInstance) {
        const delta = quillInstance.getContents();
        const updatedItem = {
          ...item,
          content: JSON.stringify(delta),
        };
        if (currentChapter && session?.user?.email) {
          const updatedChapters = chapters.map((ch) =>
            ch.id === currentChapter.id ? updatedItem : ch
          );
          setChapters(updatedChapters);
          const storageKey = getStorageKey(
            "chapters",
            book.id,
            session.user.email
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedChapters));
        } else if (currentStory && session?.user?.email) {
          const updatedStories = stories.map((st) =>
            st.id === currentStory.id ? updatedItem : st
          );
          setStories(updatedStories);
          const storageKey = getStorageKey(
            "stories",
            book.id,
            session.user.email
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedStories));
        } else if (currentOutline && session?.user?.email) {
          const updatedOutlines = outlines.map((ol) =>
            ol.id === currentOutline.id ? updatedItem : ol
          );
          setOutlines(updatedOutlines);
          const storageKey = getStorageKey(
            "outlines",
            book.id,
            session.user.email
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedOutlines));
        }
        // Update last save time
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const ampm = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12; // Convert to 12-hour format, 0 becomes 12

        setLastSaveTime(
          `${displayHours}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")} ${ampm}`
        );
      }
    }
  }, [
    isEditingChapter,
    currentChapter,
    isEditingStory,
    currentStory,
    isEditingOutline,
    currentOutline,
    quillInstance,
    chapters,
    stories,
    outlines,
    book.id,
    session?.user?.email,
  ]);

  // Set up auto-save event listener when editing state changes
  useEffect(() => {
    if (
      quillInstance &&
      (isEditingChapter || isEditingStory || isEditingOutline)
    ) {
      const handleTextChange = () => {
        handleAutoSave();
      };

      quillInstance.on("text-change", handleTextChange);

      return () => {
        quillInstance.off("text-change", handleTextChange);
      };
    }
  }, [
    quillInstance,
    isEditingChapter,
    isEditingStory,
    isEditingOutline,
    handleAutoSave,
  ]);

  // Update current editor word count when content changes or when switching items
  useEffect(() => {
    const updateWordCount = () => {
      if (quillInstance && (currentChapter || currentStory || currentOutline)) {
        try {
          const delta = quillInstance.getContents() as {
            ops: { insert?: unknown }[];
          };
          const allText = delta.ops
            .map((op: { insert?: unknown }) =>
              typeof op.insert === "string" ? op.insert : ""
            )
            .join("")
            .trim();

          const wordCount =
            allText.length === 0
              ? 0
              : allText.split(/\s+/).filter((w: string) => w.length > 0).length;
          setCurrentEditorWordCount(wordCount);
        } catch {
          setCurrentEditorWordCount(0);
        }
      } else {
        setCurrentEditorWordCount(0);
      }
    };

    // Update word count immediately when switching items
    updateWordCount();

    // Set up text-change listener for real-time updates
    if (
      quillInstance &&
      (isEditingChapter || isEditingStory || isEditingOutline)
    ) {
      const handleTextChange = () => {
        updateWordCount();
      };

      quillInstance.on("text-change", handleTextChange);

      return () => {
        quillInstance.off("text-change", handleTextChange);
      };
    }
  }, [
    quillInstance,
    currentChapter,
    currentStory,
    currentOutline,
    isEditingChapter,
    isEditingStory,
    isEditingOutline,
  ]);

  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea);
    setIdeaTitle(idea.title);
    setIdeaNotes(idea.notes);
    setCreateIdeaModalOpen(true);
  };

  const handleCreateIdeaClick = () => {
    setEditingIdea(null);
    setCreateIdeaModalOpen(true);
  };

  const handleCreateIdeaModalClose = () => {
    setCreateIdeaModalOpen(false);
    setIdeaTitle("");
    setIdeaNotes("");
    setEditingIdea(null);
  };

  const handleCreateIdea = () => {
    if (ideaTitle.trim()) {
      if (editingIdea) {
        // Update existing idea
        const updatedIdea: Idea = {
          ...editingIdea,
          title: ideaTitle.trim(),
          notes: ideaNotes.trim(),
        };

        const updatedIdeas = ideas.map((idea) =>
          idea.id === editingIdea.id ? updatedIdea : idea
        );
        setIdeas(updatedIdeas);

        // Store in localStorage
        if (session?.user?.email) {
          const storageKey = getStorageKey(
            "ideas",
            book.id,
            session.user.email
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedIdeas));
        }
      } else {
        // Create new idea
        const newIdea: Idea = {
          id: Date.now().toString(),
          title: ideaTitle.trim(),
          notes: ideaNotes.trim(),
          createdAt: new Date(),
        };

        const updatedIdeas = [...ideas, newIdea];
        setIdeas(updatedIdeas);

        // Store in localStorage
        if (session?.user?.email) {
          const storageKey = getStorageKey(
            "ideas",
            book.id,
            session.user.email
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedIdeas));
        }

        // Add to recent activity
        addToRecentActivity("idea", newIdea);
      }

      handleCreateIdeaModalClose();
    }
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setCharacterName(character.name);
    setCharacterGender(character.gender);
    setCharacterBackstory(character.backstory);
    setCharacterCharacterization(character.characterization);
    setCharacterVoice(character.voice);
    setCharacterAppearance(character.appearance);
    setCharacterFriendsFamily(character.friendsFamily);
    setCharacterFavorites(character.favorites);
    setCharacterMisc(character.misc);
    setCharacterAvatar(character.avatar || null);
    setCreateCharacterModalOpen(true);
  };

  const handleCreateCharacterClick = () => {
    setEditingCharacter(null);
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
    setEditingCharacter(null);
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
      if (editingCharacter) {
        // Update existing character
        const updatedCharacter: Character = {
          ...editingCharacter,
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
        };

        const updatedCharacters = characters.map((character) =>
          character.id === editingCharacter.id ? updatedCharacter : character
        );
        setCharacters(updatedCharacters);

        // Store in localStorage
        if (session?.user?.email) {
          saveToStorage(
            "characters",
            updatedCharacters,
            book.id,
            session.user.email
          );
        }
      } else {
        // Create new character
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

        // Add to recent activity
        addToRecentActivity("character", newCharacter);
      }

      handleCreateCharacterModalClose();
    }
  };

  const handleDeleteIdea = (ideaId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // Remove idea from state
    const updatedIdeas = ideas.filter((idea) => idea.id !== ideaId);
    setIdeas(updatedIdeas);

    // Update localStorage
    localStorage.setItem(
      `twain-ideas-${book.id}`,
      JSON.stringify(updatedIdeas)
    );
  };

  const handleDeleteCharacter = (
    characterId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // Remove character from state
    const updatedCharacters = characters.filter(
      (character) => character.id !== characterId
    );
    setCharacters(updatedCharacters);

    // Update localStorage
    localStorage.setItem(
      `twain-characters-${book.id}`,
      JSON.stringify(updatedCharacters)
    );
  };

  const handleCreateChapterModalClose = () => {
    setCreateChapterModalOpen(false);
    setChapterTitle("");
  };

  const handleCreateChapter = () => {
    const chapterNumber = chapters.length + 1;
    const title = chapterTitle.trim() || `Chapter ${chapterNumber}`;
    const defaultDelta = {};

    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: title,
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

    // Add to recent activity
    addToRecentActivity("chapter", newChapter);

    // Set editing mode
    setCurrentChapter(newChapter);
    setIsEditingChapter(true);

    // Update Quill placeholder after a short delay to ensure Quill is ready
    setTimeout(() => {
      if (quillInstance && quillInstance.root) {
        const placeholderText = "Start writing ...";
        quillInstance.root.setAttribute("data-placeholder", placeholderText);
      }
    }, 100);

    handleCreateChapterModalClose();
  };

  const handleCreateChapterClick = () => {
    setCreateChapterModalOpen(true);
  };

  const handleCreateStoryClick = () => {
    setCreateStoryModalOpen(true);
  };

  const handleCreateStoryModalClose = () => {
    setCreateStoryModalOpen(false);
    setStoryTitle("");
  };

  const handleCreateStory = () => {
    const storyNumber = stories.length + 1;
    const title = storyTitle.trim() || `Story ${storyNumber}`;
    const defaultDelta = {};

    const newStory: Story = {
      id: Date.now().toString(),
      title: title,
      content: JSON.stringify(defaultDelta),
      createdAt: new Date(),
    };

    const updatedStories = [...stories, newStory];
    setStories(updatedStories);

    // Store in localStorage
    localStorage.setItem(
      `twain-stories-${book.id}`,
      JSON.stringify(updatedStories)
    );

    // Add to recent activity
    addToRecentActivity("story", newStory);

    // Set editing mode
    setCurrentStory(newStory);
    setIsEditingStory(true);

    // Update Quill placeholder after a short delay to ensure Quill is ready
    setTimeout(() => {
      if (quillInstance && quillInstance.root) {
        const placeholderText = "Start writing ...";
        quillInstance.root.setAttribute("data-placeholder", placeholderText);
      }
    }, 100);

    handleCreateStoryModalClose();
  };

  const handleCreateOutlineClick = () => {
    const outlineNumber = outlines.length + 1;
    const defaultDelta = {};
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

    // Add to recent activity
    addToRecentActivity("outline", newOutline);

    // Set editing mode
    setCurrentOutline(newOutline);
    setIsEditingOutline(true);
  };

  const handleEditPart = (part: Part) => {
    setEditingPart(part);
    setPartTitle(part.title);
    setSelectedChapterIds(part.chapterIds || []);
    setSelectedStoryIds(part.storyIds || []);
    setCreatePartModalOpen(true);
  };

  const handleCreatePartClick = () => {
    setEditingPart(null);
    setCreatePartModalOpen(true);
  };

  const handleCreatePartModalClose = () => {
    setCreatePartModalOpen(false);
    setPartTitle("");
    setSelectedChapterIds([]);
    setSelectedStoryIds([]);
    setEditingPart(null);
  };

  const handleCreatePart = () => {
    if (partTitle.trim() && selectedChapterIds.length > 0) {
      if (editingPart) {
        // Update existing part
        const updatedPart: Part = {
          ...editingPart,
          title: partTitle.trim(),
          chapterIds: selectedChapterIds,
          storyIds: selectedStoryIds,
        };

        const updatedParts = parts.map((part) =>
          part.id === editingPart.id ? updatedPart : part
        );
        setParts(updatedParts);

        // Store in localStorage
        localStorage.setItem(
          `twain-parts-${book.id}`,
          JSON.stringify(updatedParts)
        );
      } else {
        // Create new part
        const newPart: Part = {
          id: Date.now().toString(),
          title: partTitle.trim(),
          chapterIds: selectedChapterIds,
          storyIds: selectedStoryIds,
          createdAt: new Date(),
        };

        const updatedParts = [...parts, newPart];
        setParts(updatedParts);

        // Store in localStorage
        localStorage.setItem(
          `twain-parts-${book.id}`,
          JSON.stringify(updatedParts)
        );

        // Add to recent activity
        addToRecentActivity("part", newPart);
      }

      handleCreatePartModalClose();
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    setIsEditingChapter(true);
    // Clear story and outline editing state
    setIsEditingStory(false);
    setCurrentStory(null);
    setIsEditingOutline(false);
    setCurrentOutline(null);
    setLastSaveTime(null);

    // Update Quill placeholder for existing chapter
    setTimeout(() => {
      if (quillInstance && quillInstance.root) {
        const placeholderText = `Continue writing ${chapter.title}...`;
        quillInstance.root.setAttribute("data-placeholder", placeholderText);
      }
    }, 100);
  };

  const handleDeleteChapter = (chapterId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // If currently editing this chapter, exit editing mode
    if (currentChapter && currentChapter.id === chapterId) {
      setIsEditingChapter(false);
      setCurrentChapter(null);
      setLastSaveTime(null);
    }

    // Remove chapter from state
    const updatedChapters = chapters.filter(
      (chapter) => chapter.id !== chapterId
    );
    setChapters(updatedChapters);

    // Update localStorage
    localStorage.setItem(
      `twain-chapters-${book.id}`,
      JSON.stringify(updatedChapters)
    );

    // Remove chapter from any parts that contain it
    const updatedParts = parts
      .map((part) => ({
        ...part,
        chapterIds: (part.chapterIds || []).filter((id) => id !== chapterId),
      }))
      .filter(
        (part) =>
          (part.chapterIds || []).length > 0 || (part.storyIds || []).length > 0
      ); // Remove parts with no chapters or stories

    setParts(updatedParts);
    localStorage.setItem(
      `twain-parts-${book.id}`,
      JSON.stringify(updatedParts)
    );
  };

  const handleEditStory = (story: Story) => {
    setCurrentStory(story);
    setIsEditingStory(true);
    // Clear chapter and outline editing state
    setIsEditingChapter(false);
    setCurrentChapter(null);
    setIsEditingOutline(false);
    setCurrentOutline(null);
    setLastSaveTime(null);

    // Update Quill placeholder for existing story
    setTimeout(() => {
      if (quillInstance && quillInstance.root) {
        const placeholderText = `Continue writing ${story.title}...`;
        quillInstance.root.setAttribute("data-placeholder", placeholderText);
      }
    }, 100);
  };

  const handleDeleteStory = (storyId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // If currently editing this story, exit editing mode
    if (currentStory && currentStory.id === storyId) {
      setIsEditingStory(false);
      setCurrentStory(null);
      setLastSaveTime(null);
    }

    // Remove story from state
    const updatedStories = stories.filter((story) => story.id !== storyId);
    setStories(updatedStories);

    // Update localStorage
    localStorage.setItem(
      `twain-stories-${book.id}`,
      JSON.stringify(updatedStories)
    );

    // Remove story from any parts that contain it
    const updatedParts = parts
      .map((part) => ({
        ...part,
        storyIds: (part.storyIds || []).filter((id) => id !== storyId),
      }))
      .filter(
        (part) =>
          (part.chapterIds || []).length > 0 || (part.storyIds || []).length > 0
      ); // Remove parts with no chapters or stories

    setParts(updatedParts);
    localStorage.setItem(
      `twain-parts-${book.id}`,
      JSON.stringify(updatedParts)
    );
  };

  const handleEditOutline = (outline: Outline) => {
    setCurrentOutline(outline);
    setIsEditingOutline(true);
    // Clear chapter and story editing state
    setIsEditingChapter(false);
    setCurrentChapter(null);
    setIsEditingStory(false);
    setCurrentStory(null);
    setLastSaveTime(null);
  };

  const handleDeleteOutline = (outlineId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // If currently editing this outline, exit editing mode
    if (currentOutline && currentOutline.id === outlineId) {
      setIsEditingOutline(false);
      setCurrentOutline(null);
      setLastSaveTime(null);
    }

    // Remove outline from state
    const updatedOutlines = outlines.filter(
      (outline) => outline.id !== outlineId
    );
    setOutlines(updatedOutlines);

    // Update localStorage
    localStorage.setItem(
      `twain-outlines-${book.id}`,
      JSON.stringify(updatedOutlines)
    );
  };

  const handleDeletePart = (partId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // Remove part from state
    const updatedParts = parts.filter((part) => part.id !== partId);
    setParts(updatedParts);

    // Update localStorage
    localStorage.setItem(
      `twain-parts-${book.id}`,
      JSON.stringify(updatedParts)
    );
  };

  const addToRecentActivity = (
    type: RecentActivity["type"],
    item: StoryItem
  ) => {
    const recentActivity = getRecentActivity();
    const newActivity: RecentActivity = {
      id: item.id,
      type,
      title: "title" in item ? item.title : item.name,
      createdAt: item.createdAt,
    };

    // Remove if already exists (to move to front)
    const filteredActivity = recentActivity.filter(
      (activity) => activity.id !== item.id
    );

    // Add to front and limit to 24 items
    const updatedActivity = [newActivity, ...filteredActivity].slice(0, 24);

    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "recent-activity",
        book.id,
        session.user.email
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedActivity));
    }
  };

  const getRecentActivity = (): RecentActivity[] => {
    if (!session?.user?.email) return [];
    const storageKey = getStorageKey(
      "recent-activity",
      book.id,
      session.user.email
    );
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored) as RecentActivity[];
      } catch (error) {
        console.error("Failed to parse recent activity:", error);
      }
    }
    return [];
  };

  const handleClearRecentActivity = () => {
    // Only clear recent activity, not the actual story data
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "recent-activity",
        book.id,
        session.user.email
      );
      localStorage.removeItem(storageKey);
    }
  };

  const handleRecentActivityClick = (activity: RecentActivity) => {
    // Find the corresponding item and open it for editing
    if (activity.type === "idea") {
      const idea = ideas.find((i) => i.id === activity.id);
      if (idea) {
        handleEditIdea(idea);
      }
    } else if (activity.type === "character") {
      const character = characters.find((c) => c.id === activity.id);
      if (character) {
        handleEditCharacter(character);
      }
    } else if (activity.type === "story") {
      const story = stories.find((s) => s.id === activity.id);
      if (story) {
        handleEditStory(story);
      }
    } else if (activity.type === "chapter") {
      const chapter = chapters.find((ch) => ch.id === activity.id);
      if (chapter) {
        handleEditChapter(chapter);
      }
    } else if (activity.type === "outline") {
      const outline = outlines.find((o) => o.id === activity.id);
      if (outline) {
        handleEditOutline(outline);
      }
    } else if (activity.type === "part") {
      const part = parts.find((p) => p.id === activity.id);
      if (part) {
        handleEditPart(part);
      }
    }
  };

  const handleToggleAllAccordions = () => {
    if (allAccordionsExpanded) {
      // Collapse all
      setExpandedAccordions(new Set());
      setAllAccordionsExpanded(false);
    } else {
      // Expand all
      const allSections = new Set([
        "IDEAS",
        "CHARACTERS",
        "OUTLINE",
        "STORIES",
        "CHAPTERS",
        "PARTS",
      ]);
      setExpandedAccordions(allSections);
      setAllAccordionsExpanded(true);
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getDaysSinceBookCreation = () => {
    if (!book?.createdAt) return 0;
    const createdDate = new Date(book.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCharacterStyling = (gender: string) => {
    switch (gender.toLowerCase()) {
      case "male":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.1)", // Light blue
          icon: (
            <FaceOutlinedIcon
              sx={{ fontSize: 40, color: "rgb(59, 130, 246)" }}
            />
          ),
        };
      case "female":
        return {
          backgroundColor: "rgba(236, 72, 153, 0.1)", // Light pink
          icon: (
            <FaceOutlinedIcon
              sx={{ fontSize: 40, color: "rgb(236, 72, 153)" }}
            />
          ),
        };
      case "animal":
        return {
          backgroundColor: "rgba(133, 77, 14, 0.1)", // Light brown
          icon: <PetsIcon sx={{ fontSize: 40, color: "rgb(133, 77, 14)" }} />,
        };
      case "other":
        return {
          backgroundColor: "rgba(107, 114, 128, 0.1)", // Light gray
          icon: (
            <TransgenderIcon
              sx={{ fontSize: 40, color: "rgb(107, 114, 128)" }}
            />
          ),
        };
      default:
        return {
          backgroundColor: "rgb(249, 250, 251)", // Default background
          icon: (
            <FaceOutlinedIcon
              sx={{ fontSize: 40, color: "rgb(107, 114, 128)" }}
            />
          ),
        };
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
      title: "STORIES",
      content: "Write and develop your complete stories...",
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
      {/* Column 1: Sidebar with Accordions - collapsible */}
      <div
        className={`${
          sidebarCollapsed ? "w-[65px]" : "w-[300px]"
        } bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
      >
        {/* Header with Back Button */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
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
            )}
            <div
              className={`flex items-center gap-1 ${
                sidebarCollapsed ? "flex-col" : ""
              }`}
            >
              {!sidebarCollapsed && (
                <IconButton
                  onClick={handleToggleAllAccordions}
                  size="small"
                  sx={{
                    color: "rgb(107, 114, 128)",
                    "&:hover": {
                      backgroundColor: "rgba(107, 114, 128, 0.1)",
                    },
                    transform: allAccordionsExpanded
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease-in-out",
                  }}
                  title={
                    allAccordionsExpanded
                      ? "Collapse All Sections"
                      : "Expand All Sections"
                  }
                >
                  <KeyboardDoubleArrowDownIcon />
                </IconButton>
              )}
              <IconButton
                onClick={handleToggleSidebar}
                size="small"
                sx={{
                  color: "rgb(107, 114, 128)",
                  "&:hover": {
                    backgroundColor: "rgba(107, 114, 128, 0.1)",
                  },
                  transform: sidebarCollapsed
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s ease-in-out",
                }}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <MenuOpenIcon />
              </IconButton>
            </div>
          </div>
        </div>

        {/* Accordion Sections */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto">
            {accordionSections.map((section) => (
              <Accordion
                key={section.title}
                disableGutters
                elevation={0}
                expanded={expandedAccordions.has(section.title)}
                onChange={(_, isExpanded) => {
                  const newExpanded = new Set(expandedAccordions);
                  if (isExpanded) {
                    newExpanded.add(section.title);
                  } else {
                    newExpanded.delete(section.title);
                  }
                  setExpandedAccordions(newExpanded);
                  setAllAccordionsExpanded(
                    newExpanded.size === accordionSections.length
                  );
                }}
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
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
                        } else if (section.title === "STORIES") {
                          handleCreateStoryClick();
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
                          className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleEditIdea(idea)}
                        >
                          <BatchPredictionIcon
                            sx={{
                              fontSize: 40,
                              color: "rgb(107, 114, 128)",
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
                            <div className="flex items-center justify-between">
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
                                {new Date(idea.createdAt).toLocaleDateString()}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => handleDeleteIdea(idea.id, e)}
                                sx={{
                                  color: "rgb(156, 163, 175)",
                                  padding: "2px",
                                  "&:hover": {
                                    color: "rgb(239, 68, 68)",
                                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  },
                                }}
                              >
                                <DeleteOutlinedIcon sx={{ fontSize: "14px" }} />
                              </IconButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : section.title === "CHARACTERS" &&
                    characters.length > 0 ? (
                    <div className="space-y-3">
                      {characters.map((character) => {
                        const styling = getCharacterStyling(character.gender);
                        return (
                          <div
                            key={character.id}
                            className="flex items-start gap-3 p-3 rounded-md border border-gray-200 cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: styling.backgroundColor }}
                            onClick={() => handleEditCharacter(character)}
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
                              styling.icon
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
                                <div className="flex items-center justify-between">
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
                                  <IconButton
                                    size="small"
                                    onClick={(e) =>
                                      handleDeleteCharacter(character.id, e)
                                    }
                                    sx={{
                                      color: "rgb(156, 163, 175)",
                                      padding: "2px",
                                      "&:hover": {
                                        color: "rgb(239, 68, 68)",
                                        backgroundColor:
                                          "rgba(239, 68, 68, 0.1)",
                                      },
                                    }}
                                  >
                                    <DeleteOutlinedIcon
                                      sx={{ fontSize: "14px" }}
                                    />
                                  </IconButton>
                                </div>
                              )}
                              {!character.gender && (
                                <div className="flex items-center justify-end mt-1">
                                  <IconButton
                                    size="small"
                                    onClick={(e) =>
                                      handleDeleteCharacter(character.id, e)
                                    }
                                    sx={{
                                      color: "rgb(156, 163, 175)",
                                      padding: "2px",
                                      "&:hover": {
                                        color: "rgb(239, 68, 68)",
                                        backgroundColor:
                                          "rgba(239, 68, 68, 0.1)",
                                      },
                                    }}
                                  >
                                    <DeleteOutlinedIcon
                                      sx={{ fontSize: "14px" }}
                                    />
                                  </IconButton>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : section.title === "OUTLINE" && outlines.length > 0 ? (
                    <div className="space-y-3">
                      {outlines.map((outline) => (
                        <div
                          key={outline.id}
                          className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleEditOutline(outline)}
                        >
                          <ListAltIcon
                            sx={{
                              fontSize: 40,
                              color: "rgb(107, 114, 128)",
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
                            <div className="flex items-center justify-between">
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
                                {new Date(
                                  outline.createdAt
                                ).toLocaleDateString()}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) =>
                                  handleDeleteOutline(outline.id, e)
                                }
                                sx={{
                                  color: "rgb(156, 163, 175)",
                                  padding: "2px",
                                  "&:hover": {
                                    color: "rgb(239, 68, 68)",
                                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  },
                                }}
                              >
                                <DeleteOutlinedIcon sx={{ fontSize: "14px" }} />
                              </IconButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : section.title === "STORIES" && stories.length > 0 ? (
                    <div className="space-y-3">
                      {stories.map((story) => (
                        <div
                          key={story.id}
                          className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleEditStory(story)}
                        >
                          <HistoryEduIcon
                            sx={{
                              fontSize: 40,
                              color: "rgb(107, 114, 128)",
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
                              {story.title}
                            </Typography>
                            <div className="flex items-center justify-between">
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
                                {new Date(story.createdAt).toLocaleDateString()}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => handleDeleteStory(story.id, e)}
                                sx={{
                                  color: "rgb(156, 163, 175)",
                                  padding: "2px",
                                  "&:hover": {
                                    color: "rgb(239, 68, 68)",
                                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  },
                                }}
                              >
                                <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </div>
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
                          <AutoStoriesIcon
                            sx={{
                              fontSize: 40,
                              color: "rgb(107, 114, 128)",
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
                            <div className="flex items-center justify-between">
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
                                {new Date(
                                  chapter.createdAt
                                ).toLocaleDateString()}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) =>
                                  handleDeleteChapter(chapter.id, e)
                                }
                                sx={{
                                  color: "rgb(156, 163, 175)",
                                  padding: "2px",
                                  "&:hover": {
                                    color: "rgb(239, 68, 68)",
                                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  },
                                }}
                              >
                                <DeleteOutlinedIcon sx={{ fontSize: "14px" }} />
                              </IconButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : section.title === "PARTS" && parts.length > 0 ? (
                    <div className="space-y-3">
                      {parts.map((part) => (
                        <div
                          key={part.id}
                          className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleEditPart(part)}
                        >
                          <FolderCopyIcon
                            sx={{
                              fontSize: 40,
                              color: "rgb(107, 114, 128)",
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
                            <div className="flex items-center justify-between">
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
                                Chapters: {(part.chapterIds || []).length},
                                Stories: {(part.storyIds || []).length}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => handleDeletePart(part.id, e)}
                                sx={{
                                  color: "rgb(156, 163, 175)",
                                  padding: "2px",
                                  "&:hover": {
                                    color: "rgb(239, 68, 68)",
                                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  },
                                }}
                              >
                                <DeleteOutlinedIcon sx={{ fontSize: "14px" }} />
                              </IconButton>
                            </div>
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
        )}
      </div>

      {/* Column 2: Quill Editor - Flexible width */}
      <div className="flex-1 flex flex-col">
        {/* Header with Title */}
        <div
          className="p-4  bg-white flex items-center justify-between"
          style={{ zIndex: 10 }}
        >
          {isEditingChapter || isEditingStory || isEditingOutline ? (
            <>
              <div className="flex items-center gap-3">
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 400,
                    fontSize: "12px",
                    color: "rgb(107, 114, 128)",
                  }}
                >
                  {currentChapter || currentStory || currentOutline
                    ? `${currentEditorWordCount} Words${
                        lastSaveTime ? ` | Saved at ${lastSaveTime}` : ""
                      }`
                    : lastSaveTime
                    ? `Saved ${lastSaveTime}`
                    : ""}
                </Typography>
              </div>
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
                  setIsEditingStory(false);
                  setCurrentStory(null);
                  setIsEditingOutline(false);
                  setCurrentOutline(null);
                  setLastSaveTime(null);
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
            </>
          ) : null}
        </div>

        {/* Dashboard Container */}
        <div className="flex-1 relative p-4">
          <div
            className={`h-full flex flex-col ${
              isEditingChapter || isEditingStory || isEditingOutline
                ? ""
                : "hidden"
            }`}
          >
            {/* Chapter/Outline Header */}
            {isEditingChapter && currentChapter ? (
              <div className="mb-3 mt-6 text-center">
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: 700,
                    fontSize: "72px",
                    color: "#1f2937",
                    lineHeight: 1,
                    marginBottom: "0",
                  }}
                >
                  {chapters.findIndex((ch) => ch.id === currentChapter.id) + 1}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: 600,
                    fontSize: "32px",
                    color: "#1f2937",
                    marginBottom: "24px",
                  }}
                >
                  {currentChapter.title}
                </Typography>
              </div>
            ) : isEditingStory && currentStory ? (
              <div className="mb-6 mt-6 text-center">
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: 600,
                    fontSize: "32px",
                    color: "#1f2937",
                    marginBottom: "24px",
                  }}
                >
                  {currentStory.title}
                </Typography>
              </div>
            ) : isEditingOutline && currentOutline ? (
              <div className="mb-6 mt-6 text-center">
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: 600,
                    fontSize: "32px",
                    color: "#1f2937",
                    marginBottom: "24px",
                  }}
                >
                  {currentOutline.title}
                </Typography>
              </div>
            ) : null}
            <div ref={quillRef} className="flex-1"></div>
          </div>
          <div
            className={`h-full bg-white rounded-lg p-6 ${
              isEditingChapter || isEditingStory || isEditingOutline
                ? "hidden"
                : ""
            }`}
          >
            {/* Title and Word Count */}
            <div className="text-center mb-8">
              <Typography
                variant="h3"
                sx={{
                  fontFamily: "'Crimson Text', serif",
                  fontWeight: 700,
                  fontSize: "36px",
                  color: "#1f2937",
                  marginBottom: "8px",
                }}
              >
                {book?.title || "Untitled Book"}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "'Crimson Text', serif",
                  fontWeight: 600,
                  fontSize: "16px",
                  color: "rgb(107, 114, 128)",
                }}
              >
                A total {totalWordCount.toLocaleString()} words have been
                written and you started this book {getDaysSinceBookCreation()}{" "}
                days ago
              </Typography>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 relative">
                <IconButton
                  onClick={handleCreateIdeaClick}
                  sx={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "24px",
                    height: "24px",
                    color: "rgb(19, 135, 194)",
                    "&:hover": {
                      backgroundColor: "rgba(19, 135, 194, 0.1)",
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: "16px" }} />
                </IconButton>
                <div className="flex flex-col items-center text-center">
                  <BatchPredictionIcon
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

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 relative">
                <IconButton
                  onClick={handleCreateCharacterClick}
                  sx={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "24px",
                    height: "24px",
                    color: "rgb(19, 135, 194)",
                    "&:hover": {
                      backgroundColor: "rgba(19, 135, 194, 0.1)",
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: "16px" }} />
                </IconButton>
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

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 relative">
                <IconButton
                  onClick={handleCreateChapterClick}
                  sx={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "24px",
                    height: "24px",
                    color: "rgb(19, 135, 194)",
                    "&:hover": {
                      backgroundColor: "rgba(19, 135, 194, 0.1)",
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: "16px" }} />
                </IconButton>
                <div className="flex flex-col items-center text-center">
                  <AutoStoriesIcon
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

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 relative">
                <IconButton
                  onClick={handleCreateOutlineClick}
                  sx={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "24px",
                    height: "24px",
                    color: "rgb(19, 135, 194)",
                    "&:hover": {
                      backgroundColor: "rgba(19, 135, 194, 0.1)",
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: "16px" }} />
                </IconButton>
                <div className="flex flex-col items-center text-center">
                  <ListAltIcon
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

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 relative">
                <IconButton
                  onClick={handleCreatePartClick}
                  sx={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "24px",
                    height: "24px",
                    color: "rgb(19, 135, 194)",
                    "&:hover": {
                      backgroundColor: "rgba(19, 135, 194, 0.1)",
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: "16px" }} />
                </IconButton>
                <div className="flex flex-col items-center text-center">
                  <FolderCopyIcon
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

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 relative">
                <IconButton
                  onClick={handleCreateStoryClick}
                  sx={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "24px",
                    height: "24px",
                    color: "rgb(19, 135, 194)",
                    "&:hover": {
                      backgroundColor: "rgba(19, 135, 194, 0.1)",
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: "16px" }} />
                </IconButton>
                <div className="flex flex-col items-center text-center">
                  <HistoryEduIcon
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
                      {stories.length}
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
                      Stories
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-8 mt-8">
              <div className="flex items-center justify-between mb-4">
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 600,
                    fontSize: "18px",
                    color: "#1f2937",
                  }}
                >
                  Recent Activity
                </Typography>
                <IconButton
                  onClick={handleClearRecentActivity}
                  size="small"
                  sx={{
                    color: "rgb(156, 163, 175)",
                    "&:hover": {
                      color: "rgb(239, 68, 68)",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                    },
                  }}
                >
                  <CancelIcon sx={{ fontSize: "20px" }} />
                </IconButton>
              </div>
              <div className="space-y-3">
                {getRecentActivity()
                  .slice(0, 5)
                  .map((activity: RecentActivity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleRecentActivityClick(activity)}
                    >
                      {activity.type === "idea" ? (
                        <BatchPredictionIcon
                          sx={{
                            fontSize: 20,
                            color: "rgb(107, 114, 128)",
                          }}
                        />
                      ) : activity.type === "character" ? (
                        <FaceOutlinedIcon
                          sx={{
                            fontSize: 20,
                            color: "rgb(107, 114, 128)",
                          }}
                        />
                      ) : activity.type === "outline" ? (
                        <ListAltIcon
                          sx={{
                            fontSize: 20,
                            color: "rgb(107, 114, 128)",
                          }}
                        />
                      ) : activity.type === "story" ? (
                        <HistoryEduIcon
                          sx={{
                            fontSize: 20,
                            color: "rgb(107, 114, 128)",
                          }}
                        />
                      ) : activity.type === "chapter" ? (
                        <AutoStoriesIcon
                          sx={{
                            fontSize: 20,
                            color: "rgb(107, 114, 128)",
                          }}
                        />
                      ) : activity.type === "part" ? (
                        <FolderCopyIcon
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
                          {`New ${activity.type}: ${activity.title}`}
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
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </Typography>
                      </div>
                    </div>
                  ))}
                {getRecentActivity().length === 0 && (
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
            <div className="w-full bg-gray-200 text-center py-4 text-gray-500 font-small">
              Caution: This is a demo version. Data may be periodically cleared
              from local storage.
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
                {editingIdea ? "Edit Idea" : "Create New Idea"}
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
                  {editingIdea ? "Update Idea" : "Create Idea"}
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
                {editingCharacter ? "Edit Character" : "Create New Character"}
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
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={characterGender}
                  onChange={(e) => setCharacterGender(e.target.value)}
                  label="Gender"
                >
                  <MenuItem value="">
                    <em>Select Gender</em>
                  </MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Animal">Animal</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
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
                  {editingCharacter ? "Update Character" : "Create Character"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Create Chapter Modal */}
        <Modal
          open={createChapterModalOpen}
          onClose={handleCreateChapterModalClose}
          aria-labelledby="create-chapter-modal-title"
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
                id="create-chapter-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Create New Chapter
              </Typography>
              <IconButton
                onClick={handleCreateChapterModalClose}
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
                label="Chapter Name (optional)"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
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
                  onClick={handleCreateChapterModalClose}
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
                  onClick={handleCreateChapter}
                  variant="contained"
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
                  Create Chapter
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
            <Box sx={{ p: 4 }}>
              <TextField
                fullWidth
                label="Story Name (optional)"
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
                {editingPart ? "Edit Part" : "Create New Part"}
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
                      .map((chapter) => {
                        const chapterNumber =
                          chapters.findIndex((ch) => ch.id === chapter.id) + 1;
                        return `${chapter.title} (Chapter ${chapterNumber})`;
                      })
                      .join(", ")
                  }
                  label="Select Chapters"
                >
                  {chapters
                    .filter(
                      (chapter) =>
                        !parts.some(
                          (part) =>
                            part.id !== editingPart?.id &&
                            (part.chapterIds || []).includes(chapter.id)
                        )
                    )
                    .map((chapter) => {
                      const chapterNumber =
                        chapters.findIndex((ch) => ch.id === chapter.id) + 1;
                      return (
                        <MenuItem key={chapter.id} value={chapter.id}>
                          <Checkbox
                            checked={selectedChapterIds.includes(chapter.id)}
                          />
                          <ListItemText
                            primary={`${chapter.title} (Chapter ${chapterNumber})`}
                          />
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Select Stories</InputLabel>
                <Select
                  multiple
                  value={selectedStoryIds}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedStoryIds(
                      typeof value === "string" ? value.split(",") : value
                    );
                  }}
                  renderValue={(selected) =>
                    stories
                      .filter((story) => selected.includes(story.id))
                      .map((story) => story.title)
                      .join(", ")
                  }
                  label="Select Stories"
                >
                  {stories
                    .filter(
                      (story) =>
                        !parts.some(
                          (part) =>
                            part.id !== editingPart?.id &&
                            (part.storyIds || []).includes(story.id)
                        )
                    )
                    .map((story) => (
                      <MenuItem key={story.id} value={story.id}>
                        <Checkbox
                          checked={selectedStoryIds.includes(story.id)}
                        />
                        <ListItemText primary={story.title} />
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
                    !partTitle.trim() ||
                    (selectedChapterIds.length === 0 &&
                      selectedStoryIds.length === 0)
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
                  {editingPart ? "Update Part" : "Create Part"}
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
