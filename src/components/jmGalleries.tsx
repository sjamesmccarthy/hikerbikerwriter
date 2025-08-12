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
    { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
    { name: "Field Notes", path: "/fieldnotes", icon: FieldNotesIcon },
  ];

  // Handle app selection from menu
  const handleAppSelect = (path: string) => {
    router.push(path);
    setIsAppsMenuOpen(false);
  };

  const [photos, setPhotos] = useState<{ title: string; file_name: string }[]>(
    []
  );
  const [dbError, setDbError] = useState<{
    message: string;
    database?: string;
    connectionInfo?: {
      host: string;
      database: string;
      user: string;
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPhotos() {
      try {
        setIsLoading(true);
        setDbError(null);
        const res = await fetch("/api/jmgalleries");

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        // Check if the response contains an error from the API
        if (data.error) {
          setDbError({
            message: data.error,
            database: data.database,
            connectionInfo: data.connectionInfo,
          });
          return;
        }

        setPhotos(data);
      } catch (error) {
        console.error("Database connection failed:", error);
        setDbError({
          message:
            error instanceof Error ? error.message : "Unknown database error",
        });
        setPhotos([]);
      } finally {
        setIsLoading(false);
      }
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
              className="text-blue-600 hover:underline text-base text-center flex items-center justify-center gap-2"
            >
              visit jM Galleries.com
              <OpenInNewOutlinedIcon sx={{ fontSize: 18 }} />
            </a>
          </div>

          {/* Database Error Display */}
          {dbError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Database Connection Error
                  </h3>
                </div>
              </div>
              <div className="ml-8">
                <p className="text-sm text-red-700">
                  Unable to load gallery images. Please try again later.
                </p>
                <p className="text-xs text-red-600 mt-2 font-mono">
                  Error: {dbError.message}
                </p>
                {dbError.database && (
                  <p className="text-xs text-red-600 mt-1">
                    <span className="font-semibold">Database:</span>{" "}
                    {dbError.database}
                  </p>
                )}
                {dbError.connectionInfo && (
                  <div className="text-xs text-red-600 mt-2">
                    <p>
                      <span className="font-semibold">Connection Details:</span>
                    </p>
                    <p className="ml-2">Host: {dbError.connectionInfo.host}</p>
                    <p className="ml-2">
                      Database: {dbError.connectionInfo.database}
                    </p>
                    <p className="ml-2">User: {dbError.connectionInfo.user}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !dbError && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading gallery...</span>
            </div>
          )}

          {/* Gallery Grid */}
          {!isLoading && !dbError && photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-5xl mx-auto mb-8">
              {photos.map((photo) => (
                <div
                  key={photo.file_name}
                  className="flex flex-col items-center"
                >
                  <Link
                    href={`https://jmgalleries.com/image/${photo.file_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src={`https://jmgalleries.com/view/__catalog/__thumbnail/${photo.file_name}.jpg`}
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
          )}

          {/* No Photos State */}
          {!isLoading && !dbError && photos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No gallery images available at the moment.
              </p>
            </div>
          )}
        </div>
      </div>
      {renderFooter("integrated")}
    </div>
  );
};

export default JmGalleries;
