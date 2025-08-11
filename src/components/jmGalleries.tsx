"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { renderFooter } from "./shared/footerHelpers";
import {
  ArrowBack as ArrowBackIcon,
  Apps as AppsIcon,
  EditNote as EditNoteIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  MenuBook as FieldNotesIcon,
  Restaurant as RestaurantIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";

const JmGalleries: React.FC = () => {
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const router = useRouter();

  // Apps menu configuration
  const apps = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Md Editor", path: "/markdown", icon: EditNoteIcon },
    { name: "Brew Log", path: "/brewday", icon: LogIcon },
    { name: "Roll&Write", path: "/rollandwrite", icon: RollIcon },
    { name: "Field Notes", path: "/fieldnotes", icon: FieldNotesIcon },
    { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
  ];

  // Handle app selection from menu
  const handleAppSelect = (path: string) => {
    router.push(path);
    setIsAppsMenuOpen(false);
  };

  const [photos, setPhotos] = useState<{ title: string; file_name: string }[]>(
    []
  );
  useEffect(() => {
    async function fetchPhotos() {
      const res = await fetch("/api/jmgalleries");
      const data = await res.json();
      setPhotos(data);
    }
    fetchPhotos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="">
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
                  onClick={() => setIsAppsMenuOpen(false)}
                  aria-label="Close menu"
                  tabIndex={-1}
                />
                <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-sm rounded-md shadow-xl border border-white/30 min-w-[200px] overflow-hidden z-50">
                  {apps.map((app) => {
                    const IconComponent = app.icon;
                    return (
                      <button
                        key={app.path}
                        onClick={() => handleAppSelect(app.path)}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                      >
                        <IconComponent sx={{ fontSize: 20 }} />
                        <span className="text-sm font-medium">{app.name}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-gray-300" />

          <h3 className="text-lg font-semibold text-gray-800">jM Galleries</h3>
        </div>

        <div className="max-xl bg-white flex-1 flex flex-col justify-center items-center">
          <h1 className="text-3xl font-bold text-center mt-12 mb-4">
            jM Galleries
          </h1>
          <h2 className="text-lg text-gray-600 text-center mb-4">
            Everyday Fine Art, Portraits, Weddings, Real Estate and Lifestyle
            Photography
          </h2>
          <div className="mb-8">
            <a
              href="https://jmgalleries.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-base text-center block flex items-center justify-center gap-2"
            >
              visit jM Galleries.com
              <OpenInNewOutlinedIcon sx={{ fontSize: 18 }} />
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-5xl mx-auto mb-8">
            {photos.map((photo) => (
              <div key={photo.file_name} className="flex flex-col items-center">
                <Link
                  href={`https://jmgalleries.com/image/${photo.file_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={`/gallery-thumbnails/${photo.file_name}.jpg`}
                    alt={photo.title}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover rounded-lg shadow"
                  />
                </Link>
                <span className="mt-2 text-sm text-gray-700 text-center">
                  {photo.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {renderFooter("integrated")}
    </div>
  );
};

export default JmGalleries;
