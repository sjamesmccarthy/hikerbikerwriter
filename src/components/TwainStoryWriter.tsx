"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";

// Define Quill types
interface QuillInstance {
  root: HTMLElement;
  focus(): void;
  getContents(): unknown;
  setContents(delta: unknown): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
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
                  <AddCircleOutlinedIcon
                    sx={{
                      fontSize: "18px",
                      color: "rgb(19, 135, 194)",
                    }}
                  />
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
    </div>
  );
};

export default TwainStoryWriter;
