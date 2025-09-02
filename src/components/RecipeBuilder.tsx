"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  PhotoCamera as PhotoCameraIcon,
  LocalDining as LocalDiningIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Crop as CropIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  RestartAlt as ResetIcon,
} from "@mui/icons-material";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { renderFooter } from "./shared/footerHelpers";
import { useSession, signIn, signOut } from "next-auth/react";

type Recipe = {
  id: number;
  slug: string;
  title: string;
  description: string;
  source?: string;
  type: "smoker" | "flat-top" | "grill" | "oven" | "beverage";
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
  author_email?: string;
  favorite: boolean;
  public: boolean;
  date: string;
  shared_family?: number;
  familyPhoto?: string;
  familyNotes?: string;
};

const RecipeBuilder: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit");
  const { data: session, status } = useSession();
  const [nameFromDB, setNameFromDB] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [isCustomSourceTitle, setIsCustomSourceTitle] = useState(false);
  const [type, setType] = useState<
    "Smoker" | "Flat-top" | "Grill" | "Oven" | "Beverage" | ""
  >("");
  const [recommendedPellets, setRecommendedPellets] = useState("");
  const [category, setCategory] = useState<string>("Dinner");
  const [photo, setPhoto] = useState("");
  const [imageError, setImageError] = useState(false);

  // Image crop state
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [originalImage, setOriginalImage] = useState("");
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [zoom, setZoom] = useState(1);
  const [sharpening, setSharpening] = useState(0.5); // 0 = no sharpening, 1 = max sharpening
  const imgRef = useRef<HTMLImageElement>(null);

  const [prepTime, setPrepTime] = useState(0);
  const [cookTime, setCookTime] = useState(0);
  const [cookHours, setCookHours] = useState(0);
  const [cookMinutes, setCookMinutes] = useState(0);
  const [servings, setServings] = useState(1);
  const [slug, setSlug] = useState("");
  const [ingredients, setIngredients] = useState<
    Array<{
      id: string;
      name: string;
      amount: string;
      unit: string;
      customUnit?: string;
      showCustomUnit?: boolean;
      stepNumber?: number;
    }>
  >([
    { id: crypto.randomUUID(), name: "", amount: "", unit: "", stepNumber: 0 },
  ]);
  const [steps, setSteps] = useState<
    Array<{
      id: string;
      step: string;
      temperature?: number;
      time?: number;
      timeInput?: string;
      superSmoke?: boolean;
      isCustomTemp?: boolean;
      stepIngredients?: Array<{
        id: string;
        ingredientId: string;
      }>;
    }>
  >([{ id: crypto.randomUUID(), step: "", timeInput: "" }]);
  const [myNotes, setMyNotes] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Accordion state
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [ingredientsExpanded, setIngredientsExpanded] = useState(true);

  const handleImportRecipe = async () => {
    if (!importUrl) return;

    setIsImporting(true);
    try {
      const response = await fetch("/api/import-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: importUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to import recipe");
      }

      const recipe = await response.json();

      // Populate form fields with imported data
      setTitle(recipe.title || "");
      setDescription(recipe.description || "");
      setSource(importUrl); // Use the URL as the source

      // Handle sourceTitle for imported recipes - leave empty for user to fill manually
      setSourceTitle("");
      setIsCustomSourceTitle(false);
      // Process ingredients first so we can reference them when loading step ingredients
      const processedIngredients = recipe.ingredients?.map(
        (ing: {
          name?: string;
          amount?: string;
          unit?: string;
          stepNumber?: number;
        }) => {
          const unit = ing.unit || "";
          // Check if the unit is in our predefined options
          const isCustomUnit =
            unit && !unitOptions.includes(unit) && unit !== "Other";
          return {
            id: crypto.randomUUID(),
            name: ing.name || "",
            amount: ing.amount || "",
            unit: isCustomUnit ? "" : unit,
            customUnit: isCustomUnit ? unit : "",
            showCustomUnit: isCustomUnit,
            stepNumber: ing.stepNumber || 0,
          };
        }
      ) || [
        {
          id: crypto.randomUUID(),
          name: "",
          amount: "",
          unit: "",
          stepNumber: 0,
        },
      ];

      setIngredients(processedIngredients);
      setSteps(
        recipe.steps?.map(
          (step: {
            step?: string;
            temperature?: number;
            time?: number;
            superSmoke?: boolean;
            stepIngredients?: Array<{
              ingredientId: string;
            }>;
          }) => {
            const temperature = step.temperature;
            // For imported recipes, check if temperature is custom for oven type
            const predefinedTemps = [
              250,
              350,
              450,
              "bake350",
              "bake400",
              "bake",
              "roast",
              "broil",
            ];
            const isCustomTemp =
              type === "Oven" &&
              temperature !== undefined &&
              !predefinedTemps.includes(temperature);

            return {
              id: crypto.randomUUID(),
              step: step.step || "",
              temperature: temperature,
              time: step.time,
              superSmoke: step.superSmoke,
              isCustomTemp: isCustomTemp,
              stepIngredients:
                step.stepIngredients
                  ?.map(
                    (si: {
                      ingredientIndex?: number;
                      ingredientId?: string;
                    }) => {
                      let ingredientId = "";

                      // Handle new ingredientIndex format
                      if (
                        typeof si.ingredientIndex === "number" &&
                        si.ingredientIndex >= 0
                      ) {
                        // Find the ingredient at the saved index and use its current ID
                        const targetIngredient =
                          processedIngredients[si.ingredientIndex];
                        if (targetIngredient) {
                          ingredientId = targetIngredient.id;
                        }
                      }
                      // Handle legacy ingredientId format
                      else if (si.ingredientId) {
                        ingredientId = si.ingredientId;
                      }

                      return {
                        id: crypto.randomUUID(),
                        ingredientId: ingredientId,
                      };
                    }
                  )
                  .filter((si) => si.ingredientId) || [],
            };
          }
        ) || [{ id: crypto.randomUUID(), step: "" }]
      );
      setPrepTime(recipe.prepTime || 0);
      setCookTime(recipe.cookTime || 0);
      setServings(recipe.servings || 1);
    } catch (error) {
      console.error("Error importing recipe:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsImporting(false);
    }
  };
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  // Family recipe sharing state
  const [sharedFamily, setSharedFamily] = useState(false);
  const [familyPhoto, setFamilyPhoto] = useState("");
  const [familyNotes, setFamilyNotes] = useState("");
  const [familyPhotoError, setFamilyPhotoError] = useState(false);

  // Family image crop state
  const [showFamilyCropDialog, setShowFamilyCropDialog] = useState(false);
  const [originalFamilyImage, setOriginalFamilyImage] = useState("");
  const [familyCrop, setFamilyCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [familyZoom, setFamilyZoom] = useState(1);
  const [familySharpening, setFamilySharpening] = useState(0.5);
  const familyImgRef = useRef<HTMLImageElement>(null);

  const categoryOptions = useMemo<string[]>(
    () => ["Dinner", "Side", "Dessert", "Breakfast", "Cocktails"],
    []
  );
  const typeOptions = useMemo<string[]>(
    () => ["Smoker", "Flat-top", "Grill", "Oven", "Beverage"],
    []
  );
  const sourceTitleOptions = useMemo<string[]>(
    () => [
      "Traeger Kitchen",
      "Blackstone Griddle",
      "Hello Fresh",
      "Home Chef",
      "Cocktail Project",
      "Other",
    ],
    []
  );

  const unitOptions = useMemo<string[]>(
    () => [
      "oz",
      "tsp",
      "Tbsp",
      "taste",
      "each",
      "lb",
      "cup",
      "cups",
      "pint",
      "quart",
      "gallon",
      "ml",
      "liter",
      "gram",
      "kg",
      "clove",
      "cloves",
      "slice",
      "slices",
      "bunch",
      "head",
      "can",
      "bottle",
      "package",
      "Other",
    ],
    []
  );

  // Function to parse fractions and decimals to numbers
  const parseFractionToNumber = (value: string): number => {
    if (!value || value.trim() === "") return 0;

    const trimmed = value.trim();

    // Handle mixed numbers like "1 1/2"
    const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseInt(mixedMatch[1]);
      const numerator = parseInt(mixedMatch[2]);
      const denominator = parseInt(mixedMatch[3]);
      return whole + numerator / denominator;
    }

    // Handle simple fractions like "1/2", "3/4"
    const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
      const numerator = parseInt(fractionMatch[1]);
      const denominator = parseInt(fractionMatch[2]);
      return numerator / denominator;
    }

    // Handle regular decimals
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Function to convert decimal to fraction with Unicode characters
  const formatAmountAsFraction = (amount: number): string => {
    if (amount === 0) return "";

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

  // Authentication check
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      signIn("google");
    }
  }, [session, status]);

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

  // Load recipe for editing
  useEffect(() => {
    if (!editId) return;

    async function loadRecipe() {
      try {
        if (!session?.user?.email) return;

        const res = await fetch(
          `/api/recipes?userEmail=${encodeURIComponent(session.user.email)}`
        );
        const recipes = await res.json();
        const recipe = recipes.find(
          (r: Recipe) => r.id === parseInt(editId || "0")
        );

        if (recipe) {
          setTitle(recipe.title || "");
          setDescription(recipe.description || "");
          setSource(recipe.source || "");

          // Handle sourceTitle - check if it's one of the predefined options
          const loadedSourceTitle = recipe.sourceTitle || "";
          if (sourceTitleOptions.includes(loadedSourceTitle)) {
            setSourceTitle(loadedSourceTitle);
            setIsCustomSourceTitle(false);
          } else if (loadedSourceTitle) {
            setSourceTitle(loadedSourceTitle);
            setIsCustomSourceTitle(true);
          } else {
            setSourceTitle("");
            setIsCustomSourceTitle(false);
          }

          // Handle legacy type names ("smoker" -> "Smoker")
          const loadedType = recipe.type || "Grill";
          const normalizedType =
            loadedType.charAt(0).toUpperCase() + loadedType.slice(1);
          setType(
            normalizedType as
              | "Smoker"
              | "Flat-top"
              | "Grill"
              | "Oven"
              | "Beverage"
          );
          setRecommendedPellets(recipe.recommendedPellets || "");
          // Match the category case-sensitively with our options
          const matchedCategory =
            categoryOptions.find(
              (cat: string) =>
                cat.toLowerCase() === (recipe.category || "").toLowerCase()
            ) || "Dinner";
          // Load family recipe details
          setFamilyPhoto(recipe.familyPhoto || "");
          setFamilyNotes(recipe.familyNotes || "");
          setCategory(matchedCategory);
          setPhoto(recipe.photo || "");
          setImageError(false); // Reset image error when loading recipe
          setPrepTime(recipe.prepTime || 0);
          setCookTime(recipe.cookTime || 0);
          setCookHours(Math.floor((recipe.cookTime || 0) / 60));
          setCookMinutes((recipe.cookTime || 0) % 60);
          setServings(recipe.servings || 1);
          setSlug(recipe.slug || "");
          // Process ingredients first for URL import
          const urlImportIngredients = recipe.ingredients?.length
            ? recipe.ingredients.map(
                (ing: {
                  name?: string;
                  amount?: number;
                  unit?: string;
                  stepNumber?: number;
                }) => {
                  const unit = ing.unit || "";
                  // Check if the unit is in our predefined options
                  const isCustomUnit =
                    unit && !unitOptions.includes(unit) && unit !== "Other";
                  return {
                    id: crypto.randomUUID(),
                    name: ing.name || "",
                    amount: formatAmountAsFraction(ing.amount || 0),
                    unit: isCustomUnit ? "" : unit,
                    customUnit: isCustomUnit ? unit : "",
                    showCustomUnit: isCustomUnit,
                    stepNumber: ing.stepNumber || 0,
                  };
                }
              )
            : [
                {
                  id: crypto.randomUUID(),
                  name: "",
                  amount: "",
                  unit: "",
                  stepNumber: 0,
                },
              ];

          setIngredients(urlImportIngredients);
          setSteps(
            recipe.steps?.length
              ? recipe.steps.map(
                  (step: {
                    step?: string;
                    temperature?: number;
                    time?: number;
                    superSmoke?: boolean;
                    stepIngredients?: Array<{
                      ingredientId: string;
                    }>;
                  }) => {
                    const temperature = step.temperature || undefined;
                    // For oven type, determine if temperature is custom
                    const predefinedTemps = [
                      250,
                      350,
                      450,
                      "bake350",
                      "bake400",
                      "bake",
                      "roast",
                      "broil",
                    ];
                    const isCustomTemp =
                      normalizedType === "Oven" &&
                      temperature !== undefined &&
                      !predefinedTemps.includes(temperature);

                    return {
                      id: crypto.randomUUID(),
                      step: step.step || "",
                      temperature: temperature,
                      time: step.time || undefined,
                      superSmoke: step.superSmoke || false,
                      isCustomTemp: isCustomTemp,
                      stepIngredients:
                        step.stepIngredients
                          ?.map(
                            (si: {
                              ingredientIndex?: number;
                              ingredientId?: string;
                            }) => {
                              let ingredientId = "";

                              // Handle new ingredientIndex format
                              if (
                                typeof si.ingredientIndex === "number" &&
                                si.ingredientIndex >= 0
                              ) {
                                // Find the ingredient at the saved index and use its current ID
                                const targetIngredient =
                                  urlImportIngredients[si.ingredientIndex];
                                if (targetIngredient) {
                                  ingredientId = targetIngredient.id;
                                }
                              }
                              // Handle legacy ingredientId format
                              else if (si.ingredientId) {
                                ingredientId = si.ingredientId;
                              }

                              return {
                                id: crypto.randomUUID(),
                                ingredientId: ingredientId,
                              };
                            }
                          )
                          .filter((si) => si.ingredientId) || [],
                    };
                  }
                )
              : [{ id: crypto.randomUUID(), step: "" }]
          );
          setMyNotes(recipe.myNotes || "");
          setFavorite(recipe.favorite || false);
          setIsPublic(recipe.public || false);
          setSharedFamily(
            recipe.shared_family === 1 || recipe.shared_family === true
          );
        }
      } catch (error) {
        console.error("Error loading recipe:", error);
      }
    }

    loadRecipe();
  }, [
    editId,
    session?.user?.email,
    categoryOptions,
    typeOptions,
    sourceTitleOptions,
    unitOptions,
  ]);

  const handleIngredientChange = (
    index: number,
    field: keyof (typeof ingredients)[0],
    value: string | number
  ) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const handleUnitChange = (index: number, unit: string) => {
    setIngredients((prev) =>
      prev.map((ing, i) => {
        if (i === index) {
          if (unit === "Other") {
            return { ...ing, unit: "", showCustomUnit: true, customUnit: "" };
          } else {
            return { ...ing, unit, showCustomUnit: false, customUnit: "" };
          }
        }
        return ing;
      })
    );
  };

  const handleCustomUnitChange = (index: number, customUnit: string) => {
    setIngredients((prev) =>
      prev.map((ing, i) =>
        i === index ? { ...ing, customUnit, unit: customUnit } : ing
      )
    );
  };

  const handleBackToUnitSelect = (index: number) => {
    setIngredients((prev) =>
      prev.map((ing, i) =>
        i === index
          ? { ...ing, showCustomUnit: false, unit: "", customUnit: "" }
          : ing
      )
    );
  };

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        amount: "",
        unit: "",
        stepNumber: 0,
      },
    ]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Helper to parse time like '1h 30m' or '90m' or '2h' to total minutes
  const parseTimeToMinutes = (input: string): number => {
    if (!input) return 0;
    let total = 0;
    // Match hours and minutes
    const hourMatch = input.match(/(\d+)\s*h/);
    const minMatch = input.match(/(\d+)\s*m/);
    if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) total += parseInt(minMatch[1], 10);
    // If only a number is entered, treat as minutes
    if (!hourMatch && !minMatch && /^\d+$/.test(input.trim())) {
      total = parseInt(input.trim(), 10);
    }
    return total;
  };

  const handleStepChange = (
    index: number,
    field: keyof (typeof steps)[0],
    value: string | number | boolean,
    opts?: { commitTime?: boolean }
  ) => {
    if (field === "time" && typeof value === "string") {
      if (opts?.commitTime) {
        // Commit: parse and store as minutes, clear timeInput
        const minutes = parseTimeToMinutes(value);
        setSteps((prev) =>
          prev.map((step, i) =>
            i === index ? { ...step, time: minutes, timeInput: "" } : step
          )
        );
      } else {
        // Just update the input string
        setSteps((prev) =>
          prev.map((step, i) =>
            i === index ? { ...step, timeInput: value } : step
          )
        );
      }
    } else {
      setSteps((prev) =>
        prev.map((step, i) =>
          i === index ? { ...step, [field]: value } : step
        )
      );
    }
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { id: crypto.randomUUID(), step: "", timeInput: "" },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Step ingredient functions
  const addStepIngredient = (stepIndex: number) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === stepIndex
          ? {
              ...step,
              stepIngredients: [
                ...(step.stepIngredients || []),
                { id: crypto.randomUUID(), ingredientId: "" },
              ],
            }
          : step
      )
    );
  };

  const updateStepIngredient = (
    stepIndex: number,
    ingredientIndex: number,
    ingredientId: string
  ) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === stepIndex
          ? {
              ...step,
              stepIngredients: step.stepIngredients?.map((ing, j) =>
                j === ingredientIndex ? { ...ing, ingredientId } : ing
              ),
            }
          : step
      )
    );
  };

  const removeStepIngredient = (stepIndex: number, ingredientIndex: number) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === stepIndex
          ? {
              ...step,
              stepIngredients: step.stepIngredients?.filter(
                (_, j) => j !== ingredientIndex
              ),
            }
          : step
      )
    );
  };

  // Reorder functions
  const reorderIngredients = (startIndex: number, endIndex: number) => {
    setIngredients((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const reorderSteps = (startIndex: number, endIndex: number) => {
    setSteps((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  // Drag and drop handlers
  const [draggedItem, setDraggedItem] = useState<{
    type: string;
    index: number;
  } | null>(null);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
    type: "ingredient" | "step"
  ) => {
    setDraggedItem({ type, index });
    e.dataTransfer.setData("text/plain", `${type}-${index}`);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number,
    type: "ingredient" | "step"
  ) => {
    e.preventDefault();
    const dragData = e.dataTransfer.getData("text/plain");
    const [dragType, dragIndexStr] = dragData.split("-");
    const dragIndex = parseInt(dragIndexStr);

    if (dragType === type && dragIndex !== dropIndex) {
      if (type === "ingredient") {
        reorderIngredients(dragIndex, dropIndex);
      } else {
        reorderSteps(dragIndex, dropIndex);
      }
    }
    setDraggedItem(null);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setOriginalImage(imageDataUrl);
        setShowCropDialog(true);
        setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to apply sharpening filter to canvas
  const sharpenImage = useCallback(
    (canvas: HTMLCanvasElement, intensity: number = 0.5): HTMLCanvasElement => {
      const ctx = canvas.getContext("2d");
      if (!ctx || intensity === 0) return canvas;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // Create a copy for the sharpened image
      const sharpened = new ImageData(width, height);
      const sharpenedData = sharpened.data;

      // Adaptive sharpening kernel based on intensity
      // Base kernel for intensity = 1.0
      const baseCenter = 5;
      const baseEdge = -1;

      // Scale kernel values by intensity
      const center = 1 + (baseCenter - 1) * intensity;
      const edge = baseEdge * intensity;

      const kernel = [0, edge, 0, edge, center, edge, 0, edge, 0];

      // Apply convolution
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) {
            // RGB channels only
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
                const kernelIndex = (ky + 1) * 3 + (kx + 1);
                sum += data[pixelIndex] * kernel[kernelIndex];
              }
            }

            const outputIndex = (y * width + x) * 4 + c;
            sharpenedData[outputIndex] = Math.max(0, Math.min(255, sum));
          }

          // Copy alpha channel unchanged
          const alphaIndex = (y * width + x) * 4 + 3;
          const originalAlphaIndex = (y * width + x) * 4 + 3;
          sharpenedData[alphaIndex] = data[originalAlphaIndex];
        }
      }

      // Copy edges unchanged (kernel can't be applied to edges)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
            const index = (y * width + x) * 4;
            for (let c = 0; c < 4; c++) {
              sharpenedData[index + c] = data[index + c];
            }
          }
        }
      }

      // Create new canvas with sharpened image
      const sharpenedCanvas = document.createElement("canvas");
      sharpenedCanvas.width = width;
      sharpenedCanvas.height = height;
      const sharpenedCtx = sharpenedCanvas.getContext("2d");
      if (sharpenedCtx) {
        sharpenedCtx.putImageData(sharpened, 0, 0);
      }

      return sharpenedCanvas;
    },
    []
  );

  // Function to generate cropped canvas
  const getCroppedImg = useCallback(
    (
      image: HTMLImageElement,
      crop: PixelCrop,
      sharpeningIntensity: number = 0.5
    ): HTMLCanvasElement => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Since we're now properly converting percentage to pixels,
      // and the crop coordinates are relative to the displayed image,
      // we need to scale them to the natural image dimensions
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Convert the crop coordinates to natural image coordinates
      const sourceX = crop.x * scaleX;
      const sourceY = crop.y * scaleY;
      const sourceWidth = crop.width * scaleX;
      const sourceHeight = crop.height * scaleY;

      // Use the actual cropped dimensions to maintain original resolution
      const outputWidth = Math.round(sourceWidth);
      const outputHeight = Math.round(sourceHeight);

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw the cropped portion from the natural image, scaling to fit the output size
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      // Apply sharpening to the cropped image
      return sharpenImage(canvas, sharpeningIntensity);
    },
    [sharpenImage]
  );

  const handleCropComplete = useCallback(() => {
    if (!imgRef.current || !crop.width || !crop.height) return;

    // Convert percentage crop to pixel crop based on the actual displayed image size
    const imageElement = imgRef.current;
    const pixelCrop: PixelCrop = {
      x: (crop.x / 100) * imageElement.width,
      y: (crop.y / 100) * imageElement.height,
      width: (crop.width / 100) * imageElement.width,
      height: (crop.height / 100) * imageElement.height,
      unit: "px",
    };

    const croppedCanvas = getCroppedImg(imageElement, pixelCrop, sharpening);

    const croppedImageUrl = croppedCanvas.toDataURL("image/jpeg", 0.9);
    setPhoto(croppedImageUrl);
    // Update originalImage so subsequent crops work from the latest version
    setOriginalImage(croppedImageUrl);
    setShowCropDialog(false);
  }, [crop, sharpening, getCroppedImg]);

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    });
    setZoom(1);
  };

  // Family photo handlers
  const handleFamilyPhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setOriginalFamilyImage(imageDataUrl);
        setShowFamilyCropDialog(true);
        setFamilyPhotoError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFamilyCropComplete = useCallback(() => {
    if (!familyImgRef.current || !familyCrop.width || !familyCrop.height)
      return;

    // Convert percentage crop to pixel crop based on the actual displayed image size
    const imageElement = familyImgRef.current;
    const pixelCrop: PixelCrop = {
      x: (familyCrop.x / 100) * imageElement.width,
      y: (familyCrop.y / 100) * imageElement.height,
      width: (familyCrop.width / 100) * imageElement.width,
      height: (familyCrop.height / 100) * imageElement.height,
      unit: "px",
    };

    const croppedCanvas = getCroppedImg(
      imageElement,
      pixelCrop,
      familySharpening
    );

    const croppedImageUrl = croppedCanvas.toDataURL("image/jpeg", 0.9);
    setFamilyPhoto(croppedImageUrl);
    // Update originalFamilyImage so subsequent crops work from the latest version
    setOriginalFamilyImage(croppedImageUrl);
    setShowFamilyCropDialog(false);
  }, [familyCrop, familySharpening, getCroppedImg]);

  const handleFamilyCropCancel = () => {
    setShowFamilyCropDialog(false);
    setFamilyCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    });
    setFamilyZoom(1);
  };

  // Reset functions for crop modals
  const handleCropReset = () => {
    setCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    });
    setZoom(1);
    setSharpening(0.5);
  };

  const handleFamilyCropReset = () => {
    setFamilyCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    });
    setFamilyZoom(1);
    setFamilySharpening(0.5);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Please fill in title and description");
      return;
    }

    setSaving(true);
    try {
      // Convert ingredients format for API
      const apiIngredients = ingredients
        .filter((ing) => ing.name && ing.name.trim())
        .map((ing) => ({
          name: ing.name.trim(),
          amount: parseFractionToNumber(ing.amount),
          unit: ing.customUnit || ing.unit || "",
          stepNumber: ing.stepNumber || 0,
        }));

      // Convert steps format for API
      const apiSteps = steps
        .filter((step) => step.step && step.step.trim())
        .map((step) => ({
          step: step.step.trim(),
          temperature: step.temperature,
          time: step.time,
          superSmoke: step.superSmoke || false,
          stepIngredients:
            step.stepIngredients
              ?.filter((si) => si.ingredientId)
              .map((si) => {
                // Find the ingredient index for this ingredient ID
                const ingredientIndex = ingredients.findIndex(
                  (ing) => ing.id === si.ingredientId
                );
                return {
                  ingredientIndex: ingredientIndex,
                };
              })
              .filter((si) => si.ingredientIndex >= 0) || [],
        }));

      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        source: source.trim() || undefined,
        sourceTitle: sourceTitle.trim() || undefined,
        type,
        recommendedPellets: recommendedPellets || "",
        category,
        photo: photo || "",
        prepTime: prepTime || 0,
        cookTime: cookTime || 0,
        servings: servings || 1,
        shared_family: sharedFamily ? 1 : 0,
        familyPhoto: familyPhoto || "",
        familyNotes: familyNotes || "",
        ingredients: apiIngredients,
        steps: apiSteps,
        notes: myNotes || "",
        favorite: favorite || false,
        public: isPublic || false,
        userEmail: session?.user?.email,
        userName: session?.user?.name,
        author: session?.user?.name || "",
        author_email: session?.user?.email || "",
      };

      const method = editId ? "PUT" : "POST";
      const body = editId
        ? {
            ...recipeData,
            id: parseInt(editId),
            slug: slug,
            userEmail: session?.user?.email,
            shared_family: sharedFamily ? 1 : 0,
          }
        : recipeData;

      console.log("Saving recipe data:", body); // Debug log

      const res = await fetch("/api/recipes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/recipes");
      } else {
        const errorData = await res.text();
        console.error("Server error:", errorData);
        alert(`Error saving recipe: ${res.status} ${res.statusText}`);
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert(
        `Error saving recipe: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editId || !session?.user?.email || !slug) return;

    if (confirm("Are you sure you want to delete this recipe?")) {
      try {
        const res = await fetch("/api/recipes", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: parseInt(editId),
            slug: slug,
            userEmail: session.user.email,
          }),
        });

        if (res.ok) {
          router.push("/recipes");
        } else {
          const errorData = await res.json();
          console.error("Delete error:", errorData);
          alert(`Error deleting recipe: ${errorData.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error deleting recipe:", error);
        alert("Error deleting recipe");
      }
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400 font-mono">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to create or edit recipes.
          </p>
          <button
            onClick={() => signIn("google")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Image Crop Dialog */}
      <Dialog
        open={showCropDialog}
        onClose={handleCropCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <div className="flex items-center justify-between">
            <span>Crop & Zoom Photo</span>
            <IconButton onClick={handleCropCancel}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4">
            {originalImage && (
              <div className="relative">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  aspect={16 / 9}
                  circularCrop={false}
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={originalImage}
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "center",
                      maxWidth: "100%",
                      maxHeight: "400px",
                    }}
                  />
                </ReactCrop>
              </div>
            )}

            {/* Zoom Control */}
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" gutterBottom>
                Zoom
              </Typography>
              <div className="flex items-center gap-2">
                <IconButton
                  size="small"
                  onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                >
                  <ZoomOutIcon />
                </IconButton>
                <Slider
                  value={zoom}
                  onChange={(_, value) => setZoom(value as number)}
                  min={1}
                  max={2}
                  step={0.1}
                  sx={{ flex: 1, mx: 2 }}
                />
                <IconButton
                  size="small"
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                >
                  <ZoomInIcon />
                </IconButton>
              </div>
            </Box>

            {/* Sharpening Control */}
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" gutterBottom>
                Sharpening
              </Typography>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-8">Off</span>
                <Slider
                  value={sharpening}
                  onChange={(_, value) => setSharpening(value as number)}
                  min={0}
                  max={1}
                  step={0.1}
                  sx={{ flex: 1, mx: 2 }}
                />
                <span className="text-xs text-gray-500 w-8">Max</span>
              </div>
            </Box>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCropCancel} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleCropReset}
            variant="outlined"
            startIcon={<ResetIcon />}
          >
            Reset
          </Button>
          <Button
            onClick={handleCropComplete}
            variant="contained"
            startIcon={<CheckIcon />}
          >
            Apply Crop
          </Button>
        </DialogActions>
      </Dialog>

      {/* Family Image Crop Dialog */}
      <Dialog
        open={showFamilyCropDialog}
        onClose={handleFamilyCropCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <div className="flex items-center justify-between">
            <span>Crop & Zoom Family Photo</span>
            <IconButton onClick={handleFamilyCropCancel}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4">
            {originalFamilyImage && (
              <div className="relative">
                <ReactCrop
                  crop={familyCrop}
                  onChange={(_, percentCrop) => setFamilyCrop(percentCrop)}
                  aspect={16 / 9}
                  circularCrop={false}
                >
                  <img
                    ref={familyImgRef}
                    alt="Crop family photo"
                    src={originalFamilyImage}
                    style={{
                      transform: `scale(${familyZoom})`,
                      transformOrigin: "center",
                      maxWidth: "100%",
                      maxHeight: "400px",
                    }}
                  />
                </ReactCrop>
              </div>
            )}

            {/* Zoom Control */}
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" gutterBottom>
                Zoom
              </Typography>
              <div className="flex items-center gap-2">
                <IconButton
                  size="small"
                  onClick={() => setFamilyZoom(Math.max(1, familyZoom - 0.1))}
                >
                  <ZoomOutIcon />
                </IconButton>
                <Slider
                  value={familyZoom}
                  onChange={(_, value) => setFamilyZoom(value as number)}
                  min={1}
                  max={2}
                  step={0.1}
                  sx={{ flex: 1, mx: 2 }}
                />
                <IconButton
                  size="small"
                  onClick={() => setFamilyZoom(Math.min(2, familyZoom + 0.1))}
                >
                  <ZoomInIcon />
                </IconButton>
              </div>
            </Box>

            {/* Sharpening Control */}
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" gutterBottom>
                Sharpening
              </Typography>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-8">Off</span>
                <Slider
                  value={familySharpening}
                  onChange={(_, value) => setFamilySharpening(value as number)}
                  min={0}
                  max={1}
                  step={0.1}
                  sx={{ flex: 1, mx: 2 }}
                />
                <span className="text-xs text-gray-500 w-8">Max</span>
              </div>
            </Box>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFamilyCropCancel} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleFamilyCropReset}
            variant="outlined"
            startIcon={<ResetIcon />}
          >
            Reset
          </Button>
          <Button
            onClick={handleFamilyCropComplete}
            variant="contained"
            startIcon={<CheckIcon />}
          >
            Apply Crop
          </Button>
        </DialogActions>
      </Dialog>

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
            <h3 className="text-lg font-semibold text-gray-800">
              {editId ? "Edit Recipe" : "Create Recipe"}
            </h3>
          </div>

          {/* Auth Info - Desktop only */}
          <div className="hidden sm:flex items-center gap-2 pr-4">
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
        </div>

        {/* Mobile Auth UI - Only visible on mobile */}
        <div className="sm:hidden px-3 py-2 border-b border-gray-200 flex justify-center">
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
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Info */}
                <Card sx={{ boxShadow: "none", border: "none" }}>
                  <CardContent>
                    {/* <Typography variant="h6" sx={{ mb: 2 }}>
                    Basic Information
                  </Typography> */}

                    {/* Photo Upload */}
                    <div className="mt-0">
                      <Typography variant="subtitle1" gutterBottom>
                        Recipe Photo
                      </Typography>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {photo && !imageError ? (
                          <div className="space-y-4">
                            <Image
                              src={photo}
                              alt="Recipe preview"
                              width={400}
                              height={225}
                              className="w-full h-48 object-cover rounded-lg bg-gray-50"
                              onError={() => setImageError(true)}
                            />
                            <div className="flex gap-1 sm:gap-2">
                              <Button
                                variant="outlined"
                                startIcon={<PhotoCameraIcon />}
                                component="label"
                                size="small"
                                className="flex-1 text-xs sm:text-sm"
                              >
                                <span className="hidden sm:inline">
                                  Change Photo
                                </span>
                                <span className="sm:hidden">Change</span>
                                <input
                                  type="file"
                                  hidden
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                />
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<CropIcon />}
                                onClick={() => {
                                  setOriginalImage(photo);
                                  setShowCropDialog(true);
                                }}
                                size="small"
                                className="flex-1 text-xs sm:text-sm"
                              >
                                <span className="hidden sm:inline">
                                  Crop & Zoom
                                </span>
                                <span className="sm:hidden">Crop</span>
                              </Button>
                            </div>
                          </div>
                        ) : photo && imageError ? (
                          <div className="space-y-4">
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg">
                              <LocalDiningIcon
                                sx={{ fontSize: 48, color: "#9CA3AF" }}
                              />
                            </div>
                            <div className="flex gap-1 sm:gap-2">
                              <Button
                                variant="outlined"
                                startIcon={<PhotoCameraIcon />}
                                component="label"
                                size="small"
                                className="flex-1 text-xs sm:text-sm"
                              >
                                <span className="hidden sm:inline">
                                  Change Photo
                                </span>
                                <span className="sm:hidden">Change</span>
                                <input
                                  type="file"
                                  hidden
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                />
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<CropIcon />}
                                onClick={() => {
                                  setOriginalImage(photo);
                                  setShowCropDialog(true);
                                }}
                                size="small"
                                className="flex-1 text-xs sm:text-sm"
                              >
                                <span className="hidden sm:inline">
                                  Crop & Zoom
                                </span>
                                <span className="sm:hidden">Crop</span>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <PhotoCameraIcon
                              sx={{ fontSize: 48, color: "gray" }}
                            />
                            <div>
                              <Button
                                variant="contained"
                                startIcon={<PhotoCameraIcon />}
                                component="label"
                              >
                                Upload Photo
                                <input
                                  type="file"
                                  hidden
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <FormControl fullWidth margin="normal" sx={{ mt: 4 }}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={category}
                        label="Category"
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {categoryOptions.map((option: string) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal" sx={{ mt: 2 }}>
                      <InputLabel>Cooking Type</InputLabel>
                      <Select
                        value={type}
                        label="Cooking Type"
                        onChange={(e) =>
                          setType(
                            e.target.value as
                              | "Smoker"
                              | "Flat-top"
                              | "Grill"
                              | "Oven"
                              | "Beverage"
                          )
                        }
                      >
                        {typeOptions.map((option: string) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {type === "Smoker" && (
                      <TextField
                        fullWidth
                        label="Recommended Pellets"
                        value={recommendedPellets}
                        onChange={(e) => setRecommendedPellets(e.target.value)}
                        margin="normal"
                      />
                    )}

                    <TextField
                      fullWidth
                      label="Recipe Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      margin="normal"
                      required
                    />

                    <TextField
                      fullWidth
                      label="Recipe Source URL"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      margin="normal"
                      placeholder="e.g., www.foodnetwork.com"
                    />

                    {/* Recipe Source Title - Select or Custom Input */}
                    {isCustomSourceTitle ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginTop: "16px",
                          marginBottom: "8px",
                        }}
                      >
                        <IconButton
                          onClick={() => {
                            setIsCustomSourceTitle(false);
                            setSourceTitle("");
                          }}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <ArrowBackIcon />
                        </IconButton>
                        <TextField
                          fullWidth
                          label="Custom Recipe Source Title"
                          value={sourceTitle}
                          onChange={(e) => setSourceTitle(e.target.value)}
                          placeholder="Enter custom source title"
                        />
                      </div>
                    ) : (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Recipe Source Title</InputLabel>
                        <Select
                          value={sourceTitle}
                          label="Recipe Source Title"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "Other") {
                              setIsCustomSourceTitle(true);
                              setSourceTitle("");
                            } else {
                              setSourceTitle(value);
                            }
                          }}
                        >
                          {sourceTitleOptions.map((option: string) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    <TextField
                      fullWidth
                      label="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      margin="normal"
                      multiline
                      minRows={3}
                      maxRows={8}
                      required
                    />

                    <div className="flex flex-col">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={favorite}
                            onChange={(e) => setFavorite(e.target.checked)}
                          />
                        }
                        label="Mark as Favorite"
                        sx={{ mt: 2 }}
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                          />
                        }
                        label="Mark as Public"
                        sx={{ mt: 1 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={sharedFamily}
                            onChange={(e) => setSharedFamily(e.target.checked)}
                          />
                        }
                        label="Make Shareable With Family"
                        sx={{ mt: 1 }}
                      />

                      {/* Family Recipe Section */}
                      {sharedFamily && (
                        <div className="mt-4 space-y-4">
                          <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            Family Recipe Details
                          </Typography>

                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            {familyPhoto && !familyPhotoError ? (
                              <div className="space-y-4">
                                <Image
                                  src={familyPhoto}
                                  alt="Family recipe card"
                                  width={400}
                                  height={225}
                                  className="w-full h-48 object-contain rounded-lg bg-gray-50"
                                  onError={() => setFamilyPhotoError(true)}
                                />
                                <div className="flex gap-1 sm:gap-2">
                                  <Button
                                    variant="outlined"
                                    startIcon={<PhotoCameraIcon />}
                                    component="label"
                                    size="small"
                                    className="flex-1 text-xs sm:text-sm"
                                  >
                                    <span className="hidden sm:inline">
                                      Change Family Photo
                                    </span>
                                    <span className="sm:hidden">Change</span>
                                    <input
                                      type="file"
                                      hidden
                                      accept="image/*"
                                      onChange={handleFamilyPhotoUpload}
                                    />
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    startIcon={<CropIcon />}
                                    onClick={() => {
                                      setOriginalFamilyImage(familyPhoto);
                                      setShowFamilyCropDialog(true);
                                    }}
                                    size="small"
                                    className="flex-1 text-xs sm:text-sm"
                                  >
                                    <span className="hidden sm:inline">
                                      Crop & Zoom
                                    </span>
                                    <span className="sm:hidden">Crop</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <PhotoCameraIcon
                                  sx={{ fontSize: 48, color: "gray" }}
                                />
                                <div>
                                  <Button
                                    variant="contained"
                                    startIcon={<PhotoCameraIcon />}
                                    component="label"
                                  >
                                    Upload Family Recipe Photo
                                    <input
                                      type="file"
                                      hidden
                                      accept="image/*"
                                      onChange={handleFamilyPhotoUpload}
                                    />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <TextField
                            fullWidth
                            label="Family Recipe Notes"
                            value={familyNotes}
                            onChange={(e) => setFamilyNotes(e.target.value)}
                            multiline
                            minRows={4}
                            maxRows={12}
                            placeholder="Share the story behind this recipe, special memories, or family traditions associated with it..."
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Timing & Servings */}
                <Card sx={{ boxShadow: "none", border: "none" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Timing & Servings
                    </Typography>

                    <div className="grid grid-cols-2 gap-4">
                      <TextField
                        label="Servings"
                        value={servings || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setServings(0);
                          } else {
                            setServings(parseInt(value) || 0);
                          }
                        }}
                        size="small"
                      />
                      <TextField
                        label="Prep Time (min)"
                        value={prepTime || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPrepTime(value === "" ? 0 : parseInt(value) || 0);
                        }}
                        size="small"
                      />
                      <TextField
                        label="Cook Hours"
                        value={cookHours || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const hours = value === "" ? 0 : parseInt(value) || 0;
                          setCookHours(hours);
                          setCookTime(hours * 60 + cookMinutes);
                        }}
                        size="small"
                      />
                      <TextField
                        label="Cook Minutes"
                        value={cookMinutes || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const minutes =
                            value === "" ? 0 : parseInt(value) || 0;
                          setCookMinutes(minutes);
                          setCookTime(cookHours * 60 + minutes);
                        }}
                        size="small"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Steps */}
                <Accordion
                  expanded={stepsExpanded}
                  onChange={() => setStepsExpanded(!stepsExpanded)}
                  sx={{ boxShadow: "none", border: "none" }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="steps-content"
                    id="steps-header"
                  >
                    <Typography variant="h6">Steps</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="space-y-4">
                      {steps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`p-3 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-all ${
                            draggedItem?.type === "step" &&
                            draggedItem?.index === index
                              ? "opacity-50 shadow-lg scale-105"
                              : "hover:border-gray-300"
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index, "step")}
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index, "step")}
                        >
                          <div className="flex gap-2">
                            <div className="flex-shrink-0 pt-1">
                              <DragIndicatorIcon
                                sx={{
                                  fontSize: 20,
                                  color: "#9ca3af",
                                  cursor: "grab",
                                  "&:active": { cursor: "grabbing" },
                                }}
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-black">
                                  Step {index + 1}
                                </span>
                                <IconButton
                                  onClick={() => removeStep(index)}
                                  disabled={steps.length === 1}
                                  size="small"
                                  sx={{
                                    color: "#9ca3af",
                                    "&:hover": {
                                      color: "#ef4444",
                                      backgroundColor:
                                        "rgba(239, 68, 68, 0.04)",
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>
                              <TextField
                                placeholder="Describe this step..."
                                value={step.step || ""}
                                onChange={(e) =>
                                  handleStepChange(
                                    index,
                                    "step",
                                    e.target.value
                                  )
                                }
                                multiline
                                minRows={2}
                                maxRows={12}
                                size="small"
                                fullWidth
                                sx={{ mb: "8px" }}
                              />

                              {/* Include Ingredient Link */}
                              <div className="flex justify-start mb-2">
                                <button
                                  type="button"
                                  onClick={() => addStepIngredient(index)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
                                >
                                  + Include Ingredient
                                </button>
                              </div>

                              {/* Step Ingredients */}
                              {step.stepIngredients &&
                                step.stepIngredients.length > 0 && (
                                  <div className="space-y-2 mt-2">
                                    {step.stepIngredients.map(
                                      (stepIngredient, stepIngIndex) => {
                                        const selectedIngredient =
                                          ingredients.find(
                                            (ing) =>
                                              ing.id ===
                                              stepIngredient.ingredientId
                                          );

                                        return (
                                          <div
                                            key={stepIngredient.id}
                                            className="flex items-center gap-2"
                                          >
                                            {stepIngredient.ingredientId ? (
                                              <div className="flex items-center gap-2 flex-1">
                                                <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                                  {selectedIngredient?.amount}{" "}
                                                  {selectedIngredient?.unit ||
                                                    selectedIngredient?.customUnit}{" "}
                                                  {selectedIngredient?.name}
                                                </span>
                                                <IconButton
                                                  onClick={() =>
                                                    removeStepIngredient(
                                                      index,
                                                      stepIngIndex
                                                    )
                                                  }
                                                  size="small"
                                                  sx={{
                                                    color: "#9ca3af",
                                                    "&:hover": {
                                                      color: "#ef4444",
                                                      backgroundColor:
                                                        "rgba(239, 68, 68, 0.04)",
                                                    },
                                                  }}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2 flex-1">
                                                <FormControl
                                                  size="small"
                                                  sx={{
                                                    minWidth: 200,
                                                    flex: 1,
                                                  }}
                                                >
                                                  <InputLabel>
                                                    Select Ingredient
                                                  </InputLabel>
                                                  <Select
                                                    value=""
                                                    label="Select Ingredient"
                                                    onChange={(e) =>
                                                      updateStepIngredient(
                                                        index,
                                                        stepIngIndex,
                                                        e.target.value
                                                      )
                                                    }
                                                  >
                                                    {ingredients
                                                      .filter(
                                                        (ing) =>
                                                          ing.name &&
                                                          ing.name.trim()
                                                      )
                                                      .map((ingredient) => (
                                                        <MenuItem
                                                          key={ingredient.id}
                                                          value={ingredient.id}
                                                        >
                                                          {ingredient.amount}{" "}
                                                          {ingredient.unit ||
                                                            ingredient.customUnit}{" "}
                                                          {ingredient.name}
                                                        </MenuItem>
                                                      ))}
                                                  </Select>
                                                </FormControl>
                                                <IconButton
                                                  onClick={() =>
                                                    removeStepIngredient(
                                                      index,
                                                      stepIngIndex
                                                    )
                                                  }
                                                  size="small"
                                                  sx={{
                                                    color: "#9ca3af",
                                                    "&:hover": {
                                                      color: "#ef4444",
                                                      backgroundColor:
                                                        "rgba(239, 68, 68, 0.04)",
                                                    },
                                                  }}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                )}

                              {(type === "Smoker" ||
                                type === "Grill" ||
                                type === "Oven") && (
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center mt-2 rounded">
                                  <div className="flex flex-row w-full gap-2 sm:gap-4">
                                    {type === "Smoker" ? (
                                      <>
                                        <div className="w-full sm:w-3/5">
                                          <TextField
                                            placeholder="Temperature"
                                            type="text"
                                            value={step.temperature || ""}
                                            onChange={(e) =>
                                              handleStepChange(
                                                index,
                                                "temperature",
                                                e.target.value
                                              )
                                            }
                                            size="small"
                                            fullWidth
                                          />
                                        </div>
                                        <div className="w-full sm:w-3/5">
                                          <TextField
                                            placeholder="Time (e.g., 2h, 90m, 1h 30m)"
                                            type="text"
                                            value={
                                              typeof step.timeInput ===
                                                "string" &&
                                              step.timeInput.length > 0
                                                ? step.timeInput
                                                : step.time || ""
                                            }
                                            onChange={(e) =>
                                              handleStepChange(
                                                index,
                                                "time",
                                                e.target.value
                                              )
                                            }
                                            onBlur={(e) =>
                                              handleStepChange(
                                                index,
                                                "time",
                                                e.target.value,
                                                { commitTime: true }
                                              )
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                handleStepChange(
                                                  index,
                                                  "time",
                                                  (e.target as HTMLInputElement)
                                                    .value,
                                                  { commitTime: true }
                                                );
                                              }
                                            }}
                                            size="small"
                                            fullWidth
                                          />
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-1/2">
                                          {step.isCustomTemp ? (
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                              }}
                                            >
                                              <IconButton
                                                onClick={() => {
                                                  handleStepChange(
                                                    index,
                                                    "isCustomTemp",
                                                    false
                                                  );
                                                  handleStepChange(
                                                    index,
                                                    "temperature",
                                                    ""
                                                  );
                                                }}
                                                size="small"
                                              >
                                                <ArrowBackIcon fontSize="small" />
                                              </IconButton>
                                              <TextField
                                                placeholder="Custom Temp (°F)"
                                                type="text"
                                                value={step.temperature || ""}
                                                onChange={(e) => {
                                                  handleStepChange(
                                                    index,
                                                    "temperature",
                                                    e.target.value
                                                  );
                                                }}
                                                size="small"
                                                fullWidth
                                              />
                                            </div>
                                          ) : (
                                            <FormControl size="small" fullWidth>
                                              <InputLabel>
                                                Heat Level
                                              </InputLabel>
                                              <Select
                                                value={step.temperature || ""}
                                                label="Heat Level"
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  if (
                                                    String(value) === "other"
                                                  ) {
                                                    handleStepChange(
                                                      index,
                                                      "isCustomTemp",
                                                      true
                                                    );
                                                    handleStepChange(
                                                      index,
                                                      "temperature",
                                                      ""
                                                    );
                                                  } else {
                                                    // Handle both numeric and string values
                                                    const finalValue =
                                                      typeof value ===
                                                        "string" &&
                                                      isNaN(parseInt(value))
                                                        ? value
                                                        : typeof value ===
                                                          "string"
                                                        ? parseInt(value)
                                                        : value;
                                                    handleStepChange(
                                                      index,
                                                      "temperature",
                                                      finalValue
                                                    );
                                                  }
                                                }}
                                              >
                                                <MenuItem value={250}>
                                                  Low Heat (250°F)
                                                </MenuItem>
                                                <MenuItem value={350}>
                                                  Medium Heat (350°F)
                                                </MenuItem>
                                                <MenuItem value={450}>
                                                  High Heat (450°F)
                                                </MenuItem>
                                                <MenuItem value="bake350">
                                                  Bake (350°F)
                                                </MenuItem>
                                                <MenuItem value="bake400">
                                                  Bake (400°F)
                                                </MenuItem>
                                                <MenuItem value="bake">
                                                  Bake
                                                </MenuItem>
                                                <MenuItem value="roast">
                                                  Roast
                                                </MenuItem>
                                                <MenuItem value="broil">
                                                  Broil
                                                </MenuItem>
                                                <MenuItem value="other">
                                                  Other Temp
                                                </MenuItem>
                                              </Select>
                                            </FormControl>
                                          )}
                                        </div>
                                        <div className="w-1/2">
                                          <TextField
                                            placeholder="Time"
                                            type="text"
                                            value={
                                              typeof step.timeInput ===
                                                "string" &&
                                              step.timeInput.length > 0
                                                ? step.timeInput
                                                : step.time || ""
                                            }
                                            onChange={(e) =>
                                              handleStepChange(
                                                index,
                                                "time",
                                                e.target.value
                                              )
                                            }
                                            onBlur={(e) =>
                                              handleStepChange(
                                                index,
                                                "time",
                                                e.target.value,
                                                { commitTime: true }
                                              )
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                handleStepChange(
                                                  index,
                                                  "time",
                                                  (e.target as HTMLInputElement)
                                                    .value,
                                                  { commitTime: true }
                                                );
                                              }
                                            }}
                                            size="small"
                                            fullWidth
                                          />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  {type === "Smoker" && (
                                    <div className="w-full text-right sm:w-auto">
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={step.superSmoke || false}
                                            onChange={(e) =>
                                              handleStepChange(
                                                index,
                                                "superSmoke",
                                                e.target.checked
                                              )
                                            }
                                            size="small"
                                          />
                                        }
                                        label="Super Smoke"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add button at bottom left */}
                      <div className="flex justify-start mt-3">
                        <IconButton
                          onClick={addStep}
                          color="primary"
                          size="small"
                        >
                          <AddIcon />
                        </IconButton>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>

                {/* Ingredients */}
                <Accordion
                  expanded={ingredientsExpanded}
                  onChange={() => setIngredientsExpanded(!ingredientsExpanded)}
                  sx={{ boxShadow: "none", border: "none" }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="ingredients-content"
                    id="ingredients-header"
                  >
                    <Typography variant="h6">Ingredients</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="space-y-3 flex flex-col items-start">
                      {ingredients.map((ingredient, index) => (
                        <div
                          key={ingredient.id}
                          className={`w-full mb-8 p-3 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-all ${
                            draggedItem?.type === "ingredient" &&
                            draggedItem?.index === index
                              ? "opacity-50 shadow-lg scale-105"
                              : "hover:border-gray-300"
                          }`}
                          draggable
                          onDragStart={(e) =>
                            handleDragStart(e, index, "ingredient")
                          }
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index, "ingredient")}
                        >
                          <div className="flex items-start gap-2 w-full">
                            <div className="flex-shrink-0 pt-1">
                              <DragIndicatorIcon
                                sx={{
                                  fontSize: 20,
                                  color: "#9ca3af",
                                  cursor: "grab",
                                  "&:active": { cursor: "grabbing" },
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="w-full mt-2">
                                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                  <TextField
                                    label="Ingredient name"
                                    placeholder="Enter ingredient name"
                                    value={ingredient.name || ""}
                                    onChange={(e) =>
                                      handleIngredientChange(
                                        index,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    size="small"
                                    multiline
                                    minRows={1}
                                    maxRows={4}
                                    sx={{ flex: 1 }}
                                  />
                                </div>
                              </div>
                              <div className="flex flex-row sm:flex-row gap-2 mt-4">
                                <TextField
                                  label="Amount"
                                  placeholder="e.g., 1, ½, 2¾, 1/3"
                                  value={ingredient.amount || ""}
                                  onChange={(e) =>
                                    handleIngredientChange(
                                      index,
                                      "amount",
                                      e.target.value
                                    )
                                  }
                                  size="small"
                                  sx={{ minWidth: 60, width: 80 }}
                                />
                                {ingredient.showCustomUnit ? (
                                  <div
                                    className="flex items-center gap-1"
                                    style={{ minWidth: 80, flex: 2 }}
                                  >
                                    <IconButton
                                      onClick={() =>
                                        handleBackToUnitSelect(index)
                                      }
                                      size="small"
                                      sx={{
                                        minWidth: "auto",
                                        p: 0.5,
                                        color: "#6b7280",
                                        "&:hover": {
                                          color: "#374151",
                                          backgroundColor:
                                            "rgba(107, 114, 128, 0.1)",
                                        },
                                      }}
                                    >
                                      <ArrowBackIcon fontSize="small" />
                                    </IconButton>
                                    <TextField
                                      label="Custom unit"
                                      placeholder="Enter custom unit"
                                      value={ingredient.customUnit || ""}
                                      onChange={(e) =>
                                        handleCustomUnitChange(
                                          index,
                                          e.target.value
                                        )
                                      }
                                      size="small"
                                      sx={{ flex: 1 }}
                                    />
                                  </div>
                                ) : (
                                  <FormControl
                                    size="small"
                                    sx={{ minWidth: 80, flex: 2 }}
                                  >
                                    <InputLabel>Unit</InputLabel>
                                    <Select
                                      value={ingredient.unit || ""}
                                      label="Unit"
                                      onChange={(e) =>
                                        handleUnitChange(index, e.target.value)
                                      }
                                    >
                                      {unitOptions.map((unit) => (
                                        <MenuItem key={unit} value={unit}>
                                          {unit}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                )}
                                <IconButton
                                  onClick={() => removeIngredient(index)}
                                  disabled={ingredients.length === 1}
                                  size="small"
                                  sx={{
                                    color: "#9ca3af",
                                    "&:hover": {
                                      color: "#ef4444",
                                      backgroundColor:
                                        "rgba(239, 68, 68, 0.04)",
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add button at bottom left */}
                      <div className="flex justify-start mt-3">
                        <IconButton
                          onClick={addIngredient}
                          color="primary"
                          size="small"
                        >
                          <AddIcon />
                        </IconButton>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>

                {/* My Notes */}
                <Card sx={{ boxShadow: "none", border: "none" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      My Notes
                    </Typography>
                    <TextField
                      fullWidth
                      label="My Notes"
                      placeholder="Add any personal notes, tips, or variations..."
                      value={myNotes}
                      onChange={(e) => setMyNotes(e.target.value)}
                      multiline
                      minRows={4}
                      maxRows={12}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              {/* Import Recipe Section - Mobile: Above buttons, Desktop: Left side */}
              {!editId && (
                <div className="mb-4 sm:hidden">
                  <div className="flex flex-col gap-2">
                    <TextField
                      label={
                        <span style={{ fontFamily: "monospace" }}>
                          Import Recipe URL
                        </span>
                      }
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://example.com/recipe"
                      size="small"
                      fullWidth
                      sx={{
                        "& .MuiInputBase-input": {
                          fontFamily: "monospace",
                        },
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleImportRecipe}
                      disabled={!importUrl || isImporting}
                      fullWidth
                    >
                      {isImporting ? "Importing..." : "Import"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Desktop Layout */}
              <div className="hidden sm:flex flex-row-reverse justify-between items-center">
                <div className="flex items-center gap-2">
                  {editId && (
                    <IconButton
                      onClick={handleDelete}
                      color="error"
                      title="Delete Recipe"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                  <Link href="/recipes">
                    <Button variant="outlined">Cancel</Button>
                  </Link>
                  <Button
                    variant="contained"
                    // startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editId ? "Update" : "Add Recipe"}
                  </Button>
                </div>

                {!editId && (
                  <div className="flex items-center gap-2">
                    <TextField
                      label={
                        <span style={{ fontFamily: "monospace" }}>
                          Import Recipe URL
                        </span>
                      }
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://example.com/recipe"
                      size="small"
                      sx={{
                        width: "400px",
                        "& .MuiInputBase-input": {
                          fontFamily: "monospace",
                        },
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleImportRecipe}
                      disabled={!importUrl || isImporting}
                    >
                      {isImporting ? "Importing..." : "Import"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Mobile Layout - Action Buttons */}
              <div className="flex sm:hidden justify-center items-center gap-2">
                {editId && (
                  <IconButton
                    onClick={handleDelete}
                    color="error"
                    title="Delete Recipe"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
                <Link href="/recipes" className="w-1/2 sm:w-auto">
                  <Button variant="outlined" fullWidth className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button
                  variant="contained"
                  // startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-1/2 sm:w-auto"
                >
                  {saving ? "Saving..." : editId ? "Update" : "Add Recipe"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {renderFooter("integrated")}
      </div>
    </div>
  );
};

export default RecipeBuilder;
