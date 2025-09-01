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
  Timer as TimerIcon,
  Whatshot as WhatshotIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Print as PrintIcon,
  PictureAsPdf as PictureAsPdfIcon,
  OutdoorGrill as OutdoorGrillIcon,
  Microwave as MicrowaveIcon,
  LocalBar as LocalBarIcon,
  Flatware as FlatwareIcon,
  GridOn as GridOnIcon,
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
  FactCheck as FactCheckIcon,
  Favorite as HeartIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  ButtonGroup,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
  DialogTitle,
  Typography,
} from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";
import { useSession, signOut } from "next-auth/react";

type Recipe = {
  id: number;
  slug: string;
  title: string;
  description: string;
  source?: string;
  sourceTitle?: string;
  type: "smoker" | "flat-top" | "grill" | "oven" | "beverage";
  recommendedPellets?: string;
  categories: string[];
  photo?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Array<{
    id?: string;
    name: string;
    amount: number;
    unit: string;
  }>;
  steps: Array<{
    step: string;
    temperature?: number;
    time?: number;
    superSmoke?: boolean;
    stepIngredients?: Array<{
      id?: string;
      ingredientId?: string;
      ingredientIndex?: number;
    }>;
  }>;
  myNotes?: string;
  author: string;
  favorite: boolean;
  public?: boolean;
  date: string;
  shared_family?: boolean | number;
  familyPhoto?: string;
  familyNotes?: string;
  userEmail?: string;
  reviews?: Array<{
    uuid: string;
    userEmail: string;
    userName: string;
    stars: number;
    reviewText: string;
    createDate: string;
    status: number; // 1 for published
  }>;
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

const RecipeDetail = React.memo(function RecipeDetail({
  slug,
}: Readonly<RecipeDetailProps>): React.ReactElement {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(4);
  const [makeModeOpen, setMakeModeOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [showFamilyDetails, setShowFamilyDetails] = useState(false);
  const [nameFromDB, setNameFromDB] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<
    Array<{ name: string; email: string; relationship?: string }>
  >([]);
  const [hasFamilyMembers, setHasFamilyMembers] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number | null>(0);
  const [editReviewText, setEditReviewText] = useState("");
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
    if (!amount || amount === 0) return "";

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

  // Function to format ingredient units
  const formatUnit = (unit: string): string => {
    const unitMap: { [key: string]: string } = {
      ounce: "oz",
      ounces: "oz",
      teaspoon: "tsp",
      teaspoons: "tsp",
      tablespoon: "Tbsp",
      tablespoons: "Tbsp",
      "to taste": "taste",
      unit: "each",
      units: "each",
      pound: "lb",
      pounds: "lb",
    };

    return unitMap[unit.toLowerCase()] || unit;
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

  // Helper function to count words
  const countWords = (text: string): number => {
    if (!text || text.trim().length === 0) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  // Handle review text change with word limit
  const handleReviewTextChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newText = event.target.value;
    const wordCount = countWords(newText);

    if (wordCount <= 100) {
      setReviewText(newText);
    }
  };

  // Handle opening the review modal
  const handleCookedThisOneUp = () => {
    setReviewModalOpen(true);
  };

  // Handle closing make mode and opening review modal
  const handleMakeModeToReview = () => {
    setMakeModeOpen(false);
    setReviewModalOpen(true);
  };

  // Handle closing the review modal
  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setRating(0);
    setReviewText("");
  };

  // Handle submitting the review
  const handleSubmitReview = async () => {
    if (!recipe || !session?.user?.email || !rating) return;

    try {
      // Check if user has already submitted a review for this recipe
      const existingReview = recipe.reviews?.find(
        (review) => review.userEmail === session.user?.email
      );

      if (existingReview) {
        console.log("User has already submitted a review for this recipe");
        // You might want to show a user-friendly message here
        alert("You have already submitted a review for this recipe.");
        return;
      }

      // Generate UUID for the review
      const uuid = crypto.randomUUID();

      // Create the review object
      const newReview = {
        uuid: uuid,
        userEmail: session.user.email,
        userName: nameFromDB || session.user?.name || session.user.email,
        stars: rating,
        reviewText: reviewText.trim(),
        createDate: new Date().toISOString(),
        status: 1, // Published
      };

      // Add the review to the recipe's reviews array
      const updatedRecipe = {
        ...recipe,
        reviews: [...(recipe.reviews || []), newReview],
      };

      // Save to database
      const response = await fetch("/api/recipes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedRecipe),
      });

      if (response.ok) {
        // Update local state with the new review
        setRecipe(updatedRecipe);
        setReviewSubmitted(true); // Mark review as submitted
        console.log("Review submitted successfully");
        handleCloseReviewModal();
      } else {
        console.error("Failed to submit review");
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      // You might want to show an error message to the user here
    }
  };

  // Handle editing a review
  const handleEditReview = (review: {
    uuid: string;
    userEmail: string;
    userName: string;
    stars: number;
    reviewText: string;
    createDate: string;
    status: number;
  }) => {
    setEditingReviewId(review.uuid);
    setEditRating(review.stars);
    setEditReviewText(review.reviewText);
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditReviewText("");
  };

  // Handle saving edited review
  const handleSaveEdit = async (reviewUuid: string) => {
    if (!recipe || !session?.user?.email || !editRating) return;

    try {
      const updatedReviews =
        recipe.reviews?.map((review) =>
          review.uuid === reviewUuid
            ? {
                ...review,
                stars: editRating,
                reviewText: editReviewText.trim(),
              }
            : review
        ) || [];

      const updatedRecipe = {
        ...recipe,
        reviews: updatedReviews,
      };

      const response = await fetch("/api/recipes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedRecipe),
      });

      if (response.ok) {
        setRecipe(updatedRecipe);
        handleCancelEdit();
        console.log("Review updated successfully");
      } else {
        console.error("Failed to update review");
      }
    } catch (error) {
      console.error("Error updating review:", error);
    }
  };

  // Handle deleting a review
  const handleDeleteReview = async (reviewUuid: string) => {
    if (!recipe || !session?.user?.email) return;

    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        const updatedReviews =
          recipe.reviews?.filter((review) => review.uuid !== reviewUuid) || [];

        const updatedRecipe = {
          ...recipe,
          reviews: updatedReviews,
        };

        const response = await fetch("/api/recipes", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedRecipe),
        });

        if (response.ok) {
          setRecipe(updatedRecipe);
          setReviewSubmitted(false); // Allow user to submit a new review
          console.log("Review deleted successfully");
        } else {
          console.error("Failed to delete review");
        }
      } catch (error) {
        console.error("Error deleting review:", error);
      }
    }
  };

  // Helper function to count words for edit text
  const countWordsEdit = (text: string): number => {
    if (!text || text.trim().length === 0) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  // Handle edit review text change with word limit
  const handleEditReviewTextChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newText = event.target.value;
    const wordCount = countWordsEdit(newText);

    if (wordCount <= 100) {
      setEditReviewText(newText);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchRecipe() {
      if (!isMounted) return;

      setLoading(true);
      setImageError(false); // Reset image error when fetching new recipe

      try {
        let foundRecipe = null;

        // First, try to get user's version if authenticated
        if (session?.user?.email) {
          try {
            const userRes = await fetch(
              `/api/recipes?userEmail=${encodeURIComponent(
                session.user.email
              )}`,
              { cache: "no-store" } // Prevent caching
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
          try {
            const res = await fetch(
              `/api/recipes/${slug}?userEmail=${encodeURIComponent(
                session.user.email
              )}`,
              { cache: "no-store" } // Prevent caching
            );
            if (res.ok) {
              foundRecipe = await res.json();
            }
          } catch (error) {
            console.warn("Could not fetch individual recipe:", error);
          }
        }

        // If not authenticated or no recipe found, try public recipes
        if (!foundRecipe) {
          try {
            const publicRes = await fetch(
              "/api/recipes",
              { cache: "no-store" } // Prevent caching
            );
            if (publicRes.ok) {
              const publicRecipes = await publicRes.json();
              foundRecipe = publicRecipes.find((r: Recipe) => r.slug === slug);
            }
          } catch (publicError) {
            console.warn("Could not fetch public recipes:", publicError);
          }
        }

        if (foundRecipe && isMounted) {
          setRecipe(foundRecipe);

          // Check if current user has already submitted a review
          if (session?.user?.email) {
            const userHasReviewed = foundRecipe.reviews?.some(
              (review: { userEmail: string }) =>
                review.userEmail === session.user?.email
            );
            setReviewSubmitted(userHasReviewed || false);
          }

          // Set servings to the closest available option (2, 4, 6, 8)
          const availableServings = [2, 4, 6, 8, 10, 12];
          const closestServing = availableServings.reduce(
            (prev, curr) =>
              Math.abs(curr - foundRecipe.servings) <
              Math.abs(prev - foundRecipe.servings)
                ? curr
                : prev,
            availableServings[0]
          );
          setServings(closestServing);
        } else if (isMounted) {
          console.error("Recipe not found");
          setRecipe(null);
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
        if (isMounted) {
          setRecipe(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRecipe();

    // Cleanup function to prevent setting state on unmounted component
    return () => {
      isMounted = false;
    };
  }, [slug, session]);

  // Fetch user's name from database
  useEffect(() => {
    async function fetchUserName() {
      if (!session?.user?.email) {
        setNameFromDB(null);
        return;
      }

      try {
        const res = await fetch(
          `/api/userinfo?email=${encodeURIComponent(session.user.email)}`
        );
        if (res.ok) {
          const data = await res.json();
          setNameFromDB(data.name ?? session.user?.name ?? null);
        } else {
          setNameFromDB(session.user?.name ?? null);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        setNameFromDB(session.user?.name ?? null);
      }
    }

    fetchUserName();
  }, [session?.user?.email, session?.user?.name]);

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

  // Helper function to convert Unicode fractions to ASCII for PDF compatibility
  const convertUnicodeToAscii = (text: string): string => {
    return text
      .replace(/¼/g, " 1/4")
      .replace(/½/g, " 1/2")
      .replace(/¾/g, " 3/4")
      .replace(/⅐/g, " 1/7")
      .replace(/⅑/g, " 1/9")
      .replace(/⅒/g, " 1/10")
      .replace(/⅓/g, " 1/3")
      .replace(/⅔/g, " 2/3")
      .replace(/⅕/g, " 1/5")
      .replace(/⅖/g, " 2/5")
      .replace(/⅗/g, " 3/5")
      .replace(/⅘/g, " 4/5")
      .replace(/⅙/g, " 1/6")
      .replace(/⅚/g, " 5/6")
      .replace(/⅛/g, " 1/8")
      .replace(/⅜/g, " 3/8")
      .replace(/⅝/g, " 5/8")
      .replace(/⅞/g, " 7/8");
  };

  const handleExportPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Set margins
      const leftMargin = 20;
      const rightMargin = 50;
      const textWidth = pageWidth - leftMargin - rightMargin;

      // Title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      const titleLines = pdf.splitTextToSize(recipe?.title || "", textWidth);
      pdf.text(titleLines, leftMargin, yPosition);
      yPosition += titleLines.length * 7 + 1;

      // Times
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Prep: ${recipe?.prepTime}m | Cook: ${formatTime(
          recipe?.cookTime || 0
        )}`,
        leftMargin,
        yPosition
      );
      yPosition += 10;

      // Author
      pdf.text(`By ${recipe?.author}`, leftMargin, yPosition);
      yPosition += 5;

      // Source (if available)
      if (recipe?.source || recipe?.sourceTitle) {
        pdf.text(
          `Inspired by ${recipe.sourceTitle || recipe.source}`,
          leftMargin,
          yPosition
        );
        yPosition += 5;

        // Add URL if it's a valid URL
        if (recipe?.source && recipe.source.trim() !== "") {
          try {
            new URL(recipe.source);
            pdf.text(recipe.source, leftMargin, yPosition);
            yPosition += 10;
          } catch {
            // Not a valid URL, just add some spacing
            yPosition += 5;
          }
        } else {
          yPosition += 5;
        }
      } else {
        yPosition += 5;
      }

      // Description
      const descLines = pdf.splitTextToSize(
        recipe?.description || "",
        textWidth
      );
      pdf.text(descLines, leftMargin, yPosition);
      yPosition += descLines.length * 5 + 4;

      // Ingredients
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Ingredients (Servings: ${servings})`, leftMargin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      recipe?.ingredients.forEach((ingredient) => {
        const amount = formatAmountAsFraction(
          scaleIngredient(ingredient.amount)
        );
        const text = `• ${convertUnicodeToAscii(amount)} ${formatUnit(
          ingredient.unit
        )} ${ingredient.name}`;

        // Split ingredient text to ensure it wraps properly with conservative width
        const ingredientLines = pdf.splitTextToSize(text, textWidth - 10);
        ingredientLines.forEach((line: string, lineIndex: number) => {
          pdf.text(line, leftMargin + 5, yPosition + lineIndex * 5);
        });
        yPosition += ingredientLines.length * 5 + 1;
      });
      yPosition += 1;

      // Instructions
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }

      // Add padding above Instructions heading
      yPosition += 5;

      // pdf.setFontSize(16);
      // pdf.setFont("helvetica", "bold");
      // pdf.text("Steps", leftMargin, yPosition);
      // yPosition += 9;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      recipe?.steps.forEach((step, index) => {
        // Remove line breaks and clean up text - enhanced to handle all types of whitespace and Unicode fractions
        const cleanedStepText = step.step
          .replace(/\n/g, " ") // Line feeds
          .replace(/\r/g, " ") // Carriage returns
          .replace(/\t/g, " ") // Tabs
          .replace(/\u00A0/g, " ") // Non-breaking spaces
          .replace(/\u2000-\u200F/g, " ") // En quad, em quad, en space, em space, etc.
          .replace(/\u2028/g, " ") // Line separator
          .replace(/\u2029/g, " ") // Paragraph separator
          .replace(/\uFEFF/g, "") // Zero width no-break space (BOM)
          .replace(/[\u200B-\u200D]/g, "") // Zero width spaces
          // Convert Unicode fraction characters to ASCII equivalents
          .replace(/\u00BC/g, "1/4") // ¼
          .replace(/\u00BD/g, "1/2") // ½
          .replace(/\u00BE/g, "3/4") // ¾
          .replace(/\u2150/g, "1/7") // ⅐
          .replace(/\u2151/g, "1/9") // ⅑
          .replace(/\u2152/g, "1/10") // ⅒
          .replace(/\u2153/g, "1/3") // ⅓
          .replace(/\u2154/g, "2/3") // ⅔
          .replace(/\u2155/g, "1/5") // ⅕
          .replace(/\u2156/g, "2/5") // ⅖
          .replace(/\u2157/g, "3/5") // ⅗
          .replace(/\u2158/g, "4/5") // ⅘
          .replace(/\u2159/g, "1/6") // ⅙
          .replace(/\u215A/g, "5/6") // ⅚
          .replace(/\u215B/g, "1/8") // ⅛
          .replace(/\u215C/g, "3/8") // ⅜
          .replace(/\u215D/g, "5/8") // ⅝
          .replace(/\u215E/g, "7/8") // ⅞
          // Convert degree symbol to ASCII equivalent
          .replace(/°F/g, " deg F") // Replace degree symbol with deg
          .replace(/°C/g, " deg C") // Replace Celsius degree symbol
          .replace(/°/g, " deg") // Replace any remaining degree symbols
          .replace(/\s+/g, " ") // Replace multiple spaces with single space
          .trim();
        const stepText = `${index + 1}. ${cleanedStepText}`;

        // Use consistent text width for wrapping
        const stepLines = pdf.splitTextToSize(stepText, textWidth);

        // Calculate space needed for step + ingredients + smoker info
        let totalSpaceNeeded = stepLines.length * 6;
        if (step.stepIngredients && step.stepIngredients.length > 0) {
          totalSpaceNeeded += 10 + step.stepIngredients.length * 5; // Header + ingredients
        }
        if (
          (recipe?.type?.toLowerCase().trim() === "smoker" ||
            recipe?.type?.toLowerCase().trim() === "oven") &&
          (step.temperature || step.time || step.superSmoke)
        ) {
          totalSpaceNeeded += 10; // Temperature/time info space
        }

        if (yPosition + totalSpaceNeeded > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        // Ensure we're using the correct font for step text
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");

        // Render step header as "Step [Number]"
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Step ${index + 1}`, leftMargin, yPosition);
        yPosition += 8;

        // Render step text below the header
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        stepLines.forEach((line: string, lineIndex: number) => {
          pdf.text(line, leftMargin, yPosition + lineIndex * 6);
        });
        yPosition += stepLines.length * 5 + 1; // Base spacing after step text

        // Add step ingredients if they exist
        if (step.stepIngredients && step.stepIngredients.length > 0) {
          // Add "INGREDIENTS" header
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          yPosition += 3;
          pdf.text("INGREDIENTS", leftMargin + 5, yPosition);
          yPosition += 6;

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");

          step.stepIngredients.forEach((stepIngredient) => {
            let ingredient;

            // First try to find by ingredientIndex (new format)
            if (
              typeof stepIngredient.ingredientIndex === "number" &&
              stepIngredient.ingredientIndex >= 0 &&
              stepIngredient.ingredientIndex < (recipe?.ingredients.length || 0)
            ) {
              ingredient = recipe?.ingredients[stepIngredient.ingredientIndex];
            }

            // Fallback to ID matching (legacy format)
            if (!ingredient && stepIngredient.ingredientId) {
              ingredient = recipe?.ingredients.find(
                (ing) => ing.id === stepIngredient.ingredientId
              );
            }

            // Fallback to index parsing from ingredientId
            if (!ingredient && stepIngredient.ingredientId) {
              const ingredientIdx = parseInt(stepIngredient.ingredientId);
              if (
                !isNaN(ingredientIdx) &&
                ingredientIdx >= 0 &&
                ingredientIdx < (recipe?.ingredients.length || 0)
              ) {
                ingredient = recipe?.ingredients[ingredientIdx];
              }
            }

            if (ingredient) {
              const amount = formatAmountAsFraction(
                scaleIngredient(ingredient.amount)
              );
              const ingredientText = `• ${convertUnicodeToAscii(amount)}${
                ingredient.unit ? ` ${formatUnit(ingredient.unit)}` : ""
              } | ${ingredient.name}`;

              // Split ingredient text to ensure it wraps properly with conservative width
              const ingredientLines = pdf.splitTextToSize(
                ingredientText,
                textWidth - 10
              );
              ingredientLines.forEach((line: string, lineIndex: number) => {
                pdf.text(line, leftMargin + 10, yPosition + lineIndex * 5);
              });
              yPosition += ingredientLines.length * 5;
            }
          });

          yPosition += 0; // Space after ingredients
        }

        // Add temperature and time info for smoker, oven, and flat-top recipes
        if (
          (recipe?.type?.toLowerCase().trim() === "smoker" ||
            recipe?.type?.toLowerCase().trim() === "oven" ||
            recipe?.type?.toLowerCase().trim() === "flat-top") &&
          (step.temperature || step.time || step.superSmoke)
        ) {
          let tempTimeInfo = "";
          if (step.temperature) {
            // Add appropriate symbol based on recipe type (using ASCII symbols for PDF compatibility)
            let symbol = "";
            const recipeType = recipe?.type?.toLowerCase().trim();
            if (recipeType === "oven") {
              symbol = "OVEN - ";
            } else if (recipeType === "smoker") {
              symbol = "SMOKER - ";
            } else if (recipeType === "flat-top") {
              symbol = "FLAT-TOP - ";
            } else if (recipeType === "grill") {
              symbol = "GRILL - ";
            } else if (recipeType === "beverage") {
              symbol = "COCKTAIL - ";
            } else {
              symbol = "COOK - ";
            }

            // For oven and flat-top recipes, treat as heat level if value is 10 or less, otherwise as temperature
            if (
              (recipe?.type?.toLowerCase().trim() === "oven" ||
                recipe?.type?.toLowerCase().trim() === "flat-top") &&
              step.temperature <= 10
            ) {
              tempTimeInfo += `${symbol}Heat Level ${step.temperature} `;
            } else {
              tempTimeInfo += `${symbol}${step.temperature}(f) `;
            }
          }
          if (step.time) {
            tempTimeInfo += `${step.time}min `;
          }
          if (
            step.superSmoke &&
            recipe?.type?.toLowerCase().trim() === "smoker"
          )
            tempTimeInfo += "Super Smoke";
          if (tempTimeInfo) {
            // Ensure proper font for temperature/time info
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            yPosition += 3; // Consistent spacing after temp/time info
            pdf.text("TEMP and TIME", leftMargin + 5, yPosition);
            yPosition += 6;

            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");
            pdf.text(`   ${tempTimeInfo}`, leftMargin + 5, yPosition);
            yPosition += 3; // Consistent spacing after temp/time info
          }
        }

        // Add horizontal line between steps (except after the last step)
        if (index < (recipe?.steps.length || 0) - 1) {
          // Check if step has ingredients or temp/time info for spacing
          const hasStepIngredients =
            step.stepIngredients && step.stepIngredients.length > 0;
          const hasTempTimeInfo =
            (recipe?.type?.toLowerCase().trim() === "smoker" ||
              recipe?.type?.toLowerCase().trim() === "oven" ||
              recipe?.type?.toLowerCase().trim() === "flat-top") &&
            (step.temperature || step.time || step.superSmoke);

          if (hasStepIngredients || hasTempTimeInfo) {
            // Larger spacing for steps with extra info
            yPosition += 3; // Spacing before line
            pdf.setDrawColor(180, 180, 180); // Light gray color
            pdf.setLineWidth(0.25); // Slim line
            pdf.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition); // Horizontal line
            yPosition += 8; // Spacing after line
          } else {
            // Much tighter spacing for simple text-only steps but still with underline
            yPosition += 1; // Minimal spacing before line
            pdf.setDrawColor(180, 180, 180); // Light gray color
            pdf.setLineWidth(0.25); // Slim line
            pdf.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition); // Horizontal line
            yPosition += 8; // Minimal spacing after line
          }
        } else {
          pdf.setDrawColor(180, 180, 180); // Light gray color
          pdf.setLineWidth(0.25); // Slim line
          pdf.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition); // Horizontal line
          yPosition += 16; // Regular spacing for last step
        }
      });

      // My Notes
      if (recipe?.myNotes) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("My Notes", leftMargin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const notesLines = pdf.splitTextToSize(recipe.myNotes, textWidth);
        pdf.text(notesLines, leftMargin, yPosition);
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
        <OutdoorGrillIcon
          className="animate-spin"
          sx={{
            fontSize: 80,
            color: "#9CA3AF",
          }}
        />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-3/4 max-w-4xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Oops, we can&apos;t seem to find the Recipe you are looking for.
              Maybe you can find something else to cook up while we check into
              this.
            </h2>
            <Link href="/recipes">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition cursor-pointer">
                Show All Recipes
              </button>
            </Link>
          </div>
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
          <div className="hidden sm:flex items-center gap-2 pr-4">
            {session ? (
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
                  {nameFromDB ? `Signed in as ${nameFromDB}` : ""}
                </span>
                <span className="h-4 w-px bg-gray-300 mx-2" />
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-mono text-sm hover:bg-gray-300 transition cursor-pointer"
                >
                  Sign out
                </button>
              </div>
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
              {nameFromDB ? `Signed in as ${nameFromDB}` : ""}
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
              {recipe.public === true && (
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                  <PublicIcon sx={{ fontSize: 20, color: "gray" }} />
                </div>
              )}

              {/* Overlay buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                {recipe.public === true && (
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
                {recipe.public === true && (
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
                )}
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
            <h1 className="text-3xl font-bold text-gray-900 mb-8 uppercase text-center">
              {recipe.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-gray-600 mb-6">
              <span className="flex items-center gap-1">
                <AccessTimeIcon sx={{ fontSize: 14 }} />
                Prep {recipe.prepTime}m
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <AccessTimeIcon sx={{ fontSize: 14 }} />
                Cook {formatTime(recipe.cookTime)}
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                {recipe.type?.toLowerCase().trim() === "oven" ? (
                  <MicrowaveIcon sx={{ fontSize: 14 }} />
                ) : recipe.type?.toLowerCase().trim() === "smoker" ? (
                  <OutdoorGrillIcon sx={{ fontSize: 14 }} />
                ) : recipe.type?.toLowerCase().trim() === "beverage" ? (
                  <LocalBarIcon sx={{ fontSize: 14 }} />
                ) : recipe.type?.toLowerCase().trim() === "flat-top" ? (
                  <GridOnIcon sx={{ fontSize: 14 }} />
                ) : recipe.type?.toLowerCase().trim() === "grill" ? (
                  <WhatshotIcon sx={{ fontSize: 14 }} />
                ) : (
                  <FlatwareIcon sx={{ fontSize: 14 }} />
                )}
                {recipe.type?.charAt(0).toUpperCase() +
                  recipe.type?.slice(1).toLowerCase()}
              </span>
            </div>

            {/* Author */}
            <div className="text-center text-gray-500 text-sm mb-4">
              <div>Cooked Up by {recipe.author}</div>
              {(recipe.source || recipe.sourceTitle) && (
                <div className="mt-1">
                  Inspired by
                  {!recipe.sourceTitle && recipe.source && (
                    <span className="text-gray-500"> {recipe.source}</span>
                  )}
                  {recipe.source &&
                    recipe.source.trim() !== "" &&
                    (function () {
                      try {
                        new URL(recipe.source);
                        return (
                          <a
                            href={recipe.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline ml-1"
                          >
                            {recipe.sourceTitle}
                          </a>
                        );
                      } catch {
                        return null;
                      }
                    })()}{" "}
                  {recipe.sourceTitle && !recipe.source && (
                    <span className="text-gray-500">{recipe.sourceTitle}</span>
                  )}
                  {(recipe.shared_family === true ||
                    recipe.shared_family === 1) &&
                    session?.user?.email &&
                    (() => {
                      const isOwner = recipe.userEmail === session.user.email;
                      const recipeOwnerIsFamilyMember = familyMembers.some(
                        (member) => member.email === recipe.userEmail
                      );

                      // Show if user is owner of a family-shared recipe, or if user is family member viewing family-shared recipe
                      if (isOwner || recipeOwnerIsFamilyMember) {
                        return (
                          <button
                            onClick={() =>
                              setShowFamilyDetails((prev) => !prev)
                            }
                            className="text-blue-600 hover:text-blue-800 hover:underline ml-1 font-medium"
                          >
                            and shared with family
                          </button>
                        );
                      }
                      return null;
                    })()}
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-800 mt-8  leading-relaxed text-lg text-center">
              {recipe?.description}
            </p>
          </div>

          {/* Family Details */}
          {(recipe.shared_family === true || recipe.shared_family === 1) &&
            session?.user?.email &&
            (() => {
              const isOwner = recipe.userEmail === session.user.email;
              const recipeOwnerIsFamilyMember = familyMembers.some(
                (member) => member.email === recipe.userEmail
              );

              // Show if user is owner of a family-shared recipe, or if user is family member viewing family-shared recipe
              if (isOwner || recipeOwnerIsFamilyMember) {
                return (
                  <div className="mt-4 relative">
                    {showFamilyDetails && (
                      <div className="space-y-4 p-4 mb-8 bg-gray-50 rounded-lg relative">
                        {/* X icon to close */}
                        <IconButton
                          onClick={() => setShowFamilyDetails(false)}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            zIndex: 10,
                            backgroundColor: "rgba(255,255,255,0.9)",
                            "&:hover": { backgroundColor: "white" },
                          }}
                          size="small"
                          title="Close Family Details"
                        >
                          <CloseIcon />
                        </IconButton>
                        {recipe?.familyPhoto || recipe?.familyNotes ? (
                          <div>
                            <h2 className="py-4 text-lg font-semibold text-center">
                              Shhh ...
                              <br />
                              Here Are The Family Secrets
                            </h2>
                            <div className="sm:p-2 flex flex-col gap-6">
                              {recipe?.familyNotes && (
                                <div className="w-full">
                                  <p className="text-gray-700 whitespace-pre-wrap text-[18px]">
                                    {recipe.familyNotes}
                                  </p>
                                </div>
                              )}
                              {recipe?.familyPhoto && (
                                <div className="w-full">
                                  <Image
                                    src={recipe.familyPhoto}
                                    alt="Family recipe photo"
                                    width={400}
                                    height={300}
                                    className="rounded-lg object-cover w-full"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-center py-4">
                            No Family Secrets To Show For Now
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

          {/* Recipe Content */}
          <div className="space-y-4">
            {/* Ingredients Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-black mb-4 text-center">
                Ingredients
              </h2>

              <div className="mb-6 mt-3 text-center">
                <ButtonGroup variant="outlined" size="small">
                  <Button
                    onClick={() => setServings(2)}
                    variant={servings === 2 ? "contained" : "outlined"}
                  >
                    2
                  </Button>
                  <Button
                    onClick={() => setServings(4)}
                    variant={servings === 4 ? "contained" : "outlined"}
                  >
                    4
                  </Button>
                  <Button
                    onClick={() => setServings(6)}
                    variant={servings === 6 ? "contained" : "outlined"}
                  >
                    6
                  </Button>
                  <Button
                    onClick={() => setServings(8)}
                    variant={servings === 8 ? "contained" : "outlined"}
                  >
                    8
                  </Button>
                  <Button
                    onClick={() => setServings(10)}
                    variant={servings === 10 ? "contained" : "outlined"}
                  >
                    10
                  </Button>
                  <Button
                    onClick={() => setServings(12)}
                    variant={servings === 12 ? "contained" : "outlined"}
                  >
                    12
                  </Button>
                </ButtonGroup>
              </div>

              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div
                      key={`ingredient-${index}-${ingredient.name}`}
                      className="flex items-center text-sm border-b border-gray-200 pb-2 last:border-b-0"
                    >
                      <span className="font-semibold min-w-[90px] text-right pr-4 text-gray-800">
                        {formatAmountAsFraction(
                          scaleIngredient(ingredient.amount)
                        )}{" "}
                        {formatUnit(ingredient.unit)}
                      </span>
                      <div className="w-px h-5 bg-gray-300 mr-4"></div>
                      <span className="flex-1 text-gray-700">
                        {ingredient.name}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Vertical divider line between columns - only visible on md+ screens */}
                <div className="hidden md:block absolute top-0 left-1/2 transform -translate-x-1/2 w-px h-full bg-gray-300"></div>
              </div>
            </div>

            {/* Make Now Button */}
            <div className="text-center my-8">
              <button
                onClick={handleMakeMode}
                className="px-8 py-4 rounded-lg text-xl font-bold transition-colors flex items-center gap-2 bg-gray-200 text-gray-900 hover:text-gray-700 hover:bg-gray-300 mx-auto cursor-pointer"
                style={{ minWidth: 220 }}
              >
                <FlatwareIcon sx={{ fontSize: 36 }} />
                MAKE NOW
              </button>
            </div>

            {/* Steps */}
            <div>
              {/* <h2 className="text-xl font-bold text-gray-900 mb-4">Steps</h2> */}
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
                      {step.stepIngredients &&
                        step.stepIngredients.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-bold text-black uppercase mb-2">
                              INGREDIENTS
                            </h5>
                            <div className="space-y-1">
                              {step.stepIngredients.map(
                                (stepIngredient, ingredientIndex) => {
                                  let ingredient;

                                  // First try to find by ingredientIndex (new format)
                                  if (
                                    typeof stepIngredient.ingredientIndex ===
                                      "number" &&
                                    stepIngredient.ingredientIndex >= 0 &&
                                    stepIngredient.ingredientIndex <
                                      recipe.ingredients.length
                                  ) {
                                    ingredient =
                                      recipe.ingredients[
                                        stepIngredient.ingredientIndex
                                      ];
                                  }

                                  // Fallback to ID matching (legacy format)
                                  if (
                                    !ingredient &&
                                    stepIngredient.ingredientId
                                  ) {
                                    ingredient = recipe.ingredients.find(
                                      (ing) =>
                                        ing.id === stepIngredient.ingredientId
                                    );
                                  }

                                  // Fallback to index parsing from ingredientId
                                  if (
                                    !ingredient &&
                                    stepIngredient.ingredientId
                                  ) {
                                    const ingredientIdx = parseInt(
                                      stepIngredient.ingredientId
                                    );
                                    if (
                                      !isNaN(ingredientIdx) &&
                                      ingredientIdx >= 0 &&
                                      ingredientIdx < recipe.ingredients.length
                                    ) {
                                      ingredient =
                                        recipe.ingredients[ingredientIdx];
                                    }
                                  }

                                  if (!ingredient) {
                                    console.log(
                                      "Could not find ingredient for stepIngredient:",
                                      stepIngredient,
                                      "Available ingredients:",
                                      recipe.ingredients
                                    );
                                    return null;
                                  }

                                  return (
                                    <div
                                      key={`${index}-${ingredientIndex}-${ingredient.name}`}
                                      className="flex items-center text-sm border-b border-gray-100 pb-1 last:border-b-0"
                                    >
                                      <span className="font-semibold min-w-[100px] text-right pr-3 text-gray-800">
                                        {formatAmountAsFraction(
                                          scaleIngredient(ingredient.amount)
                                        )}{" "}
                                        {formatUnit(ingredient.unit)}
                                      </span>
                                      <div className="w-px h-4 bg-gray-200 mr-3"></div>
                                      <span className="flex-1 text-gray-700">
                                        {ingredient.name ||
                                          "Unknown ingredient"}
                                      </span>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}
                      {(step.temperature || step.time || step.superSmoke) && (
                        <div className="flex gap-4 text-sm text-gray-600">
                          {step.temperature && (
                            <span className="flex items-center gap-1">
                              {recipe.type?.toLowerCase().trim() === "oven" ? (
                                <MicrowaveIcon sx={{ fontSize: 16 }} />
                              ) : recipe.type?.toLowerCase().trim() ===
                                "beverage" ? (
                                <LocalBarIcon sx={{ fontSize: 16 }} />
                              ) : recipe.type?.toLowerCase().trim() ===
                                "flat-top" ? (
                                <GridOnIcon sx={{ fontSize: 16 }} />
                              ) : recipe.type?.toLowerCase().trim() ===
                                "grill" ? (
                                <WhatshotIcon sx={{ fontSize: 16 }} />
                              ) : recipe.type?.toLowerCase().trim() ===
                                "smoker" ? (
                                <OutdoorGrillIcon sx={{ fontSize: 16 }} />
                              ) : (
                                <FlatwareIcon sx={{ fontSize: 16 }} />
                              )}
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
            </div>

            {/* My Notes */}
            {recipe.myNotes && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {recipe.myNotes}
                </p>
              </div>
            )}

            {/* Cooked This One Up Button - Only for logged in users */}
            {session?.user?.email && (
              <div className="text-center my-8">
                <button
                  onClick={reviewSubmitted ? undefined : handleCookedThisOneUp}
                  disabled={reviewSubmitted}
                  className={`px-8 py-4 rounded-lg text-xl font-bold transition-colors flex items-center gap-2 mx-auto ${
                    reviewSubmitted
                      ? "bg-green-200 text-green-800 cursor-not-allowed"
                      : "bg-gray-200 text-gray-900 hover:text-gray-700 hover:bg-gray-300 cursor-pointer"
                  }`}
                  style={{ minWidth: 220 }}
                >
                  {reviewSubmitted ? (
                    <>
                      <CheckCircleIcon sx={{ fontSize: 36 }} />
                      REVIEW SUBMITTED
                    </>
                  ) : (
                    <>
                      <FactCheckIcon sx={{ fontSize: 36 }} />
                      Cooked, Write Review
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Reviews Section */}
            {recipe.reviews && recipe.reviews.length > 0 && (
              <div className="mb-8">
                <div className="space-y-1">
                  {recipe.reviews
                    .filter((review) => review.status === 1) // Only show published reviews
                    .map((review, index, filteredReviews) => (
                      <div
                        key={review.uuid}
                        className="pb-2 border-b border-gray-300 last:border-b-0"
                      >
                        {editingReviewId === review.uuid ? (
                          // Edit mode
                          <div>
                            {/* Edit Heart Rating */}
                            <div className="mb-1">
                              <Rating
                                name={`edit-review-rating-${review.uuid}`}
                                value={editRating}
                                onChange={(event, newValue) => {
                                  setEditRating(newValue);
                                }}
                                icon={
                                  <HeartIcon
                                    sx={{ color: "#e91e63", fontSize: 20 }}
                                  />
                                }
                                emptyIcon={
                                  <HeartIcon
                                    sx={{ color: "#ccc", fontSize: 20 }}
                                  />
                                }
                                size="small"
                              />
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              Cooked up by {review.userName || review.userEmail}
                              {filteredReviews.length > 1 && index === 0 && (
                                <span>
                                  {" "}
                                  and {filteredReviews.length - 1} others
                                </span>
                              )}{" "}
                              on{" "}
                              {new Date(review.createDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </div>
                            {/* Edit Textarea */}
                            <div className="mb-2">
                              <textarea
                                value={editReviewText}
                                onChange={handleEditReviewTextChange}
                                className="w-full p-2 border border-gray-300 rounded-md resize-none"
                                rows={3}
                                placeholder="Edit your review..."
                              />
                              <div className="text-xs text-gray-500 text-right">
                                {countWordsEdit(editReviewText)}/100 words
                              </div>
                            </div>
                            {/* Edit Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(review.uuid)}
                                disabled={
                                  !editRating ||
                                  editReviewText.trim().length === 0
                                }
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div>
                            {/* Heart Rating */}
                            <div className="mb-1 flex items-center justify-between">
                              <Rating
                                name={`review-rating-${review.uuid}`}
                                value={review.stars}
                                readOnly
                                icon={
                                  <HeartIcon
                                    sx={{ color: "#e91e63", fontSize: 20 }}
                                  />
                                }
                                emptyIcon={
                                  <HeartIcon
                                    sx={{ color: "#ccc", fontSize: 20 }}
                                  />
                                }
                                size="small"
                              />
                              {/* Edit/Delete buttons for own reviews */}
                              {session?.user?.email === review.userEmail && (
                                <div className="flex gap-1">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditReview(review)}
                                    sx={{ fontSize: 16 }}
                                    title="Edit review"
                                  >
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleDeleteReview(review.uuid)
                                    }
                                    sx={{ fontSize: 16 }}
                                    title="Delete review"
                                  >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              Cooked up by {review.userName || review.userEmail}
                              {filteredReviews.length > 1 && index === 0 && (
                                <span>
                                  {" "}
                                  and {filteredReviews.length - 1} others
                                </span>
                              )}{" "}
                              on{" "}
                              {new Date(review.createDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </div>
                            <div className="text-gray-800">
                              {review.reviewText}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
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

          {recipe && currentStep < (recipe?.steps?.length || 0) ? (
            <div className="p-8 text-center flex flex-col justify-center min-h-[300px]">
              <p className="text-2xl text-gray-700 mb-8 leading-relaxed">
                {recipe?.steps[currentStep]?.step}
              </p>

              {/* Step Ingredients */}
              {recipe?.steps[currentStep]?.stepIngredients &&
                recipe?.steps[currentStep]?.stepIngredients.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      INGREDIENTS
                    </h4>
                    <div className="flex flex-col items-center space-y-2">
                      {recipe?.steps[currentStep]?.stepIngredients.map(
                        (stepIngredient, ingredientIndex) => {
                          let ingredient;

                          // First try to find by ingredientIndex (new format)
                          if (
                            typeof stepIngredient.ingredientIndex ===
                              "number" &&
                            stepIngredient.ingredientIndex >= 0 &&
                            stepIngredient.ingredientIndex <
                              recipe.ingredients.length
                          ) {
                            ingredient =
                              recipe.ingredients[
                                stepIngredient.ingredientIndex
                              ];
                          }

                          // Fallback to ID matching (legacy format)
                          if (!ingredient && stepIngredient.ingredientId) {
                            ingredient = recipe.ingredients.find(
                              (ing) => ing.id === stepIngredient.ingredientId
                            );
                          }

                          // Fallback to index parsing from ingredientId
                          if (!ingredient && stepIngredient.ingredientId) {
                            const ingredientIdx = parseInt(
                              stepIngredient.ingredientId
                            );
                            if (
                              !isNaN(ingredientIdx) &&
                              ingredientIdx >= 0 &&
                              ingredientIdx < recipe.ingredients.length
                            ) {
                              ingredient = recipe.ingredients[ingredientIdx];
                            }
                          }

                          if (!ingredient) {
                            return null;
                          }

                          return (
                            <div
                              key={`make-now-${currentStep}-${ingredientIndex}-${ingredient.name}`}
                              className="text-lg font-medium text-gray-800 bg-gray-100 px-4 py-2 rounded-lg"
                            >
                              {ingredient.amount || ""}
                              {ingredient.unit
                                ? ` ${ingredient.unit}`
                                : ""} |{" "}
                              {ingredient.name || "Unknown ingredient"}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {recipe?.steps[currentStep] &&
                (recipe?.steps[currentStep]?.temperature ||
                  recipe?.steps[currentStep]?.time ||
                  recipe?.steps[currentStep]?.superSmoke) && (
                  <div className="flex justify-center gap-6 mb-6">
                    {recipe?.steps[currentStep]?.temperature && (
                      <div className="flex items-center gap-2">
                        {recipe.type?.toLowerCase().trim() === "oven" ? (
                          <MicrowaveIcon sx={{ color: "black" }} />
                        ) : recipe.type?.toLowerCase().trim() === "beverage" ? (
                          <LocalBarIcon sx={{ color: "black" }} />
                        ) : recipe.type?.toLowerCase().trim() === "flat-top" ? (
                          <GridOnIcon sx={{ color: "black" }} />
                        ) : recipe.type?.toLowerCase().trim() === "grill" ? (
                          <WhatshotIcon sx={{ color: "black" }} />
                        ) : recipe.type?.toLowerCase().trim() === "smoker" ? (
                          <OutdoorGrillIcon sx={{ color: "black" }} />
                        ) : (
                          <FlatwareIcon sx={{ color: "black" }} />
                        )}
                        <span>{recipe?.steps[currentStep]?.temperature}°F</span>
                      </div>
                    )}
                    {recipe?.steps[currentStep]?.time && (
                      <div className="flex items-center gap-2">
                        <TimerIcon sx={{ color: "black" }} />
                        <span>{recipe?.steps[currentStep]?.time}m</span>
                      </div>
                    )}
                    {recipe?.steps[currentStep]?.superSmoke && (
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
              <p className="text-lg text-gray-600 mb-6">
                Your recipe is complete. Enjoy your meal!
              </p>
              {session?.user?.email && (
                <button
                  onClick={handleMakeModeToReview}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <FactCheckIcon sx={{ fontSize: 24 }} />
                  Rate This Recipe
                </button>
              )}
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
              {currentStep >= recipe?.steps?.length
                ? "All Done!"
                : `STEP ${currentStep + 1} of ${recipe?.steps?.length || 0}`}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {recipe?.steps && currentStep < (recipe?.steps?.length || 0)
                ? ""
                : "Recipe complete!"}
            </div>
          </div>

          {recipe?.steps && currentStep < (recipe?.steps?.length || 0) ? (
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

      {/* Review Modal Dialog */}
      <Dialog
        open={reviewModalOpen}
        onClose={handleCloseReviewModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle></DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {/* Rating with Hearts */}
          <div className="text-center mb-6">
            <Rating
              name="recipe-rating"
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              icon={<HeartIcon sx={{ color: "#e91e63", fontSize: 48 }} />}
              emptyIcon={<HeartIcon sx={{ color: "#ccc", fontSize: 48 }} />}
              size="large"
              max={5}
            />
          </div>

          {/* Review Textarea */}
          <div>
            <TextField
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={reviewText}
              onChange={handleReviewTextChange}
              placeholder="In 100 words share your thoughts about this recipe"
              sx={{ mb: 1 }}
            />
            <div className="text-right text-sm text-gray-500">
              {countWords(reviewText)}/100 words
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", p: 3 }}>
          <Button onClick={handleCloseReviewModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={!rating || reviewText.trim().length === 0}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
});

export default RecipeDetail;
