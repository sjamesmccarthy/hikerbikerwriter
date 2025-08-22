"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
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
  const { data: session } = useSession();
  const [showAllButtons, setShowAllButtons] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showUtilitiesDropdown, setShowUtilitiesDropdown] = useState(false);
  const [currentTemperature, setCurrentTemperature] = useState<number | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Function to calculate background color based on temperature
  const getTemperatureBackground = (temp: number): string => {
    console.log("Temperature received:", temp); // Debug log

    if (temp <= 64) {
      // Cold temps: dramatic gradient from deep blue to icy cyan
      const ratio = Math.max(0, Math.min(1, (temp + 60) / 119)); // normalize to 0-1
      const red1 = 0,
        green1 = 50,
        blue1 = 150; // Deep blue
      const red2 = 0,
        green2 = 200,
        blue2 = 255; // Bright cyan

      const midRed = Math.round(red1 + (red2 - red1) * ratio);
      const midGreen = Math.round(green1 + (green2 - green1) * ratio);
      const midBlue = Math.round(blue1 + (blue2 - blue1) * ratio);

      return `linear-gradient(135deg, rgb(${red1}, ${green1}, ${blue1}), rgb(${midRed}, ${midGreen}, ${midBlue}))`;
    } else if (temp <= 88) {
      // Moderate temps: dramatic gradient from royal blue to bright orange
      const ratio = (temp - 60) / 30; // normalize to 0-1
      const red1 = 30,
        green1 = 50,
        blue1 = 200; // Royal blue
      const red2 = 255,
        green2 = 100,
        blue2 = 0; // Bright orange

      const midRed = Math.round(red1 + (red2 - red1) * ratio);
      const midGreen = Math.round(green1 + (green2 - green1) * ratio);
      const midBlue = Math.round(blue1 + (blue2 - blue1) * ratio);

      console.log(
        `Temp: ${temp}, Ratio: ${ratio}, Colors: rgb(${red1},${green1},${blue1}) to rgb(${midRed},${midGreen},${midBlue})`
      );
      return `linear-gradient(135deg, rgb(${red1}, ${green1}, ${blue1}), rgb(${midRed}, ${midGreen}, ${midBlue}))`;
    } else {
      // Hot temps: dramatic gradient from bright red to bright yellow
      const ratio = Math.min(1, (temp - 86) / 14); // normalize to 0-1 over smaller range for more visible gradient
      const red1 = 255,
        green1 = 0,
        blue1 = 0; // Bright red
      const red2 = 255,
        green2 = 255,
        blue2 = 0; // Bright yellow

      const midRed = Math.round(red1 + (red2 - red1) * ratio);
      const midGreen = Math.round(green1 + (green2 - green1) * ratio);
      const midBlue = Math.round(blue1 + (blue2 - blue1) * ratio);

      console.log(
        `HOT TEMP: ${temp}, Ratio: ${ratio}, Start: rgb(${red1},${green1},${blue1}), End: rgb(${midRed},${midGreen},${midBlue})`
      );
      return `linear-gradient(135deg, rgb(${red1}, ${green1}, ${blue1}), rgb(${midRed}, ${midGreen}, ${midBlue}))`;
    }
  };

  // Handle temperature change from WeatherWidget
  const handleTemperatureChange = React.useCallback((temperature: number) => {
    setCurrentTemperature(temperature);
  }, []);

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

  // Get dynamic background style based on current temperature
  const backgroundStyle =
    currentTemperature !== null
      ? { background: getTemperatureBackground(currentTemperature) }
      : {
          background:
            "linear-gradient(135deg, rgb(30, 50, 200), rgb(100, 150, 255))",
        }; // Default gradient
  console.log("Background style being applied:", backgroundStyle);

  return (
    <div
      className="min-h-screen flex flex-col transition-all duration-1000"
      style={backgroundStyle}
    >
      {/* User Profile / Sign In - Upper Right Corner */}
      <div className="absolute top-16 right-16 z-10">
        {session?.user ? (
          <Link href="/user/profile">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user?.name || "User profile"}
                  width={32}
                  height={32}
                  className="rounded-full border border-gray-300"
                />
              )}
              {/* <span className="hidden sm:block text-sm font-medium text-gray-700">
                {session.user.name}
              </span> */}
            </div>
          </Link>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-white/30 hover:bg-white transition-all duration-200 text-sm font-medium text-gray-700 hover:text-gray-800 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53L2.18 16.93C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07L2.18 7.07C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
            </svg>
            <span className="hidden sm:inline">Sign In With Google</span>
            <span className="sm:hidden">Sign In</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center pt-16 px-8 pb-8 sm:p-8">
        <div className="w-[80vw] max-w-4xl flex flex-col items-center space-y-8">
          {/* Weather Widget - Centered Above Logo */}
          <div className="flex justify-center mb-4">
            <WeatherWidget onTemperatureChange={handleTemperatureChange} />
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
