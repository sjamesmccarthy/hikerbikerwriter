"use client";

import React, { useState, useEffect } from "react";
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
} from "@mui/icons-material";
import { renderFooter } from "./shared/footerHelpers";
import WeatherWidget from "./WeatherWidget";

const Homepage: React.FC = () => {
  const [showAllButtons, setShowAllButtons] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 640); // sm breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const buttons = [
    {
      href: "/markdown",
      icon: <EditNoteIcon sx={{ fontSize: 18 }} />,
      label: "Md Editor",
    },
    {
      href: "/brewday",
      icon: <LogIcon sx={{ fontSize: 18 }} />,
      label: "Brew Log",
    },
    {
      href: "/rollandwrite",
      icon: <RollIcon sx={{ fontSize: 18 }} />,
      label: "Roll&Write",
    },
    {
      href: "/fieldnotes",
      icon: <FieldNotesIcon sx={{ fontSize: 18 }} />,
      label: "Field Notes",
    },
    {
      href: "/recipes",
      icon: <RestaurantIcon sx={{ fontSize: 18 }} />,
      label: "Recipes",
    },
    {
      href: "/jmgalleries",
      icon: <PhotoCameraIcon sx={{ fontSize: 18 }} />,
      label: "jM Galleries",
    },
  ];

  const getVisibleButtons = () => {
    if (showAllButtons) return buttons;
    return isDesktop ? buttons : buttons.slice(0, 4);
  };

  const visibleButtons = getVisibleButtons();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-500 to-blue-300 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-[80vw] max-w-4xl flex flex-col items-center space-y-8">
          {/* Weather Widget - Centered Above Logo */}
          <div className="flex justify-center mb-4">
            <WeatherWidget />
          </div>

          {/* Centered Image */}
          <div className="relative w-3/4 max-w-2xl">
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
              {visibleButtons.map((button) => (
                <Link key={button.href} href={button.href} className="flex-1">
                  <button className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm text-gray-700 rounded-md text-sm font-medium hover:bg-white hover:text-gray-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg border border-white/30 cursor-pointer">
                    {button.icon}
                    {button.label}
                  </button>
                </Link>
              ))}
            </div>

            {/* Toggle Button - Only show on mobile when there are more than 4 buttons */}
            {!isDesktop && buttons.length > 4 && (
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
