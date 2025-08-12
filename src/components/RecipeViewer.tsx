"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  Home as HomeIcon,
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
  userEmail?: string;
  date: string;
};

const RecipeViewer: React.FC = () => {
  const router = useRouter();
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);

  // Apps menu configuration
  const apps = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Md Editor", path: "/markdown", icon: EditNoteIcon },
    { name: "Brew Log", path: "/brewday", icon: LogIcon },
    { name: "Roll&Write", path: "/rollandwrite", icon: RollIcon },
    { name: "Field Notes", path: "/fieldnotes", icon: FieldNotesIcon },
    { name: "jM Galleries", path: "/jmgalleries", icon: PhotoCameraIcon },
  ];

  // Handle app selection from menu
  const handleAppSelect = (path: string) => {
    router.push(path);
    setIsAppsMenuOpen(false);
  };

  const [showFilters, setShowFilters] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeCookingType, setActiveCookingType] = useState<string>("All");
  const [activeCookTime, setActiveCookTime] = useState<string>("All");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
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
  const filteredRecipes = (Array.isArray(recipes) ? recipes : []).filter((recipe) => {
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

    return (
      categoryMatch &&
      cookingTypeMatch &&
      cookTimeMatch &&
      searchMatch &&
      favoriteMatch
    );
  });

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
                <button
                  onClick={() => signIn("google")}
                  className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                >
                  Sign in with Google
                </button>
              );
            }
            return (
              <div className="flex items-center gap-2">
                <span className="font-mono text-blue-600 text-sm">
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
                <button
                  onClick={() => signIn("google")}
                  className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                >
                  Sign in with Google
                </button>
              );
            }
            return (
              <div className="flex items-center gap-2">
                <span className="font-mono text-blue-600 text-sm">
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
                ) : (
                  <span className="text-black font-bold text-3xl">
                    {filteredRecipes.length}{" "}
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
          <div className="w-3/4 mx-auto">
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

                  {/* Category, Cooking Type, and Favorites filters */}
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
                                : type.charAt(0).toUpperCase() + type.slice(1)}
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

                    {/* Only show Favorites Only button for logged in users */}
                    {session?.user?.email && (
                      <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
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
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
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

                                {/* Public icon overlay - show for public recipes */}
                                {recipe.public && (
                                  <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                                    <PublicIcon
                                      sx={{ fontSize: 20, color: "gray" }}
                                    />
                                  </div>
                                )}

                                {/* Favorite button overlay - only show for logged in users */}
                                {session?.user?.email && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleFavorite(recipe.id);
                                    }}
                                    className={`absolute ${
                                      recipe.public ? "top-11" : "top-2"
                                    } right-2 w-8 h-8 rounded-full bg-white/80 hover:bg-white transition-colors cursor-pointer flex items-center justify-center`}
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

export default RecipeViewer;
