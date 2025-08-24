"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowBack as ArrowBackIcon,
  FilterAltOutlined as FilterAltOutlinedIcon,
  DragHandleOutlined as DragHandleOutlinedIcon,
  Add as AddIcon,
  Restaurant as RestaurantIcon,
  LocalDining as LocalDiningIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  AccessTime as AccessTimeIcon,
  Edit as EditIcon,
  Public as PublicIcon,
  Dining as DinnerIcon,
  EmojiFoodBeverage as SideIcon,
  Cake as DessertIcon,
  FreeBreakfast as BreakfastIcon,
  ViewList as AllIcon,
  OutdoorGrill as OutdoorGrillIcon,
  GridOn as FlatTopIcon,
  Whatshot as GrillIcon,
  Schedule as QuickIcon,
  Timer as MediumIcon,
  HourglassEmpty as LongIcon,
  Apps as AppsIcon,
  EditNote as EditNoteIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  MenuBook as FieldNotesIcon,
  PhotoCamera as PhotoCameraIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  IntegrationInstructions as DevToolsIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
} from "@mui/icons-material";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  TextField,
} from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";
import { useSession, signIn, signOut } from "next-auth/react";

type Recipe = {
  id: number;
  slug: string;
  title: string;
  description: string;
  source?: string;
  type: "smoker" | "flat-top" | "grill";
  recommendedPellets?: string;
  categories: string[];
  photo?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  steps: Array<{
    step: string;
    temperature?: number;
    time?: number;
    superSmoke?: boolean;
  }>;
  myNotes?: string;
  author: string;
  favorite: boolean;
  public?: boolean;
  shared_family?: boolean | number;
  userEmail?: string;
  date: string;
};

interface AppMenuItem {
  name: string;
  path: string;
  icon?: React.ComponentType<{ sx?: { fontSize: number } }>;
  hasSubmenu?: boolean;
  submenu?: Array<{
    name: string;
    path: string;
    icon?: React.ComponentType<{ sx?: { fontSize: number } }>;
  }>;
}

interface RecipeViewerProps {
  headerOnly?: boolean;
}

