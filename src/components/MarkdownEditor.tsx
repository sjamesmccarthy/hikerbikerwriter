"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckIcon,
  ArrowBack as ArrowBackIcon,
  FileDownload as FileDownloadIcon,
  Apps as AppsIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  MenuBook as FieldNotesIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  Home as HomeIcon,
  IntegrationInstructions as DevToolsIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
} from "@mui/icons-material";
import { Select, MenuItem, FormControl } from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";

interface AppMenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  submenu?: AppMenuItem[];
}

const MarkdownEditor: React.FC = () => {
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "text">("edit");
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [previewStyle, setPreviewStyle] = useState("default");
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Apps menu configuration
  const apps: AppMenuItem[] = [
    { name: "Home", path: "/", icon: HomeIcon },
    {
      name: "Dev Tools",
      path: "/utilities",
      icon: DevToolsIcon,
      submenu: [
        { name: "Md Editor", path: "/markdown", icon: CodeIcon },
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

  // Handle app selection from menu
  const handleAppSelect = (
    path: string,
    hasSubmenu: boolean = false,
    appName?: string
  ) => {
    if (hasSubmenu && appName) {
      setOpenSubmenu(openSubmenu === appName ? null : appName);
    } else {
      router.push(path);
      setIsAppsMenuOpen(false);
      setOpenSubmenu(null);
    }
  };

  // Placeholder content that shows when empty
  const placeholderContent =
    '# Welcome to Markdown Editor\n\nPaste your markdown content here and toggle between **edit**, **preview** and **text** modes.\n\n## Features\n- Live preview\n- Text Preview with easy copy button\n- Character, word and line count\n- Export to PDF or Save to Markdown file\n- GitHub Flavored Markdown support\n\n```javascript\nconst hello = "world";\nconsole.log(hello);\n```\n\n> This is a blockquote\n\n- [x] Completed task\n- [ ] Pending task\n\n## Sample Table\n\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |';

  // Get display content - show placeholder when empty and user hasn't interacted
  const displayContent =
    content || (!hasUserInteracted ? placeholderContent : "");

  // Handle focus event - clear placeholder content
  const handleTextareaFocus = () => {
    if (!hasUserInteracted && content === "") {
      setHasUserInteracted(true);
    }
  };

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
  };

  // Function to get style classes based on selected preview style
  const getPreviewStyleClasses = () => {
    switch (previewStyle) {
      case "newsprint":
        return "p-8 prose prose-lg max-w-none text-gray-900 leading-relaxed font-[family-name:var(--font-spectral)]";
      case "monospaced":
        return "p-6 prose prose-lg max-w-none text-gray-900 leading-normal bg-gray-50 font-[family-name:var(--font-jetbrains-mono)]";
      default:
        return "p-6 prose prose-lg max-w-none font-sans leading-snug";
    }
  };

  // Formatting functions for WYSIWYG toolbar that preserve full undo history
  const insertText = (
    before: string,
    after: string = "",
    placeholder: string = ""
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const replacement = before + textToInsert + after;

    // Focus the textarea first
    textarea.focus();

    // Create a proper input event that preserves undo history
    try {
      // Method 1: Use the modern InputEvent API for better undo support
      if (typeof InputEvent !== "undefined") {
        // Delete selected text first if any
        if (selectedText) {
          const deleteEvent = new InputEvent("beforeinput", {
            inputType: "deleteContentBackward",
            bubbles: true,
            cancelable: true,
          });
          textarea.dispatchEvent(deleteEvent);

          // Actually delete the text
          textarea.setSelectionRange(start, end);
          document.execCommand("delete", false);
        }

        // Insert the new text
        const insertEvent = new InputEvent("beforeinput", {
          inputType: "insertText",
          data: replacement,
          bubbles: true,
          cancelable: true,
        });

        if (textarea.dispatchEvent(insertEvent)) {
          // Use insertText input type which preserves undo history
          document.execCommand("insertText", false, replacement);

          // If we inserted placeholder text, select it so user can type over it
          if (!selectedText && placeholder) {
            const newStart = start + before.length;
            const newEnd = newStart + placeholder.length;
            setTimeout(() => {
              textarea.setSelectionRange(newStart, newEnd);
            }, 0);
          }
          return;
        }
      }

      // Method 2: Fallback using modern browser APIs
      if (
        document.execCommand &&
        document.execCommand("insertText", false, replacement)
      ) {
        // execCommand worked
        if (!selectedText && placeholder) {
          const newStart = start + before.length;
          const newEnd = newStart + placeholder.length;
          setTimeout(() => {
            textarea.setSelectionRange(newStart, newEnd);
          }, 0);
        }
        return;
      }
    } catch (error) {
      console.warn("Modern input methods failed, using fallback:", error);
    }

    // Method 3: Final fallback - this won't preserve undo history as well
    const newValue =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    // Trigger input event manually to maintain some consistency
    const inputEvent = new Event("input", { bubbles: true });
    textarea.value = newValue;
    textarea.dispatchEvent(inputEvent);
    setContent(newValue);

    // Position cursor
    setTimeout(() => {
      const newCursorPos =
        selectedText || !placeholder
          ? start + replacement.length
          : start + before.length + placeholder.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Function to strip markdown formatting for plain text view
  const stripMarkdown = (text: string): string => {
    return (
      text
        // Remove bold and italic
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/_([^_]+)_/g, "$1")
        // Remove strikethrough
        .replace(/~~([^~]+)~~/g, "$1")
        // Remove inline code
        .replace(/`([^`]+)`/g, "$1")
        // Remove links but keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, "")
        // Remove blockquotes
        .replace(/^>\s+/gm, "")
        // Remove headers
        .replace(/^#{1,6}\s+/gm, "")
        // Remove list markers
        .replace(/^[\s]*[-*+]\s+/gm, "• ")
        .replace(/^[\s]*\d+\.\s+/gm, "")
        // Remove task list markers
        .replace(/^[\s]*[-*+]\s+\[[x ]\]\s+/gm, "• ")
        // Convert horizontal rules to visual separator
        .replace(/^---+$/gm, "────────────────────────────────────────")
        // Clean up extra whitespace
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    );
  };

  const formatBold = () => insertText("**", "**", "bold text");
  const formatItalic = () => insertText("*", "*", "italic text");
  const formatCode = () => insertText("`", "`", "code");
  const formatCodeBlock = () => insertText("\n```\n", "\n```\n", "code block");
  const formatLink = () => insertText("[", "](url)", "link text");
  // Smart heading formatters that replace existing heading levels
  const formatHeading = (level: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    // If no text is selected, just insert a new heading
    if (!selectedText) {
      const headingPrefix = "\n" + "#".repeat(level) + " ";
      insertText(headingPrefix, "", `Heading ${level}`);
      return;
    }

    // Check if the selected text contains heading syntax
    const headingRegex = /^(\n?)#{1,6}\s*/;
    const match = selectedText.match(headingRegex);

    if (match) {
      // Remove existing heading syntax and replace with new level
      const cleanText = selectedText.replace(headingRegex, match[1]); // Keep any leading newline
      const newHeading = match[1] + "#".repeat(level) + " " + cleanText;

      // Replace the selected text with the new heading
      const replacement = newHeading;

      // Use the same method as insertText but with custom replacement
      textarea.focus();

      try {
        if (typeof InputEvent !== "undefined") {
          const deleteEvent = new InputEvent("beforeinput", {
            inputType: "deleteContentBackward",
            bubbles: true,
            cancelable: true,
          });
          textarea.dispatchEvent(deleteEvent);

          textarea.setSelectionRange(start, end);
          document.execCommand("delete", false);

          const insertEvent = new InputEvent("beforeinput", {
            inputType: "insertText",
            data: replacement,
            bubbles: true,
            cancelable: true,
          });

          if (textarea.dispatchEvent(insertEvent)) {
            document.execCommand("insertText", false, replacement);
            return;
          }
        }

        if (
          document.execCommand &&
          document.execCommand("insertText", false, replacement)
        ) {
          return;
        }
      } catch (error) {
        console.warn("Modern input methods failed, using fallback:", error);
      }

      // Fallback
      const newValue =
        textarea.value.substring(0, start) +
        replacement +
        textarea.value.substring(end);
      const inputEvent = new Event("input", { bubbles: true });
      textarea.value = newValue;
      textarea.dispatchEvent(inputEvent);
      setContent(newValue);

      setTimeout(() => {
        const newCursorPos = start + replacement.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // No existing heading, add heading to the selected text
      const headingPrefix = "#".repeat(level) + " ";
      insertText(headingPrefix, "", "");
    }
  };

  const formatHeading1 = () => formatHeading(1);
  const formatHeading2 = () => formatHeading(2);
  const formatHeading3 = () => formatHeading(3);
  const formatQuote = () => insertText("\n> ", "", "Quote text");
  const formatList = () => insertText("\n- ", "", "List item");
  const formatNumberedList = () => insertText("\n1. ", "", "Numbered item");
  const formatStrikethrough = () =>
    insertText("~~", "~~", "strikethrough text");
  const formatHorizontalLine = () => insertText("---", "", "");

  const formatTable = () => {
    const tableText =
      "\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n";
    insertText(tableText, "", "");
  };

  const handleCopyToClipboard = async () => {
    try {
      const plainText = stripMarkdown(displayContent);
      await navigator.clipboard.writeText(plainText);
      setIsCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = stripMarkdown(displayContent);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setIsCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveMarkdown = () => {
    try {
      // Create a blob with the markdown content
      const blob = new Blob([displayContent], {
        type: "text/markdown;charset=utf-8",
      });

      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);

      // Generate timestamp for unique filename
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);

      // Create a temporary anchor element and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `markdown-content-${timestamp}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the temporary URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error saving markdown file:", error);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      // First, try a simple PDF test
      console.log("Testing PDF library...");
      const testPdf = new jsPDF();
      testPdf.text("Test PDF", 10, 10);
      // Don't save the test PDF, just check if jsPDF works
      console.log("jsPDF library works");

      // Temporarily switch to preview mode if in edit or text mode
      const wasPreview = viewMode === "preview";
      console.log("Current view mode:", viewMode, "Was preview:", wasPreview);

      if (!wasPreview) {
        console.log("Switching to preview mode...");
        setViewMode("preview");
        // Wait longer for the DOM to update and render
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Check if previewRef is available after mode switch
      if (!previewRef.current) {
        console.error("Preview ref is null after mode switch");
        alert(
          "Unable to access preview content. Please switch to preview mode manually and try again."
        );
        return;
      }

      console.log("Preview ref found:", previewRef.current);
      console.log(
        "Element dimensions:",
        previewRef.current.offsetWidth,
        "x",
        previewRef.current.offsetHeight
      );

      // Test if html2canvas can see the element
      console.log("Testing html2canvas...");
      const testCanvas = document.createElement("canvas");
      testCanvas.width = 100;
      testCanvas.height = 100;
      const ctx = testCanvas.getContext("2d");
      ctx!.fillStyle = "red";
      ctx!.fillRect(0, 0, 100, 100);
      console.log("Canvas test successful");

      console.log("Starting html2canvas...");
      const canvas = await html2canvas(previewRef.current);

      console.log("Canvas created:", canvas.width, "x", canvas.height);

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas has zero dimensions");
      }

      const imgData = canvas.toDataURL("image/png");
      console.log("Image data length:", imgData.length);

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      console.log("Adding image to PDF, dimensions:", imgWidth, "x", imgHeight);
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      console.log("Saving PDF...");
      pdf.save("markdown-content.pdf");
      console.log("Markdown PDF saved successfully");

      // Restore original mode
      if (!wasPreview) {
        setViewMode("edit");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(
        `PDF generation failed: ${errorMessage}. Please try the browser's print function (Ctrl+P / Cmd+P).`
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 py-3 pr-3 flex flex-col flex-shrink-0 border-0">
        {/* Top row - Navigation and Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Back to Home Link */}
            <Link href="/">
              <button className="ml-3 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer">
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
                      const hasSubmenu = app.submenu && app.submenu.length > 0;
                      const isSubmenuOpen = openSubmenu === app.name;

                      return (
                        <div key={app.path}>
                          <button
                            onClick={() =>
                              handleAppSelect(app.path, hasSubmenu, app.name)
                            }
                            className="w-full px-4 py-3 text-left flex items-center justify-between transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <IconComponent sx={{ fontSize: 20 }} />
                              <span className="text-sm font-medium">
                                {app.name}
                              </span>
                            </div>
                            {hasSubmenu && (
                              <ExpandMoreIcon
                                sx={{
                                  fontSize: 16,
                                  transform: isSubmenuOpen
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                  transition: "transform 0.2s ease-in-out",
                                }}
                              />
                            )}
                          </button>
                          {hasSubmenu && isSubmenuOpen && app.submenu && (
                            <div className="bg-gray-50/90 backdrop-blur-sm border-t border-gray-200/50">
                              {app.submenu.map((subItem) => {
                                const SubIconComponent = subItem.icon;
                                return (
                                  <button
                                    key={subItem.path}
                                    onClick={() =>
                                      handleAppSelect(subItem.path)
                                    }
                                    className="w-full px-6 py-2 text-left flex items-center gap-3 transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                                  >
                                    <SubIconComponent sx={{ fontSize: 16 }} />
                                    <span className="text-sm">
                                      {subItem.name}
                                    </span>
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

            <h1 className="text-lg font-semibold text-gray-800">
              Markdown Editor
            </h1>
          </div>

          {/* View Mode Buttons - Desktop only */}
          <div className="hidden sm:flex items-center space-x-2">
            {/* View Mode Buttons */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode("edit")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                  viewMode === "edit"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <EditIcon sx={{ fontSize: 16 }} />
                Edit
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                  viewMode === "preview"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <VisibilityIcon sx={{ fontSize: 16 }} />
                Preview
              </button>
              <button
                onClick={() => setViewMode("text")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                  viewMode === "text"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <DescriptionIcon sx={{ fontSize: 16 }} />
                Text
              </button>
            </div>
            {/* Style selector - only shown in preview mode */}
            {viewMode === "preview" && (
              <>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={previewStyle}
                    onChange={(e) => setPreviewStyle(e.target.value)}
                    sx={{
                      height: 32,
                      fontSize: "0.875rem",
                      borderRadius: "6px",
                      backgroundColor: "white",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#d1d5db",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#6b7280",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#3b82f6",
                        borderWidth: "2px",
                      },
                      "& .MuiSelect-select": {
                        paddingY: "6px",
                        paddingX: "12px",
                        color: "#374151",
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: "8px",
                          boxShadow:
                            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                          border: "1px solid #e5e7eb",
                          mt: 0.5,
                        },
                      },
                    }}
                  >
                    <MenuItem
                      value="default"
                      sx={{
                        fontSize: "0.875rem",
                        "&:hover": {
                          backgroundColor: "#f3f4f6",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "#eff6ff",
                          "&:hover": {
                            backgroundColor: "#dbeafe",
                          },
                        },
                      }}
                    >
                      Claude
                    </MenuItem>
                    <MenuItem
                      value="newsprint"
                      sx={{
                        fontSize: "0.875rem",
                        "&:hover": {
                          backgroundColor: "#f3f4f6",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "#eff6ff",
                          "&:hover": {
                            backgroundColor: "#dbeafe",
                          },
                        },
                      }}
                    >
                      Newsprint
                    </MenuItem>
                    <MenuItem
                      value="monospaced"
                      sx={{
                        fontSize: "0.875rem",
                        "&:hover": {
                          backgroundColor: "#f3f4f6",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "#eff6ff",
                          "&:hover": {
                            backgroundColor: "#dbeafe",
                          },
                        },
                      }}
                    >
                      Monospaced
                    </MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            {/* Copy to Clipboard button - only shown in text mode */}
            {viewMode === "text" && (
              <button
                onClick={handleCopyToClipboard}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  isCopied
                    ? "bg-gray-200 text-gray-600 cursor-default"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800"
                }`}
                title={
                  isCopied ? "Text copied!" : "Copy plain text to clipboard"
                }
                disabled={isCopied}
              >
                {isCopied ? (
                  <>
                    <CheckIcon sx={{ fontSize: 18 }} />
                    Copied
                  </>
                ) : (
                  <>
                    <ContentCopyIcon sx={{ fontSize: 18 }} />
                    Copy Text
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleSaveMarkdown}
              className="ml-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 hover:text-gray-800 transition-colors flex items-center gap-2"
              title="Save as Markdown file"
            >
              <FileDownloadIcon sx={{ fontSize: 18 }} />
              Save MD
            </button>
            {/* Export PDF button - only shown in preview mode */}
            {viewMode === "preview" && (
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FileDownloadIcon sx={{ fontSize: 18 }} />
                {isExporting ? "Generating..." : "Export PDF"}
              </button>
            )}
          </div>
        </div>

        {/* Mobile View Mode Buttons - Mobile only */}
        <div className="sm:hidden mt-3 px-3 flex flex-wrap items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode("edit")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === "edit"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <EditIcon sx={{ fontSize: 16 }} />
              Edit
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === "preview"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <VisibilityIcon sx={{ fontSize: 16 }} />
              Preview
            </button>
            <button
              onClick={() => setViewMode("text")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === "text"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <DescriptionIcon sx={{ fontSize: 16 }} />
              Text
            </button>
          </div>

          {/* Mobile Export Buttons */}
          {viewMode === "preview" && (
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={previewStyle}
                onChange={(e) => setPreviewStyle(e.target.value)}
                sx={{
                  height: 32,
                  fontSize: "0.875rem",
                  borderRadius: "6px",
                  backgroundColor: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#d1d5db",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#6b7280",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#3b82f6",
                    borderWidth: "2px",
                  },
                  "& .MuiSelect-select": {
                    paddingY: "6px",
                    paddingX: "12px",
                    color: "#374151",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: "8px",
                      boxShadow:
                        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      border: "1px solid #e5e7eb",
                      mt: 0.5,
                    },
                  },
                }}
              >
                <MenuItem value="default" sx={{ fontSize: "0.875rem" }}>
                  Claude
                </MenuItem>
                <MenuItem value="newsprint" sx={{ fontSize: "0.875rem" }}>
                  Newsprint
                </MenuItem>
                <MenuItem value="monospaced" sx={{ fontSize: "0.875rem" }}>
                  Monospaced
                </MenuItem>
              </Select>
            </FormControl>
          )}

          {viewMode === "text" && (
            <button
              onClick={handleCopyToClipboard}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                isCopied
                  ? "bg-gray-200 text-gray-600 cursor-default"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800"
              }`}
              title={isCopied ? "Text copied!" : "Copy plain text to clipboard"}
              disabled={isCopied}
            >
              {isCopied ? (
                <CheckIcon sx={{ fontSize: 16 }} />
              ) : (
                <ContentCopyIcon sx={{ fontSize: 16 }} />
              )}
            </button>
          )}

          {viewMode !== "text" && (
            <button
              onClick={handleSaveMarkdown}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 hover:text-gray-800 transition-colors flex items-center gap-1"
              title="Save as Markdown file"
            >
              <FileDownloadIcon sx={{ fontSize: 16 }} />
              MD
            </button>
          )}

          {viewMode === "preview" && (
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FileDownloadIcon sx={{ fontSize: 16 }} />
              {isExporting ? "PDF..." : "PDF"}
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white flex-1 flex flex-col overflow-hidden">
        {/* WYSIWYG Toolbar - Only shown in edit mode */}
        {viewMode === "edit" && (
          <div className="border-b border-gray-200 p-3 bg-gray-50 flex-shrink-0">
            <div className="flex flex-wrap items-center gap-1">
              {/* Text Formatting */}
              <div className="flex items-center space-x-1 mr-3">
                <button
                  onClick={formatBold}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm font-bold"
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={formatItalic}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm italic"
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  onClick={formatStrikethrough}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm"
                  title="Strikethrough"
                >
                  <s>S</s>
                </button>
                <button
                  onClick={formatCode}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-xs font-mono"
                  title="Inline Code"
                >
                  {"</>"}
                </button>
              </div>

              <div className="h-6 w-px bg-gray-300 mr-3" />

              {/* Headings */}
              <div className="flex items-center space-x-1 mr-3">
                <button
                  onClick={formatHeading1}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm font-bold"
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  onClick={formatHeading2}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm font-bold"
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  onClick={formatHeading3}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm font-bold"
                  title="Heading 3"
                >
                  H3
                </button>
              </div>

              <div className="h-6 w-px bg-gray-300 mr-3" />

              {/* Lists and Structure */}
              <div className="flex items-center space-x-1 mr-3">
                <button
                  onClick={formatList}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm"
                  title="Bullet List"
                >
                  • List
                </button>
                <button
                  onClick={formatNumberedList}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm"
                  title="Numbered List"
                >
                  1. List
                </button>
                <button
                  onClick={formatQuote}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm"
                  title="Blockquote"
                >
                  ❝ Quote
                </button>
                <button
                  onClick={formatHorizontalLine}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm"
                  title="Horizontal Line"
                >
                  ─ HR
                </button>
              </div>

              <div className="h-6 w-px bg-gray-300 mr-3" />

              {/* Advanced */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={formatLink}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm"
                  title="Link"
                >
                  🔗 Link
                </button>
                <button
                  onClick={formatCodeBlock}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-xs font-mono"
                  title="Code Block"
                >
                  {"{ }"}
                </button>
                <button
                  onClick={formatTable}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded text-sm"
                  title="Table"
                >
                  ⊞ Table
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === "preview" && (
          <div
            ref={previewRef}
            className={`${getPreviewStyleClasses()} flex-1 overflow-auto`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent}
            </ReactMarkdown>
          </div>
        )}

        {viewMode === "text" && (
          <div className="p-6 max-w-none flex-1 overflow-auto">
            <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {stripMarkdown(displayContent)}
            </pre>
          </div>
        )}

        {viewMode === "edit" && (
          <textarea
            ref={textareaRef}
            value={displayContent}
            onChange={handleContentChange}
            onFocus={handleTextareaFocus}
            className="w-full p-6 resize-none border-none outline-none font-mono text-sm leading-6 text-black h-[95vh]"
            placeholder="Type your markdown here..."
            spellCheck={true}
          />
        )}
      </div>

      {/* Word count and stats */}
      <div className="px-4 py-2 text-sm text-gray-500 flex items-center justify-center space-x-4 border-t border-gray-200 flex-shrink-0">
        <span>Characters: {content.length}</span>
        <span>
          Words:{" "}
          {
            content
              .trim()
              .split(/\s+/)
              .filter((word) => word.length > 0).length
          }
        </span>
        <span>Lines: {content.split("\n").length}</span>
      </div>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

export default MarkdownEditor;
