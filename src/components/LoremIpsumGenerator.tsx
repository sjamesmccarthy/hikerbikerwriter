"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Apps as AppsIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  Home as HomeIcon,
  IntegrationInstructions as DevToolsIcon,
  NetworkCheck as NetworkIcon,
  ColorLens as ColorIcon,
  Code as JsonIcon,
  TextFields as LoremIcon,
  ExpandMore as ExpandMoreIcon,
  MenuBook as FieldNotesIcon,
} from "@mui/icons-material";
import { renderFooter } from "./shared/footerHelpers";

interface AppMenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ sx?: object }>;
  submenu?: AppMenuItem[];
}

const LoremIpsumGenerator: React.FC = () => {
  const router = useRouter();
  const [paragraphs, setParagraphs] = useState(3);
  const [sentences, setSentences] = useState(5);
  const [words, setWords] = useState(50);
  const [generationType, setGenerationType] = useState<
    "paragraphs" | "sentences" | "words"
  >("paragraphs");
  const [generatedText, setGeneratedText] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
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
        { name: "Md Editor", path: "/markdown", icon: JsonIcon },
        {
          name: "JSON Previewer",
          path: "/utilities/json-previewer",
          icon: JsonIcon,
        },
        {
          name: "Hex/RGB Code",
          path: "/utilities/hex-rgb-converter",
          icon: ColorIcon,
        },
        {
          name: "Lorem Ipsum",
          path: "/utilities/lorem-ipsum",
          icon: LoremIcon,
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

  const loremWords = [
    "lorem",
    "ipsum",
    "dolor",
    "sit",
    "amet",
    "consectetur",
    "adipiscing",
    "elit",
    "sed",
    "do",
    "eiusmod",
    "tempor",
    "incididunt",
    "nisi",
    "aliquip",
    "ex",
    "ea",
    "commodo",
    "consequat",
    "duis",
    "aute",
    "irure",
    "in",
    "reprehenderit",
    "voluptate",
    "velit",
    "esse",
    "cillum",
    "fugiat",
    "nulla",
    "pariatur",
    "excepteur",
    "sint",
    "occaecat",
    "cupidatat",
    "non",
    "proident",
    "sunt",
    "culpa",
    "qui",
    "officia",
    "deserunt",
    "mollit",
    "anim",
    "id",
    "est",
    "laborum",
    "sed",
    "ut",
    "perspiciatis",
    "unde",
    "omnis",
    "iste",
    "natus",
    "error",
    "voluptatem",
    "accusantium",
    "doloremque",
    "laudantium",
    "totam",
    "rem",
    "aperiam",
    "eaque",
    "ipsa",
    "quae",
    "ab",
    "illo",
    "inventore",
    "veritatis",
    "et",
    "quasi",
    "architecto",
    "beatae",
    "vitae",
    "dicta",
    "sunt",
    "explicabo",
    "nemo",
    "enim",
    "ipsam",
    "quia",
    "voluptas",
    "aspernatur",
    "aut",
    "odit",
    "fugit",
    "sed",
    "quia",
    "consequuntur",
    "magni",
    "dolores",
    "eos",
    "qui",
    "ratione",
    "sequi",
    "nesciunt",
    "neque",
    "porro",
    "quisquam",
    "est",
  ];

  const generateWords = (count: number): string => {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
    }
    return result.join(" ");
  };

  const generateSentence = (): string => {
    const wordCount = Math.floor(Math.random() * 10) + 5; // 5-14 words per sentence
    const sentence = generateWords(wordCount);
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
  };

  const generateParagraph = (): string => {
    const sentenceCount = Math.floor(Math.random() * 5) + 3; // 3-7 sentences per paragraph
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence());
    }
    return sentences.join(" ");
  };

  const generateText = () => {
    let result = "";

    switch (generationType) {
      case "paragraphs": {
        const paragraphArray = [];
        for (let i = 0; i < paragraphs; i++) {
          paragraphArray.push(generateParagraph());
        }
        result = paragraphArray.join("\n\n");
        break;
      }

      case "sentences": {
        const sentenceArray = [];
        for (let i = 0; i < sentences; i++) {
          sentenceArray.push(generateSentence());
        }
        result = sentenceArray.join(" ");
        break;
      }

      case "words":
        result = generateWords(words);
        break;
    }

    setGeneratedText(result);
  };

  // Discrete slider stops
  const paragraphStops = [1, 5, 10, 15, 20];
  const sentenceStops = [1, 2, 3, 4, 5, 10, 15, 20, 25];
  const wordStops = [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 100, 150, 200, 250, 350, 500,
  ];

  const nearestStop = (value: number, stops: number[]) => {
    let nearest = stops[0];
    let minDiff = Math.abs(value - nearest);
    for (let i = 1; i < stops.length; i++) {
      const diff = Math.abs(value - stops[i]);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = stops[i];
      }
    }
    return nearest;
  };

  const stopPercent = (stop: number, stops: number[]) => {
    const min = stops[0];
    const max = stops[stops.length - 1];
    if (max === min) return 0;
    return ((stop - min) / (max - min)) * 100;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const clearText = () => {
    setGeneratedText("");
  };

  // Generate initial text
  React.useEffect(() => {
    generateText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            Lorem Ipsum Generator
          </h3>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Settings
              </h2>

              {/* Generation Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Generation Type:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="paragraphs"
                      checked={generationType === "paragraphs"}
                      onChange={(e) =>
                        setGenerationType(e.target.value as "paragraphs")
                      }
                      className="mr-2"
                    />
                    Paragraphs
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="sentences"
                      checked={generationType === "sentences"}
                      onChange={(e) =>
                        setGenerationType(e.target.value as "sentences")
                      }
                      className="mr-2"
                    />
                    Sentences
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="words"
                      checked={generationType === "words"}
                      onChange={(e) =>
                        setGenerationType(e.target.value as "words")
                      }
                      className="mr-2"
                    />
                    Words
                  </label>
                </div>
              </div>

              {/* Count Controls */}
              {generationType === "paragraphs" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Paragraphs: {paragraphs}
                  </label>
                  <input
                    type="range"
                    min={paragraphStops[0]}
                    max={paragraphStops[paragraphStops.length - 1]}
                    value={paragraphs}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setParagraphs(nearestStop(val, paragraphStops));
                    }}
                    step={1}
                    list="paragraph-stops"
                    className="w-full"
                  />
                  <datalist id="paragraph-stops">
                    {paragraphStops.map((s) => (
                      <option key={`p-${s}`} value={s} />
                    ))}
                  </datalist>
                  <div className="relative mt-3 h-6">
                    {paragraphStops.map((s) => (
                      <span
                        key={`pl-${s}`}
                        style={{ left: `${stopPercent(s, paragraphStops)}%` }}
                        className={`absolute top-0 transform -translate-x-1/2 text-xs text-gray-500 ${
                          s === paragraphs ? "bg-gray-200 rounded px-1" : ""
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {generationType === "sentences" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Sentences: {sentences}
                  </label>
                  <input
                    type="range"
                    min={sentenceStops[0]}
                    max={sentenceStops[sentenceStops.length - 1]}
                    value={sentences}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setSentences(nearestStop(val, sentenceStops));
                    }}
                    step={1}
                    list="sentence-stops"
                    className="w-full"
                  />
                  <datalist id="sentence-stops">
                    {sentenceStops.map((s) => (
                      <option key={`s-${s}`} value={s} />
                    ))}
                  </datalist>
                  <div className="relative mt-3 h-6">
                    {sentenceStops.map((s) => (
                      <span
                        key={`sl-${s}`}
                        style={{ left: `${stopPercent(s, sentenceStops)}%` }}
                        className={`absolute top-0 transform -translate-x-1/2 text-xs text-gray-500 ${
                          s === sentences ? "bg-gray-200 rounded px-1" : ""
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {generationType === "words" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Words: {words}
                  </label>
                  <input
                    type="range"
                    min={wordStops[0]}
                    max={wordStops[wordStops.length - 1]}
                    value={words}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWords(nearestStop(val, wordStops));
                    }}
                    step={1}
                    list="word-stops"
                    className="w-full"
                  />
                  <datalist id="word-stops">
                    {wordStops.map((s) => (
                      <option key={`w-${s}`} value={s} />
                    ))}
                  </datalist>
                  <div className="relative mt-3 h-6">
                    {wordStops.map((s) => (
                      <span
                        key={`wl-${s}`}
                        style={{ left: `${stopPercent(s, wordStops)}%` }}
                        className={`absolute top-0 transform -translate-x-1/2 text-xs text-gray-500 ${
                          s === words ? "bg-gray-200 rounded px-1" : ""
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={generateText}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <RefreshIcon sx={{ fontSize: 16 }} />
                  Generate New Text
                </button>

                <div className="flex gap-3">
                  {(() => {
                    let copyBtnClasses =
                      "bg-gray-300 text-gray-500 cursor-not-allowed";
                    if (copySuccess) {
                      copyBtnClasses = "bg-green-600 text-white";
                    } else if (generatedText) {
                      copyBtnClasses =
                        "bg-gray-600 text-white hover:bg-gray-700";
                    }

                    return (
                      <button
                        onClick={copyToClipboard}
                        disabled={!generatedText}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${copyBtnClasses}`}
                      >
                        <CopyIcon sx={{ fontSize: 16 }} />
                        {copySuccess ? "Copied!" : "Copy Text"}
                      </button>
                    );
                  })()}

                  <button
                    onClick={clearText}
                    disabled={!generatedText}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      generatedText
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <ClearIcon sx={{ fontSize: 16 }} />
                    Clear Text
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Text */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Generated Text
              </h2>

              <textarea
                value={generatedText}
                readOnly
                placeholder="Generated lorem ipsum text will appear here..."
                className="w-full h-96 p-4 border border-gray-300 rounded-md text-sm resize-none bg-gray-50 leading-relaxed"
              />

              <div className="mt-4 text-sm text-gray-500">
                Characters: {generatedText.length} | Words:{" "}
                {generatedText.split(/\s+/).filter((w) => w).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

export default LoremIpsumGenerator;
