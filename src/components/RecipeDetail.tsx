"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  AccessTime as AccessTimeIcon,
  LocalDining as LocalDiningIcon,
  Thermostat as ThermostatIcon,
  Timer as TimerIcon,
  Whatshot as WhatshotIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Print as PrintIcon,
  PictureAsPdf as PictureAsPdfIcon,
  OutdoorGrill as OutdoorGrillIcon,
  Flatware as FlatwareIcon,
  Edit as EditIcon,
  Public as PublicIcon,
  ArrowCircleLeft as ArrowCircleLeftIcon,
  ArrowCircleRight as ArrowCircleRightIcon,
  Apps as AppsIcon,
  Home as HomeIcon,
  EditNote as EditNoteIcon,
  Assignment as LogIcon,
  MenuBook as FieldNotesIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  IntegrationInstructions as DevToolsIcon,
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
  Casino as RollIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Slider,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";
import { useSession } from "next-auth/react";

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
  date: string;
  shared_family?: boolean;
};

interface RecipeDetailProps {
  slug: string;
}

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

const RecipeDetail: React.FC<RecipeDetailProps> = ({ slug }) => {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(1);
  const [makeModeOpen, setMakeModeOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { data: session } = useSession();

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
    { name: "Roll&Write", path: "/rollandwrite", icon: RollIcon },
    { name: "Brew Log", path: "/brewday", icon: LogIcon },
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

  // Function to convert decimal to fraction with Unicode characters
  const formatAmountAsFraction = (amount: number): string => {
    if (amount === 0) return "0";

    const tolerance = 1.0e-6;
    const wholePart = Math.floor(amount);
    const fractionalPart = amount - wholePart;

    if (fractionalPart < tolerance) {
      return wholePart.toString();
    }

    // Common Unicode fractions
    const unicodeFractions: { [key: string]: string } = {
      "0.125": "⅛",
      "0.25": "¼",
      "0.333": "⅓",
      "0.375": "⅜",
      "0.5": "½",
      "0.625": "⅝",
      "0.666": "⅔",
      "0.75": "¾",
      "0.875": "⅞",
    };

    // Find the closest Unicode fraction
    const fractionalStr = fractionalPart.toFixed(3);
    const unicodeFraction = unicodeFractions[fractionalStr];

    if (unicodeFraction) {
      return wholePart > 0 ? `${wholePart}${unicodeFraction}` : unicodeFraction;
    }

    // Try to find a simple fraction for other values
    for (let denominator = 2; denominator <= 16; denominator++) {
      const numerator = Math.round(fractionalPart * denominator);
      if (Math.abs(fractionalPart - numerator / denominator) < tolerance) {
        const fractionStr = `${numerator}/${denominator}`;
        return wholePart > 0 ? `${wholePart} ${fractionStr}` : fractionStr;
      }
    }

    // Fallback to decimal with one decimal place
    return amount.toFixed(1);
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

  useEffect(() => {
    async function fetchRecipe() {
      setLoading(true);
      setImageError(false); // Reset image error when fetching new recipe
      try {
        let foundRecipe = null;

        // First, try to get user's version if authenticated
        if (session?.user?.email) {
          try {
            const userRes = await fetch(
              `/api/recipes?userEmail=${encodeURIComponent(session.user.email)}`
            );
            if (userRes.ok) {
              const userRecipes = await userRes.json();
              foundRecipe = userRecipes.find((r: Recipe) => r.slug === slug);
            }
          } catch (userError) {
            console.warn("Could not fetch user recipes:", userError);
          }
        }

        // If no user recipe found, fall back to static recipe (for authenticated users)
        if (!foundRecipe && session?.user?.email) {
          const res = await fetch(
            `/api/recipes/${slug}?userEmail=${encodeURIComponent(
              session.user.email
            )}`
          );
          if (res.ok) {
            foundRecipe = await res.json();
          }
        }

        // If not authenticated or no recipe found, try public recipes
        if (!foundRecipe) {
          try {
            const publicRes = await fetch("/api/recipes");
            if (publicRes.ok) {
              const publicRecipes = await publicRes.json();
              foundRecipe = publicRecipes.find((r: Recipe) => r.slug === slug);
            }
          } catch (publicError) {
            console.warn("Could not fetch public recipes:", publicError);
          }
        }

        if (foundRecipe) {
          setRecipe(foundRecipe);
          setServings(foundRecipe.servings);
        } else {
          console.error("Recipe not found");
          setRecipe(null);
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
        setRecipe(null);
      }
      setLoading(false);
    }

    fetchRecipe();
  }, [slug, session]);

  const toggleFavorite = async () => {
    if (!recipe || !session?.user?.email) return;

    try {
      const res = await fetch("/api/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...recipe,
          favorite: !recipe.favorite,
        }),
      });

      if (res.ok) {
        setRecipe((prev) =>
          prev ? { ...prev, favorite: !prev.favorite } : null
        );
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 5000);
    } catch (error) {
      console.error("Error sharing recipe:", error);
    }
  };

  const scaleIngredient = (amount: number) => {
    if (!recipe) return amount;
    return (amount * servings) / recipe.servings;
  };

  const handleMakeMode = () => {
    setCurrentStep(0);
    setMakeModeOpen(true);
  };

  const nextStep = () => {
    if (!recipe) return;
    if (currentStep < recipe.steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePrint = () => {
    handleExportPDF();
  };

  const handleExportPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      const titleLines = pdf.splitTextToSize(
        recipe?.title || "",
        pageWidth - 40
      );
      pdf.text(titleLines, 20, yPosition);
      yPosition += titleLines.length * 7 + 1; // Reduced spacing from 10 to 5

      // Times
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Prep: ${recipe?.prepTime}m | Cook: ${formatTime(
          recipe?.cookTime || 0
        )}`,
        20,
        yPosition
      );
      yPosition += 10;

      // Author
      pdf.text(`By ${recipe?.author}`, 20, yPosition);
      yPosition += 5;

      // Source (if available)
      if (recipe?.source) {
        pdf.text(`Inspired by ${recipe.source}`, 20, yPosition);
        yPosition += 10;
      } else {
        yPosition += 5;
      }

      // Description
      const descLines = pdf.splitTextToSize(
        recipe?.description || "",
        pageWidth - 40
      );
      pdf.text(descLines, 20, yPosition);
      yPosition += descLines.length * 5 + 7;

      // Ingredients
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ingredients", 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      recipe?.ingredients.forEach((ingredient) => {
        const text = `• ${formatAmountAsFraction(ingredient.amount)} ${
          ingredient.unit
        } ${ingredient.name}`;
        pdf.text(text, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 7;

      // Instructions
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Instructions", 20, yPosition);
      yPosition += 7;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      recipe?.steps.forEach((step, index) => {
        const stepText = `${index + 1}. ${step.step}`;
        const stepLines = pdf.splitTextToSize(stepText, pageWidth - 40);

        if (yPosition + stepLines.length * 5 > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.text(stepLines, 20, yPosition);
        yPosition +=
          step.temperature || step.time || step.superSmoke
            ? stepLines.length * 5
            : stepLines.length * 2; // Adjust spacing based on smoker info

        if (
          recipe?.type === "smoker" &&
          (step.temperature || step.time || step.superSmoke)
        ) {
          let smokerInfo = "";
          if (step.temperature) smokerInfo += `${step.temperature}°F `;
          if (step.time) smokerInfo += `${step.time}min `;
          if (step.superSmoke) smokerInfo += " | Super Smoke";
          if (smokerInfo) {
            yPosition += 3; // Only add spacing if we have smoker info
            pdf.setFontSize(9);
            pdf.text(`   ${smokerInfo}`, 25, yPosition);
            yPosition += 1; // Spacing after temp/time
            pdf.setFontSize(11);
          }
        }

        // Add horizontal line between steps (except after the last step)
        if (index < (recipe?.steps.length || 0) - 1) {
          yPosition += 3; // Spacing before line
          pdf.setDrawColor(180, 180, 180); // Light gray color
          pdf.setLineWidth(0.25); // Slim line
          pdf.line(20, yPosition, pageWidth - 20, yPosition); // Horizontal line
          yPosition += 8; // Spacing after line
        } else {
          yPosition += 5; // Regular spacing for last step
        }
      });

      // My Notes
      if (recipe?.myNotes) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("My Notes", 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const notesLines = pdf.splitTextToSize(recipe.myNotes, pageWidth - 40);
        pdf.text(notesLines, 20, yPosition);
      }

      // Save the PDF
      pdf.save(`${recipe?.slug || "recipe"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Fallback to print
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400 font-mono">
          Loading recipe...
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Recipe not found
          </h2>
          <Link href="/recipes">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Back to Recipes
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex-1">
        {/* Header */}
        <div className="flex items-center justify-between h-[61px] border-b border-gray-200 px-3">
          <div className="flex items-center space-x-2">
            <Link href="/recipes">
              <button className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                <ArrowBackIcon sx={{ fontSize: 16 }} />
                Back to Recipes
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
                                    onClick={() =>
                                      handleAppSelect(subItem.path)
                                    }
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
          </div>

          {/* Action buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {session ? (
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
            ) : null}
          </div>
        </div>

        {/* Mobile Auth UI - Only visible on mobile */}
        {session && (
          <div className="sm:hidden px-3 py-2 border-b border-gray-200 flex justify-center">
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
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto p-6">
          {/* Recipe Header */}
          <div className="mb-8">
            {/* Recipe Image */}
            <div className="relative w-full h-64 md:h-80 bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden mb-6">
              {recipe.photo && !imageError ? (
                <Image
                  src={recipe.photo}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <LocalDiningIcon sx={{ fontSize: 96, color: "#9CA3AF" }} />
              )}

              {/* Public icon overlay - show for public recipes */}
              {recipe.public && (
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                  <PublicIcon sx={{ fontSize: 20, color: "gray" }} />
                </div>
              )}

              {/* Overlay buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                {recipe.public && (
                  <IconButton
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      "&:hover": { backgroundColor: "white" },
                    }}
                    size="small"
                    title="Public Recipe"
                  >
                    <PublicIcon sx={{ color: "gray" }} />
                  </IconButton>
                )}
                {session?.user?.email && (
                  <IconButton
                    onClick={toggleFavorite}
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      "&:hover": { backgroundColor: "white" },
                    }}
                    size="small"
                    title="Favorite"
                  >
                    {recipe.favorite ? (
                      <FavoriteIcon sx={{ color: "red" }} />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>
                )}
                <IconButton
                  onClick={handleShare}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    "&:hover": { backgroundColor: "white" },
                    borderRadius: showCopiedMessage ? "4px" : "50%",
                  }}
                  size="small"
                  title="Share"
                >
                  {showCopiedMessage ? (
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                      URL Copied
                    </span>
                  ) : (
                    <ShareIcon />
                  )}
                </IconButton>
                <IconButton
                  onClick={handlePrint}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    "&:hover": { backgroundColor: "white" },
                  }}
                  size="small"
                  title="Print"
                >
                  <PrintIcon />
                </IconButton>
                <IconButton
                  onClick={handleExportPDF}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    "&:hover": { backgroundColor: "white" },
                  }}
                  size="small"
                  title="Export PDF"
                >
                  <PictureAsPdfIcon />
                </IconButton>
              </div>

              {/* Edit button for logged in users */}
              {session && (
                <div className="absolute top-4 left-4">
                  <IconButton
                    onClick={() =>
                      router.push(`/recipes/builder?edit=${recipe.id}`)
                    }
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      "&:hover": { backgroundColor: "white" },
                    }}
                    size="small"
                    title="Edit Recipe"
                  >
                    <EditIcon />
                  </IconButton>
                </div>
              )}
            </div>

            {/* Recipe Title and Times */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2 uppercase text-center">
              {recipe.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-gray-600 mb-4">
              <span className="flex items-center gap-1">
                <AccessTimeIcon sx={{ fontSize: 18 }} />
                Prep: {recipe.prepTime}m
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <AccessTimeIcon sx={{ fontSize: 18 }} />
                Cook: {formatTime(recipe.cookTime)}
              </span>
            </div>

            {/* Author */}
            <div className="text-center text-gray-500 text-sm mb-4">
              <div>Cooked Up by {recipe.author}</div>
              {recipe.source && (
                <div className="mt-1">
                  Inspired by{" "}
                  {recipe.source.startsWith("http") ? (
                    <>
                      <a
                        href={recipe.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {recipe.source}
                      </a>
                      {recipe.shared_family ? " and shared with family" : ""}
                    </>
                  ) : (
                    <>
                      {recipe.source}
                      {recipe.shared_family ? " and shared with family" : ""}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed text-xl text-center">
              {recipe.description}
            </p>
          </div>

          {/* Recipe Content */}
          <div className="space-y-4">
            {/* Ingredients */}
            <Accordion defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ backgroundColor: "rgb(249 250 251)" }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Ingredients
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className="mb-4">
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Servings: {servings}
                  </Typography>
                  <Slider
                    value={servings}
                    onChange={(_, value) => setServings(value)}
                    min={1}
                    max={24}
                    marks={[
                      { value: 1, label: "1" },
                      { value: 2, label: "2" },
                      { value: 4, label: "4" },
                      { value: 8, label: "8" },
                      { value: 12, label: "12" },
                      { value: 24, label: "24" },
                    ]}
                    valueLabelDisplay="auto"
                    sx={{ maxWidth: 300 }}
                  />
                </div>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li
                      key={`ingredient-${index}-${ingredient.name}`}
                      className="flex justify-between"
                    >
                      <span>{ingredient.name}</span>
                      <span className="font-medium">
                        {formatAmountAsFraction(
                          scaleIngredient(ingredient.amount)
                        )}{" "}
                        {ingredient.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </AccordionDetails>
            </Accordion>

            {/* Make Now Button */}
            <div className="text-center my-6">
              <button
                onClick={handleMakeMode}
                className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 bg-gray-100 text-gray-800 hover:text-gray-600 hover:bg-gray-200 mx-auto cursor-pointer"
              >
                <FlatwareIcon />
                MAKE NOW
              </button>
            </div>

            {/* Steps */}
            <Accordion defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ backgroundColor: "rgb(249 250 251)" }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Instructions
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className="space-y-6">
                  {recipe.steps.map((step, index) => (
                    <div
                      key={`step-${index}-${step.step.substring(0, 20)}`}
                      className="border-b border-gray-200 pb-4 last:border-b-0"
                    >
                      <h4 className="font-bold text-black uppercase mb-2">
                        STEP {index + 1}
                      </h4>
                      <div className="space-y-2">
                        <p className="text-gray-800">{step.step}</p>
                        {recipe.type === "smoker" &&
                          (step.temperature ||
                            step.time ||
                            step.superSmoke) && (
                            <div className="flex gap-4 text-sm text-gray-600">
                              {step.temperature && (
                                <span className="flex items-center gap-1">
                                  <OutdoorGrillIcon sx={{ fontSize: 16 }} />
                                  {step.temperature}°F
                                </span>
                              )}
                              {step.time && (
                                <span className="flex items-center gap-1">
                                  <TimerIcon sx={{ fontSize: 16 }} />
                                  {step.time}m
                                </span>
                              )}
                              {step.superSmoke && (
                                <span className="flex items-center gap-1">
                                  <WhatshotIcon sx={{ fontSize: 16 }} />
                                  Super Smoke
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionDetails>
            </Accordion>

            {/* My Notes */}
            {recipe.myNotes && (
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ backgroundColor: "rgb(249 250 251)" }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    My Notes
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                    {recipe.myNotes}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}
          </div>
        </div>
      </div>

      {/* Make Mode Dialog */}
      <Dialog
        open={makeModeOpen}
        onClose={() => setMakeModeOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: "relative" }}>
          {/* Close button in top right */}
          <IconButton
            onClick={() => setMakeModeOpen(false)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1,
              backgroundColor: "rgba(255,255,255,0.9)",
              "&:hover": { backgroundColor: "white" },
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>

          {currentStep < recipe.steps.length ? (
            <div className="p-8 text-center flex flex-col justify-center min-h-[300px]">
              <p className="text-2xl text-gray-700 mb-8 leading-relaxed">
                {recipe.steps[currentStep].step}
              </p>

              {recipe.type === "smoker" && (
                <div className="flex justify-center gap-6 mb-6">
                  {recipe.steps[currentStep].temperature && (
                    <div className="flex items-center gap-2">
                      <ThermostatIcon sx={{ color: "black" }} />
                      <span>{recipe.steps[currentStep].temperature}°F</span>
                    </div>
                  )}
                  {recipe.steps[currentStep].time && (
                    <div className="flex items-center gap-2">
                      <TimerIcon sx={{ color: "black" }} />
                      <span>{recipe.steps[currentStep].time}m</span>
                    </div>
                  )}
                  {recipe.steps[currentStep].superSmoke && (
                    <div className="flex items-center gap-2">
                      <WhatshotIcon sx={{ color: "black" }} />
                      <span>Super Smoke</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🍽️</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Bon Appétit!
              </h2>
              <p className="text-lg text-gray-600">
                Your recipe is complete. Enjoy your meal!
              </p>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", p: 3, gap: 4 }}>
          <IconButton
            onClick={prevStep}
            disabled={currentStep === 0}
            sx={{
              fontSize: 48,
              color: currentStep === 0 ? "gray" : "primary.main",
              "&:hover": {
                backgroundColor: "primary.light",
                color: "white",
              },
            }}
            size="large"
          >
            <ArrowCircleLeftIcon sx={{ fontSize: 48 }} />
          </IconButton>

          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">
              STEP {currentStep + 1} of {recipe.steps.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {currentStep < recipe.steps.length
                ? "Swipe or tap to navigate"
                : "Recipe complete!"}
            </div>
          </div>

          {currentStep < recipe.steps.length ? (
            <IconButton
              onClick={nextStep}
              sx={{
                fontSize: 48,
                color: "primary.main",
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                },
              }}
              size="large"
            >
              <ArrowCircleRightIcon sx={{ fontSize: 48 }} />
            </IconButton>
          ) : (
            <IconButton
              onClick={() => setMakeModeOpen(false)}
              sx={{
                fontSize: 48,
                color: "success.main",
                "&:hover": {
                  backgroundColor: "success.light",
                  color: "white",
                },
              }}
              size="large"
            >
              <CloseIcon sx={{ fontSize: 48 }} />
            </IconButton>
          )}
        </DialogActions>
      </Dialog>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

export default RecipeDetail;
