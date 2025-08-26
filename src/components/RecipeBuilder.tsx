"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  PhotoCamera as PhotoCameraIcon,
  LocalDining as LocalDiningIcon,
  Delete as DeleteIcon,
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
} from "@mui/material";
import { renderFooter } from "./shared/footerHelpers";
import { useSession, signIn, signOut } from "next-auth/react";

type Recipe = {
  id: number;
  slug: string;
  title: string;
  description: string;
  source?: string;
  type: "moker" | "flat-top" | "grill";
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

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [type, setType] = useState<"Smoker" | "Flat-top" | "Grill">("Grill");
  const [recommendedPellets, setRecommendedPellets] = useState("");
  const [category, setCategory] = useState<string>("Dinner");
  const [photo, setPhoto] = useState("");
  const [imageError, setImageError] = useState(false);
  const [prepTime, setPrepTime] = useState(0);
  const [cookTime, setCookTime] = useState(0);
  const [cookHours, setCookHours] = useState(0);
  const [cookMinutes, setCookMinutes] = useState(0);
  const [servings, setServings] = useState(1);
  const [slug, setSlug] = useState("");
  const [ingredients, setIngredients] = useState<
    Array<{ id: string; name: string; amount: string; unit: string }>
  >([{ id: crypto.randomUUID(), name: "", amount: "", unit: "" }]);
  const [steps, setSteps] = useState<
    Array<{
      id: string;
      step: string;
      temperature?: number;
      time?: number;
      timeInput?: string;
      superSmoke?: boolean;
    }>
  >([{ id: crypto.randomUUID(), step: "", timeInput: "" }]);
  const [myNotes, setMyNotes] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

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
      setSourceTitle(recipe.title || "");
      setIngredients(
        recipe.ingredients?.map(
          (ing: { name?: string; amount?: string; unit?: string }) => ({
            id: crypto.randomUUID(),
            name: ing.name || "",
            amount: ing.amount || "",
            unit: ing.unit || "",
          })
        ) || [{ id: crypto.randomUUID(), name: "", amount: "", unit: "" }]
      );
      setSteps(
        recipe.steps?.map(
          (step: {
            step?: string;
            temperature?: number;
            time?: number;
            superSmoke?: boolean;
          }) => ({
            id: crypto.randomUUID(),
            step: step.step || "",
            temperature: step.temperature,
            time: step.time,
            superSmoke: step.superSmoke,
          })
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
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  // Family recipe sharing state
  const [sharedFamily, setSharedFamily] = useState(false);
  const [familyPhoto, setFamilyPhoto] = useState("");
  const [familyNotes, setFamilyNotes] = useState("");
  const [familyPhotoError, setFamilyPhotoError] = useState(false);

  const categoryOptions = useMemo<string[]>(
    () => ["Dinner", "Side", "Dessert", "Breakfast", "Cocktails"],
    []
  );
  const typeOptions = useMemo<string[]>(
    () => ["Smoker", "Flat-top", "Grill"],
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
          setSourceTitle(recipe.sourceTitle || "");
          // Handle legacy type names ("smoker" -> "Smoker")
          const loadedType = recipe.type || "Grill";
          const normalizedType =
            loadedType.charAt(0).toUpperCase() + loadedType.slice(1);
          setType(normalizedType as "Smoker" | "Flat-top" | "Grill");
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
          setIngredients(
            recipe.ingredients?.length
              ? recipe.ingredients.map(
                  (ing: { name?: string; amount?: number; unit?: string }) => ({
                    id: crypto.randomUUID(),
                    name: ing.name || "",
                    amount: formatAmountAsFraction(ing.amount || 0),
                    unit: ing.unit || "",
                  })
                )
              : [{ id: crypto.randomUUID(), name: "", amount: "", unit: "" }]
          );
          setSteps(
            recipe.steps?.length
              ? recipe.steps.map(
                  (step: {
                    step?: string;
                    temperature?: number;
                    time?: number;
                    superSmoke?: boolean;
                  }) => ({
                    id: crypto.randomUUID(),
                    step: step.step || "",
                    temperature: step.temperature || undefined,
                    time: step.time || undefined,
                    superSmoke: step.superSmoke || false,
                  })
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
  }, [editId, session?.user?.email, categoryOptions, typeOptions]);

  const handleIngredientChange = (
    index: number,
    field: keyof (typeof ingredients)[0],
    value: string | number
  ) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", amount: "", unit: "" },
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
        setImageError(false); // Reset image error when new photo is uploaded
      };
      reader.readAsDataURL(file);
    }
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
          unit: ing.unit || "",
        }));

      // Convert steps format for API
      const apiSteps = steps
        .filter((step) => step.step && step.step.trim())
        .map((step) => ({
          step: step.step.trim(),
          temperature: step.temperature,
          time: step.time,
          superSmoke: step.superSmoke || false,
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
          <div className="hidden sm:flex items-center gap-2">
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
                              height={192}
                              className="w-full h-48 object-cover rounded-lg"
                              onError={() => setImageError(true)}
                            />
                            <Button
                              variant="outlined"
                              startIcon={<PhotoCameraIcon />}
                              component="label"
                            >
                              Change Photo
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handlePhotoUpload}
                              />
                            </Button>
                          </div>
                        ) : photo && imageError ? (
                          <div className="space-y-4">
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg">
                              <LocalDiningIcon
                                sx={{ fontSize: 48, color: "#9CA3AF" }}
                              />
                            </div>
                            <Button
                              variant="outlined"
                              startIcon={<PhotoCameraIcon />}
                              component="label"
                            >
                              Change Photo
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handlePhotoUpload}
                              />
                            </Button>
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
                            e.target.value as "Smoker" | "Flat-top" | "Grill"
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
                    <TextField
                      fullWidth
                      label="Recipe Source Title"
                      value={sourceTitle}
                      onChange={(e) => setSourceTitle(e.target.value)}
                      margin="normal"
                      placeholder="e.g., The Best Chocolate Chip Cookies"
                    />

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
                                  height={192}
                                  className="w-full h-48 object-cover rounded-lg"
                                  onError={() => setFamilyPhotoError(true)}
                                />
                                <Button
                                  variant="outlined"
                                  startIcon={<PhotoCameraIcon />}
                                  component="label"
                                >
                                  Change Family Recipe Photo
                                  <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setFamilyPhoto(
                                            reader.result as string
                                          );
                                          setFamilyPhotoError(false);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </Button>
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
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            setFamilyPhoto(
                                              reader.result as string
                                            );
                                            setFamilyPhotoError(false);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
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
                        type="number"
                        value={servings}
                        onChange={(e) =>
                          setServings(parseInt(e.target.value) || 1)
                        }
                        sx={{ "& input": { min: 1 } }}
                        size="small"
                      />
                      <TextField
                        label="Prep Time (min)"
                        type="number"
                        value={prepTime}
                        onChange={(e) =>
                          setPrepTime(parseInt(e.target.value) || 0)
                        }
                        sx={{ "& input": { min: 0 } }}
                        size="small"
                      />
                      <TextField
                        label="Cook Hours"
                        type="number"
                        value={cookHours}
                        onChange={(e) => {
                          const hours = parseInt(e.target.value) || 0;
                          setCookHours(hours);
                          setCookTime(hours * 60 + cookMinutes);
                        }}
                        sx={{ "& input": { min: 0 } }}
                        size="small"
                      />
                      <TextField
                        label="Cook Minutes"
                        type="number"
                        value={cookMinutes}
                        onChange={(e) => {
                          const minutes = parseInt(e.target.value) || 0;
                          setCookMinutes(minutes);
                          setCookTime(cookHours * 60 + minutes);
                        }}
                        sx={{ "& input": { min: 0, max: 59 } }}
                        size="small"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Ingredients */}
                <Card sx={{ boxShadow: "none", border: "none" }}>
                  <CardContent>
                    <div className="mb-4">
                      <Typography variant="h6">Ingredients</Typography>
                    </div>

                    <div className="space-y-3 flex flex-col items-start">
                      {ingredients.map((ingredient, index) => (
                        <div
                          key={ingredient.id}
                          className="flex gap-2 items-start"
                        >
                          <TextField
                            placeholder="Ingredient name"
                            value={ingredient.name || ""}
                            onChange={(e) =>
                              handleIngredientChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            size="small"
                            sx={{ flex: 2 }}
                            multiline
                            minRows={1}
                            maxRows={4}
                          />
                          <TextField
                            placeholder="Amount (e.g., 1, ½, 2¾, 1/3)"
                            value={ingredient.amount || ""}
                            onChange={(e) =>
                              handleIngredientChange(
                                index,
                                "amount",
                                e.target.value
                              )
                            }
                            size="small"
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            placeholder="Unit"
                            value={ingredient.unit || ""}
                            onChange={(e) =>
                              handleIngredientChange(
                                index,
                                "unit",
                                e.target.value
                              )
                            }
                            size="small"
                            sx={{ flex: 1 }}
                          />
                          <IconButton
                            onClick={() => removeIngredient(index)}
                            disabled={ingredients.length === 1}
                            size="small"
                            sx={{
                              color: "#9ca3af",
                              "&:hover": {
                                color: "#ef4444",
                                backgroundColor: "rgba(239, 68, 68, 0.04)",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
                  </CardContent>
                </Card>

                {/* Steps */}
                <Card sx={{ boxShadow: "none", border: "none" }}>
                  <CardContent>
                    <div className="mb-4">
                      <Typography variant="h6">Instructions</Typography>
                    </div>

                    <div className="space-y-4">
                      {steps.map((step, index) => (
                        <div key={step.id} className="space-y-2">
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
                                  backgroundColor: "rgba(239, 68, 68, 0.04)",
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
                              handleStepChange(index, "step", e.target.value)
                            }
                            multiline
                            minRows={2}
                            maxRows={12}
                            size="small"
                            fullWidth
                            sx={{ mb: "8px" }}
                          />

                          {(type === "Smoker" || type === "Grill") && (
                            <div className="flex gap-4 items-center mt-2 rounded">
                              <div className="flex w-full gap-4">
                                {type === "Smoker" ? (
                                  <>
                                    <div className="w-3/5 sm:w-3/5">
                                      <TextField
                                        placeholder="Temp"
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
                                    <div className="w-3/5 sm:w-3/5">
                                      <TextField
                                        placeholder="Time"
                                        type="text"
                                        value={
                                          typeof step.timeInput === "string" &&
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
                                      <FormControl size="small" fullWidth>
                                        <InputLabel>Heat Level</InputLabel>
                                        <Select
                                          value={step.temperature || ""}
                                          label="Heat Level"
                                          onChange={(e) =>
                                            handleStepChange(
                                              index,
                                              "temperature",
                                              e.target.value
                                            )
                                          }
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
                                        </Select>
                                      </FormControl>
                                    </div>
                                    <div className="w-1/2">
                                      <TextField
                                        placeholder="Time"
                                        type="text"
                                        value={
                                          typeof step.timeInput === "string" &&
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
                                <div className="w-full mt-2">
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
                                    sx={{ ml: 1 }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
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
                  </CardContent>
                </Card>

                {/* My Notes */}
                <Card sx={{ boxShadow: "none", border: "none" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      My Notes
                    </Typography>
                    <TextField
                      fullWidth
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
