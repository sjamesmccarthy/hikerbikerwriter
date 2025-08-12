"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Apps as AppsIcon,
  EditNote as EditNoteIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  MenuBook as FieldNotesIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  Home as HomeIcon,
} from "@mui/icons-material";

interface AppItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ sx?: { fontSize: number } }>;
}

const apps: AppItem[] = [
  { name: "Home", path: "/", icon: HomeIcon },
  { name: "Md Editor", path: "/markdown", icon: EditNoteIcon },
  { name: "Brew Log", path: "/brewday", icon: LogIcon },
  { name: "Roll&Write", path: "/rollandwrite", icon: RollIcon },
  { name: "Field Notes", path: "/fieldnotes", icon: FieldNotesIcon },
  { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
  { name: "jM Galleries", path: "/jmgalleries", icon: PhotoCameraIcon },
];

const AppsMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Don't show the menu on pages that have integrated menus
  if (
    !pathname ||
    pathname === "/" ||
    pathname === "/markdown" ||
    pathname === "/brewday" ||
    pathname === "/rollandwrite" ||
    pathname === "/fieldnotes" ||
    pathname === "/jmgalleries" ||
    pathname.startsWith("/recipes")
  ) {
    return null;
  }

  const handleAppSelect = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50" style={{ marginTop: "16px" }}>
      <div className="relative">
        {/* Apps Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-md shadow-lg border border-white/30 hover:bg-white transition-all duration-200 text-gray-700 hover:text-gray-800 cursor-pointer"
          aria-label="Apps Menu"
          aria-expanded={isOpen}
        >
          <AppsIcon sx={{ fontSize: 24 }} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <button
              className="fixed inset-0 -z-10 cursor-default"
              onClick={() => setIsOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
              aria-label="Close menu"
              tabIndex={-1}
            />

            {/* Menu Content */}
            <div className="absolute top-full right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-md shadow-xl border border-white/30 min-w-[200px] overflow-hidden">
              {apps.map((app) => {
                const IconComponent = app.icon;
                const isCurrentPage = pathname === app.path;

                return (
                  <button
                    key={app.path}
                    onClick={() => handleAppSelect(app.path)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 cursor-pointer ${
                      isCurrentPage
                        ? "bg-teal-100 text-teal-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                    disabled={isCurrentPage}
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
    </div>
  );
};

export default AppsMenu;
