"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JSONTree } from "react-json-tree";
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
  Clear as ClearIcon,
  Code as CodeIcon,
  FormatAlignLeft as FormatIcon,
  AccountTree as TreeIcon,
  Description as TextIcon,
  Apps as AppsIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  Home as HomeIcon,
  IntegrationInstructions as DevToolsIcon,
  ExpandMore as ExpandMoreIcon,
  ColorLens as ColorIcon,
  TextFields as TextFieldsIcon,
  NetworkCheck as NetworkIcon,
  MenuBook as FieldNotesIcon,
} from "@mui/icons-material";
import { renderFooter } from "./shared/footerHelpers";

interface AppMenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ sx?: object }>;
  submenu?: AppMenuItem[];
}

const JsonPreviewer: React.FC = () => {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [parsedJson, setParsedJson] = useState<object | null>(null);
  const [formattedJson, setFormattedJson] = useState("");
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "text">("tree");
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

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
        {
          name: "Lorem Ipsum",
          path: "/utilities/lorem-ipsum",
          icon: TextFieldsIcon,
        },
        {
          name: "Network Utilities",
          path: "/utilities/network-tools",
          icon: NetworkIcon,
        },
      ],
    },
    { name: "Brew Log", path: "/brewday", icon: LogIcon },
    { name: "Roll&Write", path: "/rollandwrite", icon: RollIcon },
    { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
    { name: "Field Notes", path: "/fieldnotes", icon: FieldNotesIcon },
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

  const formatJson = () => {
    try {
      if (!jsonInput.trim()) {
        setError("Please enter some JSON to format");
        setParsedJson(null);
        return;
      }

      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormattedJson(formatted);
      setParsedJson(parsed);
      setError("");
    } catch (err) {
      setError("Invalid JSON: " + (err as Error).message);
      setFormattedJson("");
      setParsedJson(null);
    }
  };

  const minifyJson = () => {
    try {
      if (!jsonInput.trim()) {
        setError("Please enter some JSON to minify");
        setParsedJson(null);
        setFormattedJson("");
        return;
      }

      const parsed = JSON.parse(jsonInput);
      const minified = JSON.stringify(parsed);
      setFormattedJson(minified);
      setParsedJson(parsed);
      setError("");
      setViewMode("text"); // Switch to text view to show minified output
    } catch (err) {
      setError("Invalid JSON: " + (err as Error).message);
      setFormattedJson("");
      setParsedJson(null);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const clearAll = () => {
    setJsonInput("");
    setFormattedJson("");
    setParsedJson(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex-1">
        {/* Header */}
        <div className="flex items-center space-x-2 h-[61px] border-b border-gray-200 px-3">
          <Link href="/">
            <button className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer">
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
                                  onClick={() => handleAppSelect(subItem.path)}
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

          <h3 className="text-lg font-semibold text-gray-800">
            JSON Previewer & Formatter
          </h3>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  JSON Input
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={formatJson}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    <FormatIcon sx={{ fontSize: 16 }} />
                    Format
                  </button>
                  <button
                    onClick={minifyJson}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    <CodeIcon sx={{ fontSize: 16 }} />
                    Minify
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    <ClearIcon sx={{ fontSize: 16 }} />
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Paste your JSON here... e.g., {"name": "John", "age": 30}'
                className="w-full p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ height: "80vh" }}
              />
            </div>

            {/* Output Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Formatted Output
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("tree")}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                      viewMode === "tree"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <TreeIcon sx={{ fontSize: 16 }} />
                    Tree
                  </button>
                  <button
                    onClick={() => setViewMode("text")}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                      viewMode === "text"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <TextIcon sx={{ fontSize: 16 }} />
                    Text
                  </button>
                  {formattedJson && (
                    <button
                      onClick={copyToClipboard}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                        copySuccess
                          ? "bg-green-600 text-white"
                          : "bg-gray-600 text-white hover:bg-gray-700"
                      }`}
                    >
                      <CopyIcon sx={{ fontSize: 16 }} />
                      {copySuccess ? "Copied!" : "Copy"}
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {viewMode === "tree" && parsedJson ? (
                <div
                  className="border border-gray-300 rounded-md p-4 bg-white overflow-auto font-mono text-sm"
                  style={{ height: "80vh" }}
                >
                  <JSONTree
                    data={parsedJson}
                    theme={{
                      scheme: "default",
                      base00: "#ffffff",
                      base01: "#f5f5f5",
                      base02: "#e0e0e0",
                      base03: "#9e9e9e",
                      base04: "#757575",
                      base05: "#424242",
                      base06: "#212121",
                      base07: "#000000",
                      base08: "#f44336",
                      base09: "#ff9800",
                      base0A: "#ffeb3b",
                      base0B: "#4caf50",
                      base0C: "#00bcd4",
                      base0D: "#2196f3",
                      base0E: "#9c27b0",
                      base0F: "#795548",
                    }}
                    invertTheme={false}
                    hideRoot={false}
                  />
                </div>
              ) : (
                <textarea
                  value={formattedJson}
                  readOnly
                  placeholder="Formatted JSON will appear here..."
                  className="w-full p-4 border border-gray-300 rounded-md font-mono text-sm resize-none bg-gray-50"
                  style={{ height: "80vh" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

export default JsonPreviewer;
