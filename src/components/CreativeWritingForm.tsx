"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Timer as TimerIcon,
  StopCircle as StopCircleIcon,
  PlayCircleFilled as PlayCircleFilledIcon,
  HighlightOff as HighlightOffIcon,
  ReplayOutlined as ReplayOutlinedIcon,
  HighlightOffOutlined as HighlightOffOutlinedIcon,
  MultipleStopOutlined as MultipleStopOutlinedIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  Button,
  Box,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
  MenuItem,
  Modal,
} from "@mui/material";
import { renderMoodMenuItems } from "./shared/moodHelpers";
import promptsData from "@/data/prompts.json";

type FieldNote = {
  id?: number;
  slug?: string;
  title: string;
  content: string;
  author?: string;
  date?: string;
  tags?: string;
  mood?: string;
  images?: string[];
  is_public?: boolean;
  shared_family?: boolean;
  type?: string;
};

interface CreativeWritingFormProps {
  initialData?: FieldNote;
  isEditing?: boolean;
  onSubmit: (
    data: Omit<FieldNote, "id" | "slug" | "author" | "date">
  ) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const CreativeWritingForm: React.FC<CreativeWritingFormProps> = ({
  initialData,
  isEditing = false,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState(initialData?.tags || "");
  const [mood, setMood] = useState(initialData?.mood || "");
  const [type, setType] = useState(initialData?.type || "FieldNote");
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [makePublic, setMakePublic] = useState(initialData?.is_public || false);
  const [shareWithFamily, setShareWithFamily] = useState(
    initialData?.shared_family || false
  );

  // Timer state
  const [showTimerSelect, setShowTimerSelect] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Dice rolling state
  const [isRolling, setIsRolling] = useState(false);
  const [diceResults, setDiceResults] = useState<{
    red: number;
    blue: number;
  } | null>(null);
  const [hasRolled, setHasRolled] = useState(false);

  // Writing prompt state
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  // Full screen modal state
  const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);

  // Ref for the content textarea
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Quill editor refs and state
  const quillRef = useRef<HTMLDivElement>(null);
  const [quillInstance, setQuillInstance] = useState<unknown>(null);

  // Initialize Quill editor for Short Story type
  useEffect(() => {
    if (
      type === "ShortStory" &&
      typeof window !== "undefined" &&
      quillRef.current &&
      !quillInstance
    ) {
      // Load Quill CSS first
      const linkElement = document.createElement("link");
      linkElement.rel = "stylesheet";
      linkElement.href = "https://cdn.quilljs.com/1.3.6/quill.bubble.css";
      if (!document.querySelector(`link[href="${linkElement.href}"]`)) {
        document.head.appendChild(linkElement);
      }

      // Then load Quill
      import("quill")
        .then((Quill) => {
          if (!quillRef.current) return;
          const quill = new Quill.default(quillRef.current, {
            theme: "bubble",
            placeholder: "Write your short story here...",
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
                [{ list: "ordered" }, { list: "bullet" }],
                ["blockquote"],
                ["clean"],
              ],
            },
          });

          // Set custom font for editor content
          quill.root.style.fontFamily = "serif";
          quill.root.style.fontSize = "16px";
          quill.root.style.lineHeight = "1.6";
          quill.root.style.padding = "20px";

          // Set initial content if available
          if (content) {
            quill.root.innerHTML = content;
          }

          // Listen for content changes
          quill.on("text-change", () => {
            const htmlContent = quill.root.innerHTML;
            setContent(htmlContent);
          });

          setQuillInstance(quill);
        })
        .catch((error) => {
          console.error("Failed to load Quill:", error);
        });
    }
  }, [type, quillInstance, content]);

  // Clean up Quill instance when switching away from Short Story
  useEffect(() => {
    if (type !== "ShortStory" && quillInstance) {
      setQuillInstance(null);
    }
  }, [type, quillInstance]);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      setTags(initialData.tags || "");
      setMood(initialData.mood || "");
      setType(initialData.type || "FieldNote");
      setImages(initialData.images || []);
      setMakePublic(initialData.is_public || false);
      setShareWithFamily(initialData.shared_family || false);
    }
  }, [initialData]);

  // Clear mood and images when switching to Roll and Write or Short Story, and auto-roll dice for Roll and Write
  useEffect(() => {
    if (type === "RollAndWrite") {
      setMood("");
      setImages([]);
      // Auto-roll dice when switching to Roll and Write for new entries only
      if (!isEditing) {
        rollDice();
      }
    } else if (type === "ShortStory") {
      setMood("");
      setImages([]);
    }
  }, [type, isEditing]);

  // Timer cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Word counter - handle both plain text and HTML content
  const getWordCount = (text: string) => {
    if (type === "ShortStory") {
      // For Quill content, strip HTML tags and count words
      const div = document.createElement("div");
      div.innerHTML = text;
      const plainText = div.textContent || div.innerText || "";
      return plainText.trim() === "" ? 0 : plainText.trim().split(/\s+/).length;
    } else {
      // For plain text content
      return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    }
  };

  const wordCount = getWordCount(content);

  // Timer functions
  const startTimer = () => {
    const totalSeconds = timerMinutes * 60;
    setTimeRemaining(totalSeconds);
    setIsTimerRunning(true);
    setShowTimerSelect(false);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          setTimerInterval(null);
          alert("Timer finished! Time to wrap up your creative piece.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsTimerRunning(false);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Dice rolling function
  const rollDice = () => {
    setIsRolling(true);
    setHasRolled(true);

    // Animate for 2 seconds
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setDiceResults({
        red: Math.floor(Math.random() * 8) + 1,
        blue: Math.floor(Math.random() * 8) + 1,
      });
      rollCount++;

      if (rollCount >= 20) {
        // Roll 20 times over 2 seconds (100ms intervals)
        clearInterval(rollInterval);
        setIsRolling(false);
        // Set final results
        setDiceResults({
          red: Math.floor(Math.random() * 8) + 1,
          blue: Math.floor(Math.random() * 8) + 1,
        });
      }
    }, 100);
  };

  // Writing prompt functions
  const showRandomPrompt = () => {
    const prompts = promptsData.prompts;
    const randomIndex = Math.floor(Math.random() * prompts.length);
    const randomPrompt = prompts[randomIndex];
    setSelectedPrompt(randomPrompt);
    setShowPrompt(true);
  };

  const replacePrompt = () => {
    const prompts = promptsData.prompts;
    const randomIndex = Math.floor(Math.random() * prompts.length);
    const randomPrompt = prompts[randomIndex];
    setSelectedPrompt(randomPrompt);
  };

  const closePrompt = () => {
    setSelectedPrompt(null);
    setShowPrompt(false);
  };

  // Swap dice function
  const swapDice = () => {
    if (!diceResults) return;

    setDiceResults({
      red: diceResults.blue,
      blue: diceResults.red,
    });
  };

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(new Error("Failed to convert file to base64"));
    });
  };

  // Handle image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < Math.min(files.length, 4 - images.length); i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        try {
          const base64 = await convertToBase64(file);
          newImages.push(base64);
        } catch (error) {
          console.error("Error converting image to base64:", error);
        }
      }
    }

    setImages((prev) => [...prev, ...newImages].slice(0, 4));
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For Roll and Write, title is optional, but content is still required
    const isTitleRequired = type !== "RollAndWrite";
    if ((isTitleRequired && !title.trim()) || !content.trim()) {
      return;
    }

    await onSubmit({
      title,
      content,
      tags,
      mood: type === "FieldNote" ? mood : "",
      type,
      images: type === "FieldNote" ? images : [],
      is_public: makePublic,
      shared_family: shareWithFamily,
    });
  };

  return (
    <div className="p-4 pt-4 max-w-4xl mx-auto">
      <div className="bg-gray-100 p-4 rounded-lg">
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          {/* Type and Title Fields - Side by side on desktop, stacked on mobile */}
          <div className="flex flex-col sm:flex-row sm:gap-4 mb-2">
            {/* Type Field */}
            <FormControl
              className="w-full sm:w-48"
              sx={{ mb: { xs: 2, sm: 0 } }}
            >
              <InputLabel>Type</InputLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                label="Type"
                required
              >
                <MenuItem value="FieldNote">Field Note</MenuItem>
                <MenuItem value="RollAndWrite">Roll And Write</MenuItem>
                <MenuItem value="ShortStory">Short Story</MenuItem>
              </Select>
            </FormControl>

            {/* Title Field */}
            <TextField
              className="w-full sm:flex-1"
              label={type === "RollAndWrite" ? "Title (optional)" : "Title"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="outlined"
              required={type !== "RollAndWrite"}
              placeholder={
                type === "RollAndWrite"
                  ? "Enter title (optional)..."
                  : "Enter creative piece title..."
              }
            />
          </div>

          {/* Visibility Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-2">
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <FormControlLabel
                control={
                  <Switch
                    checked={makePublic}
                    onChange={(e) => setMakePublic(e.target.checked)}
                    color="primary"
                  />
                }
                label="Make Public"
                sx={{ minWidth: "160px" }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={shareWithFamily}
                    onChange={(e) => setShareWithFamily(e.target.checked)}
                    color="primary"
                  />
                }
                label="Share with Family"
                sx={{ minWidth: "180px" }}
              />
            </div>
          </div>

          {/* Content Editor - Quill for Short Story, regular textarea for others */}
          {type === "ShortStory" ? (
            <Box sx={{ mb: 2 }}>
              <div
                ref={quillRef}
                style={{
                  minHeight: "60vh",
                  backgroundColor: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsFullScreenModalOpen(true)}
                  sx={{ textTransform: "none" }}
                >
                  Full Screen Preview
                </Button>
              </Box>
            </Box>
          ) : (
            <TextField
              fullWidth
              label="Content"
              value={content}
              inputRef={contentRef}
              onChange={(e) => {
                const newContent = e.target.value;

                // For Roll and Write with dice results, enforce word limit
                if (type === "RollAndWrite" && diceResults && hasRolled) {
                  const maxWords = parseInt(
                    `${diceResults.red}${diceResults.blue}`
                  );
                  const newWordCount =
                    newContent.trim() === ""
                      ? 0
                      : newContent.trim().split(/\s+/).length;

                  // Only update if under limit or if removing content
                  if (
                    newWordCount <= maxWords ||
                    newContent.length < content.length
                  ) {
                    setContent(newContent);
                  }
                } else {
                  setContent(newContent);
                }
              }}
              onPaste={(e) => {
                // For Roll and Write, handle paste specially to truncate if needed
                if (type === "RollAndWrite" && diceResults && hasRolled) {
                  e.preventDefault();
                  const pastedText = e.clipboardData.getData("text");
                  const currentContent = content;
                  const maxWords = parseInt(
                    `${diceResults.red}${diceResults.blue}`
                  );

                  // Get cursor position
                  const textarea = contentRef.current;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;

                    // Build new content with pasted text
                    const beforeCursor = currentContent.slice(0, start);
                    const afterCursor = currentContent.slice(end);
                    const newContent = beforeCursor + pastedText + afterCursor;

                    // Check word count and truncate if necessary
                    const words = newContent.trim().split(/\s+/);
                    if (words.length > maxWords && newContent.trim() !== "") {
                      const truncatedWords = words.slice(0, maxWords);
                      const truncatedContent = truncatedWords.join(" ");
                      setContent(truncatedContent);
                    } else {
                      setContent(newContent);
                    }
                  }
                }
                // For other types, let the default paste behavior work
              }}
              variant="outlined"
              multiline
              minRows={type === "RollAndWrite" ? 5 : 8} // FieldNote
              maxRows={50}
              required
              placeholder="Write your creative content here..."
              sx={{
                mb: 2,
                "& .MuiInputBase-root": {
                  border: "none",
                  minHeight: type === "RollAndWrite" ? "17.5vh" : "50vh", // FieldNote
                  maxHeight: type === "RollAndWrite" ? "25vh" : "80vh", // Default for other types
                  alignItems: "flex-start",
                  backgroundColor: "white",
                },
              }}
            />
          )}

          {/* Dice Rolling Section - Only for Roll and Write */}
          {type === "RollAndWrite" && (
            <>
              <div className="flex items-center gap-4 mb-4">
                {diceResults && (
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-4xl font-bold ${
                        isRolling ? "animate-pulse" : ""
                      }`}
                      style={{ color: "#dc2626" }}
                    >
                      {diceResults.red}
                    </div>

                    <IconButton
                      onClick={swapDice}
                      disabled={isRolling}
                      size="small"
                      sx={{
                        color: "#666",
                        "&:hover": {
                          color: "#333",
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                      title="Swap numbers"
                    >
                      <MultipleStopOutlinedIcon fontSize="medium" />
                    </IconButton>

                    <div
                      className={`text-4xl font-bold ${
                        isRolling ? "animate-pulse" : ""
                      }`}
                      style={{ color: "#2563eb" }}
                    >
                      {diceResults.blue}
                    </div>
                  </div>
                )}

                <Button
                  variant="contained"
                  onClick={rollDice}
                  disabled={isRolling}
                  sx={{
                    minWidth: 140,
                    fontWeight: "normal",
                    fontSize: "1rem",
                    textTransform: "none",
                    backgroundColor: "#6b7280",
                    color: "#ffffff",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "#9ca3af",
                      boxShadow: "none",
                    },
                    "&:disabled": {
                      backgroundColor: "#f9fafb",
                      color: "#9ca3af",
                    },
                  }}
                >
                  {hasRolled ? "Roll Again" : "Roll Dice"}
                </Button>

                {hasRolled && !showPrompt && (
                  <>
                    <Button
                      variant="text"
                      onClick={showRandomPrompt}
                      sx={{
                        fontWeight: "normal",
                        fontSize: "1rem",
                        textTransform: "none",
                      }}
                    >
                      Show Writing Prompt
                    </Button>
                    <div className="text-gray-600 ml-auto">
                      <span className="font-semibold">{wordCount}</span> /{" "}
                      {diceResults
                        ? `${diceResults.red}${diceResults.blue}`
                        : "0"}{" "}
                      Words
                    </div>
                  </>
                )}

                {hasRolled && showPrompt && (
                  <div className="text-gray-600 ml-auto">
                    <span className="font-semibold">{wordCount}</span> /{" "}
                    {diceResults
                      ? `${diceResults.red}${diceResults.blue}`
                      : "0"}{" "}
                    Words
                  </div>
                )}
              </div>

              {/* Writing Prompt Display */}
              {showPrompt && selectedPrompt && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center gap-3">
                    <Typography
                      variant="body1"
                      className="text-gray-700 flex-1"
                    >
                      {selectedPrompt}
                    </Typography>
                    <div className="flex gap-1 flex-shrink-0">
                      <IconButton
                        size="small"
                        onClick={replacePrompt}
                        sx={{ color: "#1976d2" }}
                        title="New prompt"
                      >
                        <ReplayOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={closePrompt}
                        sx={{ color: "#666" }}
                        title="Close prompt"
                      >
                        <HighlightOffOutlinedIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Timer and Word Counter Section - Hidden for Roll and Write */}
          {type !== "RollAndWrite" && (
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded">
              {/* Timer Section */}
              <div className="flex items-center gap-3">
                {!isTimerRunning && !showTimerSelect && (
                  <button
                    type="button"
                    onClick={() => setShowTimerSelect(true)}
                    className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                  >
                    <TimerIcon sx={{ fontSize: 20 }} />
                    Set Timer
                  </button>
                )}

                {showTimerSelect && !isTimerRunning && (
                  <div className="flex items-center gap-3">
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Timer</InputLabel>
                      <Select
                        value={timerMinutes}
                        onChange={(e) =>
                          setTimerMinutes(Number(e.target.value))
                        }
                        label="Timer"
                      >
                        <MenuItem value={5}>5 minutes</MenuItem>
                        <MenuItem value={10}>10 minutes</MenuItem>
                        <MenuItem value={15}>15 minutes</MenuItem>
                        <MenuItem value={20}>20 minutes</MenuItem>
                        <MenuItem value={25}>25 minutes</MenuItem>
                        <MenuItem value={30}>30 minutes</MenuItem>
                        <MenuItem value={60}>60 minutes</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton
                      type="button"
                      onClick={startTimer}
                      color="success"
                      size="small"
                      sx={{ height: "40px", width: "20px" }}
                    >
                      <PlayCircleFilledIcon />
                    </IconButton>
                    <IconButton
                      type="button"
                      onClick={() => setShowTimerSelect(false)}
                      size="small"
                      sx={{
                        height: "40px",
                        width: "20px",
                        color: "#6b7280",
                        "&:hover": {
                          backgroundColor: "#f9fafb",
                          color: "#9ca3af",
                        },
                      }}
                    >
                      <HighlightOffIcon />
                    </IconButton>
                  </div>
                )}

                {isTimerRunning && (
                  <div className="flex items-center gap-0.5">
                    <div className="text-2xl font-bold text-green-600">
                      {formatTime(timeRemaining)}
                    </div>
                    <IconButton
                      type="button"
                      onClick={stopTimer}
                      color="error"
                      size="small"
                      sx={{ height: "40px", width: "40px" }}
                    >
                      <StopCircleIcon />
                    </IconButton>
                  </div>
                )}
              </div>

              {/* Word Counter */}
              <div className="text-gray-600">
                <span className="font-semibold">{wordCount}</span> Words
              </div>
            </div>
          )}

          {/* Tags Section - Hidden for Roll and Write */}
          {type !== "RollAndWrite" && (
            <TextField
              fullWidth
              label="Tags (space or comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              variant="outlined"
              placeholder="hiking brewing recipes photography"
              sx={{ mb: 2 }}
            />
          )}

          {/* Mood Section - Hidden for Roll and Write and Short Story */}
          {type === "FieldNote" && (
            <FormControl fullWidth variant="outlined" sx={{ mb: 4 }}>
              <InputLabel>Mood</InputLabel>
              <Select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                label="Mood"
              >
                {renderMoodMenuItems()}
              </Select>
            </FormControl>
          )}

          {/* Image Upload Section - Hidden for Roll and Write and Short Story */}
          {type === "FieldNote" && (
            <Box sx={{ mb: 4 }}>
              {/* Upload Button */}
              {images.length < 8 && (
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2, textTransform: "none" }}
                >
                  Upload Images (Max 8)
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
              )}

              {/* Image Previews */}
              {images.length > 0 && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 2,
                  }}
                >
                  {images.map((image, imageIndex) => (
                    <Box
                      key={`image-${imageIndex}`}
                      sx={{
                        position: "relative",
                        border: "1px solid #ddd",
                        borderRadius: 1,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={image}
                        alt={`Upload ${imageIndex + 1}`}
                        width={150}
                        height={150}
                        style={{
                          width: "100%",
                          height: "150px",
                          objectFit: "cover",
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeImage(imageIndex)}
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          <div className="flex items-center gap-4 mb-4 justify-center sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="contained"
              size="medium"
              disabled={
                (type !== "RollAndWrite" && !title.trim()) ||
                !content.trim() ||
                isSubmitting
              }
              className="w-auto"
              sx={{ textTransform: "none" }}
            >
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                ? `Update ${
                    type === "FieldNote"
                      ? "Field Note"
                      : type === "RollAndWrite"
                      ? "Roll & Write"
                      : "Short Story"
                  }`
                : `Add ${
                    type === "FieldNote"
                      ? "Field Note"
                      : type === "RollAndWrite"
                      ? "Roll & Write"
                      : "Short Story"
                  }`}
            </Button>
          </div>
        </form>
      </div>

      {/* Full Screen Modal for Short Story */}
      <Modal
        open={isFullScreenModalOpen}
        onClose={() => setIsFullScreenModalOpen(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 0,
            outline: "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Modal Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              p: 2,
            }}
          >
            <IconButton
              onClick={() => setIsFullScreenModalOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Modal Content */}
          <Box
            sx={{
              flex: 1,
              p: 4,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                lineHeight: 1.8,
                fontSize: "1.1rem",
                fontFamily: "serif",
                flex: 1,
                width: "75%",
                maxWidth: "75%",
                "& h1": {
                  fontSize: "2rem",
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  marginTop: "1.5rem",
                },
                "& h2": {
                  fontSize: "1.75rem",
                  fontWeight: "bold",
                  marginBottom: "0.875rem",
                  marginTop: "1.25rem",
                },
                "& h3": {
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  marginBottom: "0.75rem",
                  marginTop: "1rem",
                },
                "& p": { marginBottom: "1rem" },
                "& strong": { fontWeight: "bold" },
                "& em": { fontStyle: "italic" },
                "& blockquote": {
                  borderLeft: "4px solid #ccc",
                  marginLeft: 0,
                  paddingLeft: "1rem",
                  fontStyle: "italic",
                  color: "#666",
                },
                "& code": {
                  backgroundColor: "#f5f5f5",
                  padding: "0.2rem 0.4rem",
                  borderRadius: "3px",
                  fontFamily: "monospace",
                },
                "& pre": {
                  backgroundColor: "#f5f5f5",
                  padding: "1rem",
                  borderRadius: "5px",
                  overflow: "auto",
                  marginBottom: "1rem",
                },
                "& ul, & ol": { marginBottom: "1rem", paddingLeft: "2rem" },
                "& li": { marginBottom: "0.5rem" },
              }}
            >
              {type === "ShortStory" ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: content || "<p>Start writing your story...</p>",
                  }}
                />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || "Start writing your story..."}
                </ReactMarkdown>
              )}
            </Box>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default CreativeWritingForm;
