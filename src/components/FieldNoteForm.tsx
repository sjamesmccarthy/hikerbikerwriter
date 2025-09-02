"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Timer as TimerIcon,
  StopCircle as StopCircleIcon,
  PlayCircleFilled as PlayCircleFilledIcon,
  HighlightOff as HighlightOffIcon,
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
} from "@mui/material";
import { renderMoodMenuItems } from "./shared/moodHelpers";

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
};

interface FieldNoteFormProps {
  initialData?: FieldNote;
  isEditing?: boolean;
  onSubmit: (
    data: Omit<FieldNote, "id" | "slug" | "author" | "date">
  ) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const FieldNoteForm: React.FC<FieldNoteFormProps> = ({
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

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      setTags(initialData.tags || "");
      setMood(initialData.mood || "");
      setImages(initialData.images || []);
      setMakePublic(initialData.is_public || false);
      setShareWithFamily(initialData.shared_family || false);
    }
  }, [initialData]);

  // Timer cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Word counter
  const wordCount =
    content.trim() === "" ? 0 : content.trim().split(/\s+/).length;

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
          alert("Timer finished! Time to wrap up your field note.");
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

    if (!title.trim() || !content.trim()) {
      return;
    }

    await onSubmit({
      title,
      content,
      tags,
      mood,
      images,
      is_public: makePublic,
      shared_family: shareWithFamily,
    });
  };

  return (
    <div className="p-4 pt-4 max-w-4xl mx-auto">
      <div className="bg-gray-100 p-4 rounded-lg">
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          {/* Title Field */}
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="outlined"
            required
            placeholder="Enter field note title..."
            sx={{ mb: 2 }}
          />

          {/* Visibility Controls */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
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

          <TextField
            fullWidth
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="outlined"
            multiline
            rows={12}
            required
            placeholder="Write your field note content here..."
            sx={{ mb: 2 }}
          />

          {/* Timer and Word Counter Section */}
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
                      onChange={(e) => setTimerMinutes(Number(e.target.value))}
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

          <TextField
            fullWidth
            label="Tags (space or comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            variant="outlined"
            placeholder="hiking brewing recipes photography"
            helperText="Add tags to help categorize and find your field note"
            sx={{ mb: 2 }}
          />

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

          {/* Image Upload Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Images (up to 4)
            </Typography>

            {/* Upload Button */}
            {images.length < 4 && (
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 2 }}
              >
                Upload Images
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
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
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

          <div className="flex gap-4 mb-4 justify-center sm:justify-start">
            <Button
              type="submit"
              variant="contained"
              size="medium"
              disabled={!title.trim() || !content.trim() || isSubmitting}
              className="w-1/2 sm:w-auto"
            >
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                ? "Update"
                : "Add Note"}
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-1/2 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FieldNoteForm;
