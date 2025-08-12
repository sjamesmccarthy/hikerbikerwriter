"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
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

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      setTags(initialData.tags || "");
      setMood(initialData.mood || "");
      setImages(initialData.images || []);
      setMakePublic(initialData.is_public || false);
    }
  }, [initialData]);

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
    });
  };

  return (
    <div className="p-4 pt-12 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        {/* Title and Make Public Toggle */}
        <div className="flex gap-4 items-end mb-4">
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="outlined"
            required
            placeholder="Enter field note title..."
          />
          <FormControlLabel
            control={
              <Switch
                checked={makePublic}
                onChange={(e) => setMakePublic(e.target.checked)}
                color="primary"
              />
            }
            label="Make Public"
            sx={{ minWidth: "160px", mb: 0.5 }}
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

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            size="medium"
            disabled={!title.trim() || !content.trim() || isSubmitting}
          >
            {isSubmitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
              ? "Save Changes"
              : "Create Field Note"}
          </Button>
          <Button
            variant="outlined"
            size="medium"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FieldNoteForm;
