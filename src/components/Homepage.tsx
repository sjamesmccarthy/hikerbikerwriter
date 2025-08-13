"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  EditNote as EditNoteIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  MenuBook as FieldNotesIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
  IntegrationInstructions as IntegrationInstructionsIcon,
} from "@mui/icons-material";
import { renderFooter } from "./shared/footerHelpers";
import WeatherWidget from "./WeatherWidget";

const Homepage: React.FC = () => {
  const [showAllButtons, setShowAllButtons] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showUtilitiesDropdown, setShowUtilitiesDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 640); // sm breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUtilitiesDropdown(false);
      }
    };

    if (showUtilitiesDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUtilitiesDropdown]);

  const utilityOptions = [
    {
      href: "/markdown",
      icon: <EditNoteIcon sx={{ fontSize: 16 }} />,
      label: "Markdown Editor",
    },
    {
      href: "/utilities/json-previewer",
      icon: <CodeIcon sx={{ fontSize: 16 }} />,
      label: "JSON Previewer",
    },
    {
      href: "/utilities/hex-rgb-converter",
      icon: <ColorIcon sx={{ fontSize: 16 }} />,
      label: "Hex/RGB Code",
    },
    {
      href: "/utilities/lorem-ipsum",
      icon: <TextIcon sx={{ fontSize: 16 }} />,
      label: "Lorem Ipsum Generator",
    },
    {
      href: "/utilities/network-tools",
      icon: <NetworkIcon sx={{ fontSize: 16 }} />,
      label: "Network Utilities",
    },
  ];

  const buttons = [
    {
      type: "dropdown" as const,
      icon: <IntegrationInstructionsIcon sx={{ fontSize: 18 }} />,
      label: "Dev Tools",
      options: utilityOptions,
    },
    {
      type: "link" as const,
      href: "/brewday",
      icon: <LogIcon sx={{ fontSize: 18 }} />,
      label: "Brew Log",
    },
    {
      type: "link" as const,
      href: "/rollandwrite",
      icon: <RollIcon sx={{ fontSize: 18 }} />,
      label: "Roll&Write",
    },
    {
      type: "link" as const,
      href: "/fieldnotes",
      icon: <FieldNotesIcon sx={{ fontSize: 18 }} />,
      label: "Field Notes",
    },
    {
      type: "link" as const,
      href: "/recipes",
      icon: <RestaurantIcon sx={{ fontSize: 18 }} />,
      label: "Recipes",
    },
    {
      type: "link" as const,
      href: "/jmgalleries",
      icon: <PhotoCameraIcon sx={{ fontSize: 18 }} />,
      label: "jM Galleries",
    },
  ];

  const getVisibleButtons = () => {
    if (showAllButtons) return buttons;
    return isDesktop ? buttons : buttons.slice(0, 5);
  };

  const visibleButtons = getVisibleButtons();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-500 to-blue-300 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center pt-16 px-8 pb-8 sm:p-8">
        <div className="w-[80vw] max-w-4xl flex flex-col items-center space-y-8">
          {/* Weather Widget - Centered Above Logo */}
          <div className="flex justify-center mb-4">
            <WeatherWidget />
          </div>

          {/* Centered Image */}
          <div className="relative w-full max-w-3xl">
            <Image
              src="/images/hikerbikerwriter.png?v=2"
              alt="Hiker Biker Writer"
              width={1200}
              height={1200}
              priority
              className="w-full h-auto"
            />
          </div>

          {/* Action Buttons */}
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {visibleButtons.map((button) => {
                if (button.type === "dropdown") {
                  return (
                    <div
                      key={button.label}
                      className="flex-1 relative"
                      ref={dropdownRef}
                    >
                      <button
                        onClick={() =>
                          setShowUtilitiesDropdown(!showUtilitiesDropdown)
                        }
                        className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm text-gray-700 rounded-md text-sm font-medium hover:bg-white hover:text-gray-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg border border-white/30 cursor-pointer"
                      >
                        {button.icon}
                        {button.label}
                        {showUtilitiesDropdown ? (
                          <ArrowUpIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <ArrowDownIcon sx={{ fontSize: 16 }} />
                        )}
                      </button>

                      {showUtilitiesDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
                          {button.options?.map((option) => (
                            <Link key={option.href} href={option.href}>
                              <div className="px-4 py-3 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2 text-gray-700 text-sm cursor-pointer border-b border-gray-100 last:border-b-0">
                                {option.icon}
                                {option.label}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <Link
                      key={button.href}
                      href={button.href}
                      className="flex-1"
                    >
                      <button className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm text-gray-700 rounded-md text-sm font-medium hover:bg-white hover:text-gray-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg border border-white/30 cursor-pointer">
                        {button.icon}
                        {button.label}
                      </button>
                    </Link>
                  );
                }
              })}
            </div>

            {/* Toggle Button - Only show on mobile when there are more than 5 buttons */}
            {!isDesktop && buttons.length > 5 && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setShowAllButtons(!showAllButtons)}
                  className="text-white/80 hover:text-white transition-all duration-200"
                >
                  {showAllButtons ? (
                    <ArrowUpIcon sx={{ fontSize: 32 }} />
                  ) : (
                    <ArrowDownIcon sx={{ fontSize: 32 }} />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter("homepage")}
    </div>
  );
};

export default Homepage;