const RecipeViewer: React.FC<RecipeViewerProps> = ({}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Apps menu configuration
  const apps: AppMenuItem[] = [
    { name: "Home", path: "/", icon: HomeIcon },
    {
      name: "Dev Tools",
      path: "/utilities",
      icon: DevToolsIcon,
      hasSubmenu: true,
      submenu: [
        { name: "Md Editor", path: "/markdown", icon: EditNoteIcon },
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
  const handleAppSelect = (path: string) => {
    router.push(path);
    setIsAppsMenuOpen(false);
    setOpenSubmenu(null);
  };

  const [showFilters, setShowFilters] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeCookingType, setActiveCookingType] = useState<string>("All");
  const [activeCookTime, setActiveCookTime] = useState<string>("All");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showPublicRecipes, setShowPublicRecipes] = useState(false);
  const [showFamilyOnly, setShowFamilyOnly] = useState(false);
  const [hasFamilyMembers, setHasFamilyMembers] = useState(false);
  const autoSwitchApplied = useRef(false);
  const [familyMembers, setFamilyMembers] = useState<
    Array<{ name: string; email: string; relationship: string }>
  >([]);
  const [selectedFamilyMember, setSelectedFamilyMember] =
    useState<string>("All");
  const [minimized, setMinimized] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const { data: session, status } = useSession();

  const categories = ["All", "Dinner", "Side", "Dessert", "Breakfast"];
  const cookingTypes = ["All", "smoker", "flat-top", "grill"];
  const cookTimes = [
    "All",
    "Quick (< 30 min)",
    "Medium (30-60 min)",
    "Long (> 1 hour)",
  ];

  const getCookTimeCategory = (totalMinutes: number): string => {
    if (totalMinutes < 30) return "Quick (< 30 min)";
    if (totalMinutes <= 60) return "Medium (30-60 min)";
    return "Long (> 1 hour)";
  };

  const handleImageError = (recipeId: number) => {
    setImageErrors((prev) => new Set([...prev, recipeId]));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "All":
        return <AllIcon sx={{ fontSize: 16, mr: 1 }} />;
      case "Dinner":
        return <DinnerIcon sx={{ fontSize: 16, mr: 1 }} />;
      case "Side":
        return <SideIcon sx={{ fontSize: 16, mr: 1 }} />;
      case "Dessert":
        return <DessertIcon sx={{ fontSize: 16, mr: 1 }} />;
      case "Breakfast":
        return <BreakfastIcon sx={{ fontSize: 16, mr: 1 }} />;
      default:
        return <RestaurantIcon sx={{ fontSize: 16, mr: 1 }} />;
    }
  };

  const getCookingTypeIcon = (type: string) => {
    switch (type) {
      case "All":
        return <AllIcon sx={{ fontSize: 16, mr: 1 }} />;
      case "smoker":
        return <OutdoorGrillIcon sx={{ fontSize: 16, mr: 1 }} />;
      case "flat-top":
        return <FlatTopIcon sx={{ fontSize: 16, mr: 1 }} />;
      case "grill":
        return <GrillIcon sx={{ fontSize: 16, mr: 1 }} />;
      default:
        return <RestaurantIcon sx={{ fontSize: 16, mr: 1 }} />;
    }
  };

  const getCookTimeIcon = (timeCategory: string) => {
    switch (timeCategory) {
      case "All":
        return <AllIcon sx={{ fontSize: 16, mr: 1 }} />;
      case "Quick (< 30 min)":
        return <QuickIcon sx={{ fontSize: 16, mr: 1 }} />;
      case "Medium (30-60 min)":
        return <MediumIcon sx={{ fontSize: 16, mr: 1 }} />;
      case "Long (> 1 hour)":
        return <LongIcon sx={{ fontSize: 16, mr: 1 }} />;
      default:
        return <AccessTimeIcon sx={{ fontSize: 16, mr: 1 }} />;
    }
  };

  useEffect(() => {
    async function fetchRecipes() {
      setLoadingRecipes(true);
      try {
        if (session?.user?.email) {
          // Fetch user's personal recipes when logged in
          const res = await fetch(
            `/api/recipes?userEmail=${encodeURIComponent(session.user.email)}`
          );
          const data = await res.json();
          setRecipes(Array.isArray(data) ? data : []);
        } else {
          // Fetch public recipes when not logged in
          const res = await fetch("/api/recipes");
          const data = await res.json();
          setRecipes(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching recipes:", error);
        setRecipes([]); // Set empty array on error
      }
      setLoadingRecipes(false);
    }

    if (session?.user?.email || status !== "loading") {
      fetchRecipes();
    }
  }, [session, status]);

  // Auto-enable public filter if user has no recipes
  useEffect(() => {
    if (
      session?.user?.email &&
      recipes.length > 0 &&
      !autoSwitchApplied.current
    ) {
      // Check if user has any of their own recipes
      const userRecipes = recipes.filter(
        (recipe) => recipe.userEmail === session.user?.email
      );
      if (userRecipes.length === 0) {
        setShowPublicRecipes(true);
        autoSwitchApplied.current = true;
      }
    }
  }, [recipes, session?.user?.email]);

  // Check if user has family members
  useEffect(() => {
    async function checkFamilyMembers() {
      if (session?.user?.email) {
        try {
          // Fetch family data to check if user has family members
          const res = await fetch(
            `/api/familyline?email=${encodeURIComponent(session.user.email)}`
          );
          if (res.ok) {
            const familyData = await res.json();
            // Parse the JSON data - it might be double-encoded
            let parsedJson = familyData?.json;
            if (typeof parsedJson === "string") {
              parsedJson = JSON.parse(parsedJson);
            }
            // Check if family data has people array with members
            const hasPeople =
              parsedJson?.people &&
              Array.isArray(parsedJson.people) &&
              parsedJson.people.length > 0;
            setHasFamilyMembers(hasPeople);

            // If user has family members, fetch the family members list
            if (hasPeople) {
              const membersRes = await fetch(
                `/api/family-members?email=${encodeURIComponent(
                  session.user.email
                )}`
              );
              if (membersRes.ok) {
                const members = await membersRes.json();
                setFamilyMembers(members);
              }
            }
          }
        } catch (error) {
          console.error("Error checking family members:", error);
          setHasFamilyMembers(false);
          setFamilyMembers([]);
        }
      } else {
        setHasFamilyMembers(false);
        setFamilyMembers([]);
      }
    }

    checkFamilyMembers();
  }, [session]);

  // Handle URL parameters for filters
  useEffect(() => {
    if (!searchParams) return;

    const familyParam = searchParams.get("family");
    const favoritesParam = searchParams.get("favorites");
    const familyMemberParam = searchParams.get("familyMember");

    if (familyParam === "true" && hasFamilyMembers) {
      setShowFamilyOnly(true);
      setShowFilters(true); // Open filters when family filter is triggered

      // Set the family member if specified in URL
      if (familyMemberParam && familyMembers.length > 0) {
        const memberExists = familyMembers.some(
          (member) => member.name === familyMemberParam
        );
        if (memberExists) {
          setSelectedFamilyMember(familyMemberParam);
        }
      }
    }

    if (favoritesParam === "true" && session?.user?.email) {
      setShowFavoritesOnly(true);
      setShowFilters(true); // Open filters when favorites filter is triggered
    }
  }, [searchParams, hasFamilyMembers, session?.user?.email, familyMembers]);

  // Helper function to update URL with filter parameters
  const updateURLWithFilters = (
    familyFilter: boolean,
    favoritesFilter: boolean,
    familyMember?: string
  ) => {
    const params = new URLSearchParams();
    if (familyFilter) {
      params.set("family", "true");
      if (familyMember && familyMember !== "All") {
        params.set("familyMember", familyMember);
      }
    }
    if (favoritesFilter) params.set("favorites", "true");

    const newURL = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newURL);
  };

  const toggleFavorite = async (recipeId: number) => {
    // Only allow favorite toggling when user is logged in
    if (!session?.user?.email) {
      // Could show a toast or modal here indicating they need to log in
      console.log("Please log in to favorite recipes");
      return;
    }

    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    try {
      const res = await fetch("/api/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...recipe,
          favorite: !recipe.favorite,
          userEmail: session?.user?.email,
        }),
      });

      if (res.ok) {
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === recipeId ? { ...r, favorite: !r.favorite } : r
          )
        );
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  };

  // Filter recipes - ensure recipes is always an array
  const filteredRecipes = (Array.isArray(recipes) ? recipes : []).filter(
    (recipe) => {
      const categoryMatch =
        activeCategory === "All" || recipe.categories.includes(activeCategory);
      const cookingTypeMatch =
        activeCookingType === "All" || recipe.type === activeCookingType;
      const totalTime = recipe.prepTime + recipe.cookTime;
      const cookTimeMatch =
        activeCookTime === "All" ||
        getCookTimeCategory(totalTime) === activeCookTime;
      const searchMatch =
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
      const favoriteMatch = !showFavoritesOnly || recipe.favorite;

      // Ownership filtering logic
      let ownershipMatch = true;
      if (!session?.user?.email) {
        // When not logged in, show only public recipes
        ownershipMatch = Boolean(recipe.public);
      } else {
        // When logged in
        if (showPublicRecipes) {
          // Show public recipes (excluding user's own unless they're also public)
          ownershipMatch = Boolean(recipe.public);
        } else if (showFamilyOnly) {
          // When showing family recipes, allow family shared recipes OR user's own recipes
          const isFamilyShared =
            recipe.shared_family === 1 || recipe.shared_family === true;
          const isUserOwned = recipe.userEmail === session.user.email;
          ownershipMatch = isFamilyShared || isUserOwned;
        } else {
          // Default: show only user's own recipes
          ownershipMatch = recipe.userEmail === session.user.email;
        }
      }

      let familyMatch = !showFamilyOnly;
      if (showFamilyOnly) {
        console.log("Family filtering for recipe:", recipe.title);
        console.log("Recipe shared_family:", recipe.shared_family);
        console.log("Recipe userEmail:", recipe.userEmail);
        console.log("selectedFamilyMember:", selectedFamilyMember);

        if (selectedFamilyMember === "All") {
          // Show all family recipes (recipes with shared_family enabled)
          familyMatch =
            recipe.shared_family === 1 || recipe.shared_family === true;
          console.log("Family match result (All):", familyMatch);
        } else {
          // Show recipes from the selected family member
          const selectedMemberData = familyMembers.find(
            (member) => member.name === selectedFamilyMember
          );
          console.log("selectedMemberData:", selectedMemberData);
          if (selectedMemberData) {
            familyMatch =
              (recipe.shared_family === 1 || recipe.shared_family === true) &&
              recipe.userEmail === selectedMemberData.email;
            console.log("Family match result (specific member):", familyMatch);
          } else {
            familyMatch = false;
            console.log("No member data found, familyMatch = false");
          }
        }
      }

      const finalResult =
        categoryMatch &&
        cookingTypeMatch &&
        cookTimeMatch &&
        searchMatch &&
        favoriteMatch &&
        ownershipMatch &&
        familyMatch;

      if (
        showFamilyOnly &&
        recipe.title === "Braised Chicken Tacos with Cracklins"
      ) {
        console.log("=== FINAL FILTER RESULTS FOR FAMILY RECIPE ===");
        console.log("categoryMatch:", categoryMatch);
        console.log("cookingTypeMatch:", cookingTypeMatch);
        console.log("cookTimeMatch:", cookTimeMatch);
        console.log("searchMatch:", searchMatch);
        console.log("favoriteMatch:", favoriteMatch);
        console.log("ownershipMatch:", ownershipMatch);
        console.log("familyMatch:", familyMatch);
        console.log("FINAL RESULT:", finalResult);
        console.log("===============================================");
      }

      return finalResult;
    }
  );

  const getTotalTime = (recipe: Recipe) => {
    return recipe.prepTime + recipe.cookTime;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
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
                    const hasSubmenu = app.hasSubmenu && app.submenu;
                    const isSubmenuOpen = openSubmenu === app.name;

                    return (
                      <div key={app.path}>
                        <button
                          onClick={() => {
                            if (hasSubmenu) {
                              setOpenSubmenu(isSubmenuOpen ? null : app.name);
                            } else {
                              handleAppSelect(app.path);
                            }
                          }}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                        >
                          {IconComponent && (
                            <IconComponent sx={{ fontSize: 20 }} />
                          )}
                          <span className="text-sm font-medium flex-1">
                            {app.name}
                          </span>
                          {hasSubmenu && (
                            <ExpandMoreIcon
                              sx={{
                                fontSize: 16,
                                transform: isSubmenuOpen
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                              }}
                            />
                          )}
                        </button>

                        {hasSubmenu && isSubmenuOpen && (
                          <div className="bg-gray-50 border-t border-gray-200">
                            {app.submenu?.map((subItem, index) => {
                              const SubIconComponent = subItem.icon;
                              return (
                                <button
                                  key={`${app.name}-${index}`}
                                  onClick={() => handleAppSelect(subItem.path)}
                                  className="w-full px-8 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200 cursor-pointer flex items-center gap-2"
                                >
                                  {SubIconComponent && (
                                    <SubIconComponent sx={{ fontSize: 16 }} />
                                  )}
                                  {subItem.name}
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

          <h3 className="text-lg font-semibold text-gray-800">Recipes</h3>
        </div>

        {/* Mobile Auth UI - Only visible on mobile */}
        <div className="sm:hidden px-3 py-2 border-b border-gray-200 flex justify-center">
          {(() => {
            if (status === "loading") {
              return (
                <span className="font-mono text-gray-500 text-sm">
                  Loading...
                </span>
              );
            }
            if (!session) {
              return (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 rounded bg-gray-600 text-white font-mono text-sm hover:bg-gray-700 transition"
                  >
                    Sign Up
                  </Link>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => signIn("google")}
                    className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                  >
                    Sign in with Google
                  </button>
                </div>
              );
            }
            return (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2 font-mono text-blue-600 text-sm">
                  {session.user?.image && (
                    <Link href="/user/profile">
                      <Image
                        src={session.user.image}
                        alt={session.user?.name || "User profile"}
                        width={28}
                        height={28}
                        className="rounded-full border border-gray-300 cursor-pointer hover:scale-105 transition"
                      />
                    </Link>
                  )}
                  Signed in as {session.user?.name}
                </span>
                <span className="h-4 w-px bg-gray-300 mx-2" />
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-mono text-sm hover:bg-gray-300 transition cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            );
          })()}
        </div>

        {/* Desktop Auth UI - Only visible on desktop */}
        <div className="hidden sm:flex mb-8 justify-end px-6 pt-6">
          {(() => {
            if (status === "loading") {
              return (
                <span className="font-mono text-gray-500 text-sm">
                  Loading...
                </span>
              );
            }
            if (!session) {
              return (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 rounded bg-gray-600 text-white font-mono text-sm hover:bg-gray-700 transition"
                  >
                    Sign Up
                  </Link>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => signIn("google")}
                    className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                  >
                    Sign in with Google
                  </button>
                </div>
              );
            }
            return (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2 font-mono text-blue-600 text-sm">
                  {session.user?.image && (
                    <Link href="/user/profile">
                      <Image
                        src={session.user.image}
                        alt={session.user?.name || "User profile"}
                        width={28}
                        height={28}
                        className="rounded-full border border-gray-300 cursor-pointer hover:scale-105 transition"
                      />
                    </Link>
                  )}
                  Signed in as {session.user?.name}
                </span>
                <span className="h-4 w-px bg-gray-300 mx-2" />
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-mono text-sm hover:bg-gray-300 transition cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            );
          })()}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col px-0 py-6">
          {/* Intro */}
          <div className="w-full px-6 mb-12 mt-0">
            <p className="text-gray-600 leading-relaxed font-mono text-center">
              <span className="text-2xl font-bold">
                a collection of{" "}
                {!session?.user?.email ? (
                  <span className="text-blue-600 font-bold text-3xl">
                    {filteredRecipes.length} Public{" "}
                  </span>
                ) : showPublicRecipes ? (
                  <span className="text-blue-600 font-bold text-3xl">
                    {filteredRecipes.length} Public{" "}
                  </span>
                ) : (
                  <span className="text-black font-bold text-3xl">
                    {filteredRecipes.length} Your{" "}
                  </span>
                )}
                recipes
              </span>{" "}
              <br />
              for grilling, smoking, and cooking from the kitchen to the
              backyard and beyond
            </p>
          </div>

          {/* Filter and Add Section */}
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Filter Icon Row */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  size="small"
                  sx={{
                    color: "gray",
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  <FilterAltOutlinedIcon />
                </IconButton>
                <IconButton
                  onClick={() => setMinimized(!minimized)}
                  size="small"
                  sx={{ color: "gray" }}
                  aria-label="Minimize List"
                >
                  <DragHandleOutlinedIcon />
                </IconButton>
              </div>
              {session && (
                <Link href="/recipes/builder">
                  <button className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition flex items-center gap-2">
                    <AddIcon sx={{ fontSize: 16 }} />
                    Add Recipe
                  </button>
                </Link>
              )}
            </div>

            {/* Filter Bar */}
            {showFilters && (
              <div
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left relative"
                style={{ zIndex: 1000 }}
              >
                <div className="flex flex-col gap-3">
                  {/* Search */}
                  <TextField
                    size="small"
                    label="Search recipes"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ minWidth: 200 }}
                  />

                  {/* Category, Cooking Type, and Filter buttons */}
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-4 items-center">
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={activeCategory}
                          label="Category"
                          open={openSelect === "category"}
                          onOpen={() => setOpenSelect("category")}
                          onClose={() => setOpenSelect(null)}
                          onChange={(e) => setActiveCategory(e.target.value)}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                zIndex: 10000,
                              },
                            },
                          }}
                        >
                          {categories.map((category) => (
                            <MenuItem key={category} value={category}>
                              <div className="flex items-center">
                                {getCategoryIcon(category)}
                                {category}
                              </div>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Cooking Type</InputLabel>
                        <Select
                          value={activeCookingType}
                          label="Cooking Type"
                          open={openSelect === "cookingType"}
                          onOpen={() => setOpenSelect("cookingType")}
                          onClose={() => setOpenSelect(null)}
                          onChange={(e) => setActiveCookingType(e.target.value)}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                zIndex: 10000,
                              },
                            },
                          }}
                        >
                          {cookingTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              <div className="flex items-center">
                                {getCookingTypeIcon(type)}
                                {type === "All"
                                  ? "All"
                                  : type.charAt(0).toUpperCase() +
                                    type.slice(1)}
                              </div>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Cook Time</InputLabel>
                        <Select
                          value={activeCookTime}
                          label="Cook Time"
                          open={openSelect === "cookTime"}
                          onOpen={() => setOpenSelect("cookTime")}
                          onClose={() => setOpenSelect(null)}
                          onChange={(e) => setActiveCookTime(e.target.value)}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                zIndex: 10000,
                              },
                            },
                          }}
                        >
                          {cookTimes.map((timeCategory) => (
                            <MenuItem key={timeCategory} value={timeCategory}>
                              <div className="flex items-center">
                                {getCookTimeIcon(timeCategory)}
                                {timeCategory}
                              </div>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>

                    {/* Right-aligned filter buttons */}
                    <div className="flex gap-2">
                      {/* Only show Favorites Only button for logged in users */}
                      {session?.user?.email && (
                        <button
                          onClick={() => {
                            const newFavorites = !showFavoritesOnly;
                            setShowFavoritesOnly(newFavorites);
                            updateURLWithFilters(
                              showFamilyOnly,
                              newFavorites,
                              selectedFamilyMember
                            );
                          }}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                            showFavoritesOnly
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {showFavoritesOnly ? (
                            <FavoriteIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <FavoriteBorderIcon sx={{ fontSize: 16 }} />
                          )}
                          Favorites Only
                        </button>
                      )}

                      {/* Public filter button for logged in users */}
                      {session?.user?.email && (
                        <button
                          onClick={() => {
                            setShowPublicRecipes(!showPublicRecipes);
                          }}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                            showPublicRecipes
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          <PublicIcon sx={{ fontSize: 16 }} />
                          Public
                        </button>
                      )}

                      {/* Family filters for logged in users with family members */}
                      {session?.user?.email && hasFamilyMembers && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newFamily = !showFamilyOnly;
                              setShowFamilyOnly(newFamily);
                              if (!newFamily) {
                                // Reset family member selection when turning off family filter
                                setSelectedFamilyMember("All");
                              }
                              updateURLWithFilters(
                                newFamily,
                                showFavoritesOnly,
                                newFamily ? selectedFamilyMember : undefined
                              );
                            }}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                              showFamilyOnly
                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                            }`}
                          >
                            <PeopleIcon sx={{ fontSize: 16 }} />
                            Family Only
                          </button>

                          {/* Family member select dropdown */}
                          {showFamilyOnly && familyMembers.length > 0 && (
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                              <InputLabel>Family Member</InputLabel>
                              <Select
                                value={selectedFamilyMember}
                                label="Family Member"
                                open={openSelect === "familyMember"}
                                onOpen={() => setOpenSelect("familyMember")}
                                onClose={() => setOpenSelect(null)}
                                onChange={(e) => {
                                  const newFamilyMember = e.target.value;
                                  setSelectedFamilyMember(newFamilyMember);
                                  updateURLWithFilters(
                                    showFamilyOnly,
                                    showFavoritesOnly,
                                    newFamilyMember
                                  );
                                }}
                                MenuProps={{
                                  PaperProps: {
                                    style: {
                                      zIndex: 10000,
                                    },
                                  },
                                }}
                              >
                                <MenuItem value="All">
                                  <div className="flex items-center">
                                    <PeopleIcon sx={{ fontSize: 16, mr: 1 }} />
                                    All Family
                                  </div>
                                </MenuItem>
                                {familyMembers.map((member) => (
                                  <MenuItem
                                    key={member.email}
                                    value={member.name}
                                  >
                                    <div className="flex items-center">
                                      <span>{member.name}</span>
                                      {member.relationship && (
                                        <span className="ml-2 text-xs text-gray-500">
                                          ({member.relationship})
                                        </span>
                                      )}
                                    </div>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recipes Grid */}
            {!minimized ? (
              <div className="w-full mb-8">
                {loadingRecipes ? (
                  <div className="text-center text-gray-400 font-mono py-8">
                    Loading recipes...
                  </div>
                ) : !session && filteredRecipes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="flex justify-center mb-4">
                      <RestaurantIcon sx={{ fontSize: 48, color: "#9CA3AF" }} />
                    </div>
                    <div className="text-gray-400 font-mono text-lg mb-4">
                      Public Recipes
                    </div>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      No public recipes available at the moment. Sign in to
                      create and share your own recipes.
                    </p>
                  </div>
                ) : filteredRecipes.length === 0 ? (
                  <div className="text-center">
                    <div className="bg-white border border-gray-200 rounded-xl p-8">
                      <RestaurantIcon
                        sx={{ fontSize: 48, color: "gray", mb: 2 }}
                      />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {!session ? "No public recipes yet" : "No recipes yet"}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {!session
                          ? "No public recipes available at the moment. Sign in to create and share your own recipes."
                          : "Start building your recipe collection!"}
                      </p>
                      {session && (
                        <Link href="/recipes/builder">
                          <button className="px-6 py-3 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition cursor-pointer">
                            Add Your First Recipe
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredRecipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 relative hover:scale-105"
                        >
                          {/* Edit button for logged in users - only show for their own recipes */}
                          {session &&
                            session.user?.email === recipe.userEmail && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  router.push(
                                    `/recipes/builder?edit=${recipe.id}`
                                  );
                                }}
                                className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/80 hover:bg-white transition-colors cursor-pointer flex items-center justify-center"
                                style={{ zIndex: 100 }}
                              >
                                <EditIcon
                                  sx={{ fontSize: 20, color: "gray" }}
                                />
                              </button>
                            )}

                          <Link href={`/recipes/${recipe.slug}`}>
                            <div className="cursor-pointer">
                              {/* Recipe Image */}
                              <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center">
                                {recipe.photo && !imageErrors.has(recipe.id) ? (
                                  <Image
                                    src={recipe.photo}
                                    alt={recipe.title}
                                    fill
                                    className="object-cover"
                                    onError={() => handleImageError(recipe.id)}
                                  />
                                ) : (
                                  <LocalDiningIcon
                                    sx={{ fontSize: 48, color: "#9CA3AF" }}
                                  />
                                )}

                                {/* Icons overlay - public, family and favorite */}
                                <div className="absolute top-2 right-2 flex items-center gap-1">
                                  {/* Family icon - show for family shared recipes */}
                                  {(recipe.shared_family === 1 ||
                                    recipe.shared_family === true) && (
                                    <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                                      <PeopleIcon
                                        sx={{ fontSize: 20, color: "#3b82f6" }}
                                      />
                                    </div>
                                  )}

                                  {/* Public icon - show for public recipes */}
                                  {recipe.public && (
                                    <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                                      <PublicIcon
                                        sx={{ fontSize: 20, color: "gray" }}
                                      />
                                    </div>
                                  )}

                                  {/* Favorite button - only show for logged in users */}
                                  {session?.user?.email && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFavorite(recipe.id);
                                      }}
                                      className="w-8 h-8 rounded-full bg-white/80 hover:bg-white transition-colors cursor-pointer flex items-center justify-center"
                                    >
                                      {recipe.favorite ? (
                                        <FavoriteIcon
                                          sx={{ fontSize: 20, color: "red" }}
                                        />
                                      ) : (
                                        <FavoriteBorderIcon
                                          sx={{ fontSize: 20, color: "gray" }}
                                        />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Recipe Info */}
                              <div className="p-4 flex flex-col">
                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] flex items-start uppercase">
                                  {recipe.title}
                                </h3>
                                <div className="w-full h-px bg-gray-200 mb-2"></div>
                                <div className="flex items-center text-sm text-gray-500 mt-auto">
                                  <AccessTimeIcon
                                    sx={{ fontSize: 16, mr: 0.5 }}
                                  />
                                  {formatTime(getTotalTime(recipe))} total
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full mb-8">
                {filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 text-left mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  >
                    <Link href={`/recipes/${recipe.slug}`} className="flex-1">
                      <span className="font-bold text-gray-900 font-mono text-base uppercase flex items-center gap-2">
                        {(recipe.shared_family === 1 ||
                          recipe.shared_family === true) && (
                          <PeopleIcon sx={{ fontSize: 16, color: "#3b82f6" }} />
                        )}
                        {recipe.public && (
                          <PublicIcon sx={{ fontSize: 16, color: "gray" }} />
                        )}
                        {recipe.title}
                      </span>
                    </Link>
                    <span className="text-sm text-gray-500 font-mono">
                      {formatTime(getTotalTime(recipe))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

// Utility function to generate recipe filter URLs - can be used by other components
// Examples:
// generateRecipeFilterURL({ family: true }) => "/recipes?family=true"
// generateRecipeFilterURL({ favorites: true }) => "/recipes?favorites=true"
// generateRecipeFilterURL({ family: true, favorites: true }) => "/recipes?family=true&favorites=true"
// generateRecipeFilterURL({ family: true, familyMember: "John Doe" }) => "/recipes?family=true&familyMember=John%20Doe"
// generateRecipeFilterURL({ family: true, basePath: "/custom-recipes" }) => "/custom-recipes?family=true"
export const generateRecipeFilterURL = (options: {
  family?: boolean;
  favorites?: boolean;
  familyMember?: string;
  basePath?: string;
}) => {
  const params = new URLSearchParams();
  if (options.family) {
    params.set("family", "true");
    if (options.familyMember && options.familyMember !== "All") {
      params.set("familyMember", options.familyMember);
    }
  }
  if (options.favorites) params.set("favorites", "true");

  const basePath = options.basePath || "/recipes";
  return params.toString() ? `${basePath}?${params.toString()}` : basePath;
};

export default RecipeViewer;
