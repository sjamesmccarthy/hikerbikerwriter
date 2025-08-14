"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
  ColorLens as ColorIcon,
  Apps as AppsIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  Home as HomeIcon,
  IntegrationInstructions as DevToolsIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  TextFields as TextIcon,
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

const HexRgbConverter: React.FC = () => {
  const router = useRouter();
  const [hexValue, setHexValue] = useState("#FF6B6B");
  const [rgbValue, setRgbValue] = useState("255, 107, 107");
  const [hslValue, setHslValue] = useState("0, 71%, 71%");
  const [copySuccess, setCopySuccess] = useState<string>("");
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  // Tooltip state for swatch copy
  const [swatchTooltip, setSwatchTooltip] = useState<{
    hex: string;
    idx: number;
  } | null>(null);
  const swatchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return (
      "#" +
      ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number, s: number;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
        default:
          h = 0;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const updateFromHex = (hex: string) => {
    setHexValue(hex);
    const rgb = hexToRgb(hex);
    if (rgb) {
      setRgbValue(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setHslValue(`${hsl.h}, ${hsl.s}%, ${hsl.l}%`);
    }
  };

  const updateFromRgb = (rgbString: string) => {
    const values = rgbString.split(",").map((v) => parseInt(v.trim()));
    if (
      values.length === 3 &&
      values.every((v) => !isNaN(v) && v >= 0 && v <= 255)
    ) {
      const [r, g, b] = values;
      setRgbValue(`${r}, ${g}, ${b}`);
      setHexValue(rgbToHex(r, g, b));
      const hsl = rgbToHsl(r, g, b);
      setHslValue(`${hsl.h}, ${hsl.s}%, ${hsl.l}%`);
    }
  };

  const copyToClipboard = async (value: string, type: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Swatch click handler with tooltip
  const handleSwatchClick = async (hex: string, idx: number) => {
    updateFromHex(hex);
    try {
      await navigator.clipboard.writeText(hex);
      setSwatchTooltip({ hex, idx });
      if (swatchTimeoutRef.current) clearTimeout(swatchTimeoutRef.current);
      swatchTimeoutRef.current = setTimeout(() => setSwatchTooltip(null), 3000);
    } catch (err) {
      // fallback: no tooltip
      setSwatchTooltip(null);
    }
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
            Hex/RGB Color Converter
          </h3>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Color Picker & Display */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Color Picker
              </h2>

              {/* Large Color Display */}
              <div
                className="w-full h-40 rounded-lg border-2 border-gray-300 mb-4 shadow-inner"
                style={{ backgroundColor: hexValue }}
              ></div>

              {/* Native Color Picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pick a Color:
                </label>
                <input
                  type="color"
                  value={hexValue}
                  onChange={(e) => updateFromHex(e.target.value)}
                  className="w-full h-12 rounded border border-gray-300 cursor-pointer"
                />
              </div>
            </div>

            {/* Color Values */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Color Values
              </h2>

              {/* HEX */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HEX Value:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hexValue}
                    onChange={(e) => updateFromHex(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="#FF6B6B"
                  />
                  <button
                    onClick={() => copyToClipboard(hexValue, "hex")}
                    className={`flex items-center gap-1 px-3 py-2 rounded text-sm transition-colors ${
                      copySuccess === "hex"
                        ? "bg-green-600 text-white"
                        : "bg-gray-600 text-white hover:bg-gray-700"
                    }`}
                  >
                    <CopyIcon sx={{ fontSize: 16 }} />
                    {copySuccess === "hex" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* RGB */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RGB Value:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rgbValue}
                    onChange={(e) => updateFromRgb(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="255, 107, 107"
                  />
                  <button
                    onClick={() => copyToClipboard(`rgb(${rgbValue})`, "rgb")}
                    className={`flex items-center gap-1 px-3 py-2 rounded text-sm transition-colors ${
                      copySuccess === "rgb"
                        ? "bg-green-600 text-white"
                        : "bg-gray-600 text-white hover:bg-gray-700"
                    }`}
                  >
                    <CopyIcon sx={{ fontSize: 16 }} />
                    {copySuccess === "rgb" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  CSS: rgb({rgbValue})
                </p>
              </div>

              {/* HSL */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HSL Value:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hslValue}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(`hsl(${hslValue})`, "hsl")}
                    className={`flex items-center gap-1 px-3 py-2 rounded text-sm transition-colors ${
                      copySuccess === "hsl"
                        ? "bg-green-600 text-white"
                        : "bg-gray-600 text-white hover:bg-gray-700"
                    }`}
                  >
                    <CopyIcon sx={{ fontSize: 16 }} />
                    {copySuccess === "hsl" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  CSS: hsl({hslValue})
                </p>
              </div>
            </div>
          </div>

          {/* Material Design Color Palette */}

          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-5 sm:grid-cols-10 relative">
              {/* Red Colors */}
              {[
                { shade: "50", hex: "#FFEBEE" },
                { shade: "100", hex: "#FFCDD2" },
                { shade: "200", hex: "#EF9A9A" },
                { shade: "300", hex: "#E57373" },
                { shade: "400", hex: "#EF5350" },
                { shade: "500", hex: "#F44336" },
                { shade: "600", hex: "#E53935" },
                { shade: "700", hex: "#D32F2F" },
                { shade: "800", hex: "#C62828" },
                { shade: "900", hex: "#B71C1C" },
              ].map((color, idx) => (
                <div
                  key={`red-${color.shade}`}
                  className="relative flex items-center justify-center"
                >
                  <button
                    onClick={() => handleSwatchClick(color.hex, idx)}
                    className="h-12 w-full transition-all hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    title={`Red ${color.shade} - ${color.hex}`}
                  />
                  {swatchTooltip &&
                    swatchTooltip.hex === color.hex &&
                    swatchTooltip.idx === idx && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 shadow z-50 whitespace-nowrap pointer-events-none animate-fade-in">
                        {color.hex} <span className="ml-1">Copied</span>
                      </div>
                    )}
                </div>
              ))}

              {/* Pink Colors */}
              {[
                { shade: "50", hex: "#FCE4EC" },
                { shade: "100", hex: "#F8BBD9" },
                { shade: "200", hex: "#F48FB1" },
                { shade: "300", hex: "#F06292" },
                { shade: "400", hex: "#EC407A" },
                { shade: "500", hex: "#E91E63" },
                { shade: "600", hex: "#D81B60" },
                { shade: "700", hex: "#C2185B" },
                { shade: "800", hex: "#AD1457" },
                { shade: "900", hex: "#880E4F" },
              ].map((color, idx) => (
                <div
                  key={`pink-${color.shade}`}
                  className="relative flex items-center justify-center"
                >
                  <button
                    onClick={() => handleSwatchClick(color.hex, idx + 10)}
                    className="h-12 w-full transition-all hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    title={`Pink ${color.shade} - ${color.hex}`}
                  />
                  {swatchTooltip &&
                    swatchTooltip.hex === color.hex &&
                    swatchTooltip.idx === idx + 10 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 shadow z-50 whitespace-nowrap pointer-events-none animate-fade-in">
                        {color.hex} <span className="ml-1">Copied</span>
                      </div>
                    )}
                </div>
              ))}

              {/* Purple Colors */}
              {[
                { shade: "50", hex: "#F3E5F5" },
                { shade: "100", hex: "#E1BEE7" },
                { shade: "200", hex: "#CE93D8" },
                { shade: "300", hex: "#BA68C8" },
                { shade: "400", hex: "#AB47BC" },
                { shade: "500", hex: "#9C27B0" },
                { shade: "600", hex: "#8E24AA" },
                { shade: "700", hex: "#7B1FA2" },
                { shade: "800", hex: "#6A1B9A" },
                { shade: "900", hex: "#4A148C" },
              ].map((color, idx) => (
                <div
                  key={`purple-${color.shade}`}
                  className="relative flex items-center justify-center"
                >
                  <button
                    onClick={() => handleSwatchClick(color.hex, idx + 20)}
                    className="h-12 w-full transition-all hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    title={`Purple ${color.shade} - ${color.hex}`}
                  />
                  {swatchTooltip &&
                    swatchTooltip.hex === color.hex &&
                    swatchTooltip.idx === idx + 20 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 shadow z-50 whitespace-nowrap pointer-events-none animate-fade-in">
                        {color.hex} <span className="ml-1">Copied</span>
                      </div>
                    )}
                </div>
              ))}

              {/* Indigo Colors */}
              {[
                { shade: "50", hex: "#E8EAF6" },
                { shade: "100", hex: "#C5CAE9" },
                { shade: "200", hex: "#9FA8DA" },
                { shade: "300", hex: "#7986CB" },
                { shade: "400", hex: "#5C6BC0" },
                { shade: "500", hex: "#3F51B5" },
                { shade: "600", hex: "#3949AB" },
                { shade: "700", hex: "#303F9F" },
                { shade: "800", hex: "#283593" },
                { shade: "900", hex: "#1A237E" },
              ].map((color, idx) => (
                <div
                  key={`indigo-${color.shade}`}
                  className="relative flex items-center justify-center"
                >
                  <button
                    onClick={() => handleSwatchClick(color.hex, idx + 30)}
                    className="h-12 w-full transition-all hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    title={`Indigo ${color.shade} - ${color.hex}`}
                  />
                  {swatchTooltip &&
                    swatchTooltip.hex === color.hex &&
                    swatchTooltip.idx === idx + 30 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 shadow z-50 whitespace-nowrap pointer-events-none animate-fade-in">
                        {color.hex} <span className="ml-1">Copied</span>
                      </div>
                    )}
                </div>
              ))}

              {/* Blue Colors */}
              {[
                { shade: "50", hex: "#E3F2FD" },
                { shade: "100", hex: "#BBDEFB" },
                { shade: "200", hex: "#90CAF9" },
                { shade: "300", hex: "#64B5F6" },
                { shade: "400", hex: "#42A5F5" },
                { shade: "500", hex: "#2196F3" },
                { shade: "600", hex: "#1E88E5" },
                { shade: "700", hex: "#1976D2" },
                { shade: "800", hex: "#1565C0" },
                { shade: "900", hex: "#0D47A1" },
              ].map((color, idx) => (
                <div
                  key={`blue-${color.shade}`}
                  className="relative flex items-center justify-center"
                >
                  <button
                    onClick={() => handleSwatchClick(color.hex, idx + 40)}
                    className="h-12 w-full transition-all hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    title={`Blue ${color.shade} - ${color.hex}`}
                  />
                  {swatchTooltip &&
                    swatchTooltip.hex === color.hex &&
                    swatchTooltip.idx === idx + 40 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 shadow z-50 whitespace-nowrap pointer-events-none animate-fade-in">
                        {color.hex} <span className="ml-1">Copied</span>
                      </div>
                    )}
                </div>
              ))}

              {/* Teal Colors */}
              {[
                { shade: "50", hex: "#E0F2F1" },
                { shade: "100", hex: "#B2DFDB" },
                { shade: "200", hex: "#80CBC4" },
                { shade: "300", hex: "#4DB6AC" },
                { shade: "400", hex: "#26A69A" },
                { shade: "500", hex: "#009688" },
                { shade: "600", hex: "#00897B" },
                { shade: "700", hex: "#00796B" },
                { shade: "800", hex: "#00695C" },
                { shade: "900", hex: "#004D40" },
              ].map((color, idx) => (
                <div
                  key={`teal-${color.shade}`}
                  className="relative flex items-center justify-center"
                >
                  <button
                    onClick={() => handleSwatchClick(color.hex, idx + 50)}
                    className="h-12 w-full transition-all hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    title={`Teal ${color.shade} - ${color.hex}`}
                  />
                  {swatchTooltip &&
                    swatchTooltip.hex === color.hex &&
                    swatchTooltip.idx === idx + 50 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 shadow z-50 whitespace-nowrap pointer-events-none animate-fade-in">
                        {color.hex} <span className="ml-1">Copied</span>
                      </div>
                    )}
                </div>
              ))}

              {/* Green Colors */}
              {[
                { shade: "50", hex: "#E8F5E8" },
                { shade: "100", hex: "#C8E6C9" },
                { shade: "200", hex: "#A5D6A7" },
                { shade: "300", hex: "#81C784" },
                { shade: "400", hex: "#66BB6A" },
                { shade: "500", hex: "#4CAF50" },
                { shade: "600", hex: "#43A047" },
                { shade: "700", hex: "#388E3C" },
                { shade: "800", hex: "#2E7D32" },
                { shade: "900", hex: "#1B5E20" },
              ].map((color, idx) => (
                <div
                  key={`green-${color.shade}`}
                  className="relative flex items-center justify-center"
                >
                  <button
                    onClick={() => handleSwatchClick(color.hex, idx + 60)}
                    className="h-12 w-full transition-all hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    title={`Green ${color.shade} - ${color.hex}`}
                  />
                  {swatchTooltip &&
                    swatchTooltip.hex === color.hex &&
                    swatchTooltip.idx === idx + 60 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 shadow z-50 whitespace-nowrap pointer-events-none animate-fade-in">
                        {color.hex} <span className="ml-1">Copied</span>
                      </div>
                    )}
                </div>
              ))}

              {/* Orange Colors */}
              {[
                { shade: "50", hex: "#FFF3E0" },
                { shade: "100", hex: "#FFE0B2" },
                { shade: "200", hex: "#FFCC80" },
                { shade: "300", hex: "#FFB74D" },
                { shade: "400", hex: "#FFA726" },
                { shade: "500", hex: "#FF9800" },
                { shade: "600", hex: "#FB8C00" },
                { shade: "700", hex: "#F57C00" },
                { shade: "800", hex: "#EF6C00" },
                { shade: "900", hex: "#E65100" },
              ].map((color, idx) => (
                <div
                  key={`orange-${color.shade}`}
                  className="relative flex items-center justify-center"
                >
                  <button
                    onClick={() => handleSwatchClick(color.hex, idx + 70)}
                    className="h-12 w-full transition-all hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    title={`Orange ${color.shade} - ${color.hex}`}
                  />
                  {swatchTooltip &&
                    swatchTooltip.hex === color.hex &&
                    swatchTooltip.idx === idx + 70 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 shadow z-50 whitespace-nowrap pointer-events-none animate-fade-in">
                        {color.hex} <span className="ml-1">Copied</span>
                      </div>
                    )}
                </div>
              ))}

              {/* Gray Colors */}
              {[
                { shade: "50", hex: "#FAFAFA" },
                { shade: "100", hex: "#F5F5F5" },
                { shade: "200", hex: "#EEEEEE" },
                { shade: "300", hex: "#E0E0E0" },
                { shade: "400", hex: "#BDBDBD" },
                { shade: "500", hex: "#9E9E9E" },
                { shade: "600", hex: "#757575" },
                { shade: "700", hex: "#616161" },
                { shade: "800", hex: "#424242" },
                { shade: "900", hex: "#212121" },
              ].map((color, idx) => (
                <div
                  key={`gray-${color.shade}`}
                  className="relative flex items-center justify-center"
                >
                  <button
                    onClick={() => handleSwatchClick(color.hex, idx + 80)}
                    className="h-12 w-full transition-all hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    title={`Gray ${color.shade} - ${color.hex}`}
                  />
                  {swatchTooltip &&
                    swatchTooltip.hex === color.hex &&
                    swatchTooltip.idx === idx + 80 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 shadow z-50 whitespace-nowrap pointer-events-none animate-fade-in">
                        {color.hex} <span className="ml-1">Copied</span>
                      </div>
                    )}
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-gray-600">
              <p className="mb-2">
                <strong>Click any color</strong> to use it in the converter
                above.
              </p>
              <p>
                These colors follow the Material Design color system with
                consistent shades from 50 (lightest) to 900 (darkest).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

export default HexRgbConverter;
