import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch the webpage content
    const response = await fetch(url);
    const html = await response.text();

    // Use a basic regex approach to extract recipe information
    // Note: This is a simple implementation. You might want to use a proper HTML parser
    // and implement more sophisticated parsing logic based on recipe schema markup

    // Extract page title and site name
    let pageTitle = extractContent(html, /<title[^>]*>(.*?)<\/title>/i) || "";
    let siteName = extractContent(
      html,
      /<meta[^>]*property="og:site_name"[^>]*content="([^"]*)"[^>]*>/i
    );

    // If no og:site_name, try to extract from the URL
    if (!siteName) {
      try {
        const urlObj = new URL(url);
        siteName = urlObj.hostname.replace(/^www\./, "").split(".")[0];
        // Capitalize first letter of each word
        siteName = siteName
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      } catch {
        console.warn("Could not parse URL for site name");
        siteName = new URL(url).hostname;
      }
    }

    // Clean up page title
    pageTitle = pageTitle
      .replace(/\s*[-|]\s*.*$/, "") // Remove site name and separator from title
      .replace(/recipe/i, "") // Remove word "recipe"
      .trim();

    const source = `${pageTitle} [${siteName}]`.trim();

    const recipe = {
      title: extractContent(html, /<h1[^>]*>(.*?)<\/h1>/i) || pageTitle,
      description: extractContent(
        html,
        /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i
      ),
      source,
      ingredients: extractIngredients(html),
      steps: extractSteps(html),
      prepTime: extractTime(html, "prepTime"),
      cookTime: extractTime(html, "cookTime"),
      servings: extractServings(html),
    };

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Error importing recipe:", error);
    return NextResponse.json(
      { error: "Failed to import recipe" },
      { status: 500 }
    );
  }
}

function extractContent(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractIngredients(
  html: string
): Array<{ name: string; amount: string; unit: string }> {
  const ingredientsList: Array<{ name: string; amount: string; unit: string }> =
    [];

  // First try to find schema.org recipe ingredients
  const schemaMatch = html.match(/"recipeIngredient":\s*\[(.*?)\]/);
  if (schemaMatch) {
    try {
      const ingredients = JSON.parse(`[${schemaMatch[1]}]`);
      ingredients.forEach((ingredient: string) => {
        // Clean up the ingredient text and parse it
        const cleaned = ingredient.replace(/<[^>]+>/g, "").trim();
        const match = cleaned.match(
          /^([\d\s.,/½⅓⅔¼¾⅛⅜⅝⅞]+)?\s*([a-zA-Z-]+)?\s*(.+)?$/
        );
        if (match) {
          const [, amount = "", unit = "", name = ""] = match;
          ingredientsList.push({
            name: name.trim(),
            amount: amount.trim(),
            unit: unit.trim(),
          });
        }
      });
      if (ingredientsList.length > 0) {
        return ingredientsList;
      }
    } catch (e) {
      console.error("Error parsing schema.org ingredients:", e);
    }
  }

  // Fallback to parsing HTML lists
  const cleanHtml = html.replace(/<\/?(?:span|div|p)[^>]*>/g, ""); // Remove common wrapper tags
  const regex = /<li[^>]*>([^<]+)<\/li>/gi;
  let match;

  while ((match = regex.exec(cleanHtml)) !== null) {
    const ingredientText = match[1].replace(/\s+/g, " ").trim();
    if (ingredientText) {
      // Look for amount (including fractions), unit, and name
      const parts = ingredientText.match(
        /^([\d\s.,/½⅓⅔¼¾⅛⅜⅝⅞]+)?\s*([a-zA-Z-]+)?\s*(.+)?$/
      );
      if (parts) {
        const [, amount = "", unit = "", name = ""] = parts;
        ingredientsList.push({
          name: name.trim(),
          amount: amount.trim(),
          unit: unit.trim(),
        });
      }
    }
  }

  return ingredientsList.length > 0
    ? ingredientsList
    : [{ name: "", amount: "", unit: "" }];
}

function extractSteps(html: string): Array<{ step: string }> {
  // Look for common recipe step patterns
  const stepsList: Array<{ step: string }> = [];

  // Try to find steps in ordered lists or divs with step classes
  const regex =
    /<li[^>]*class="[^"]*instruction[^"]*"[^>]*>(.*?)<\/li>|<div[^>]*class="[^"]*step[^"]*"[^>]*>(.*?)<\/div>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const step = match[1] || match[2];
    if (step) {
      stepsList.push({
        step: step.trim(),
      });
    }
  }

  return stepsList.length > 0 ? stepsList : [{ step: "" }];
}

function extractTime(html: string, timeType: "prepTime" | "cookTime"): number {
  // Look for time in metadata or specific time elements
  const regex = new RegExp(`"${timeType}":\\s*"PT(\\d+)([HM])"`, "i");
  const match = html.match(regex);

  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toUpperCase();
    return unit === "H" ? value * 60 : value;
  }

  return 0;
}

function extractServings(html: string): number {
  // Look for serving size in metadata or specific elements
  const regex =
    /"recipeYield":\s*"(\d+)"|<[^>]*class="[^"]*serving[^"]*"[^>]*>(\d+)/i;
  const match = html.match(regex);

  if (match) {
    return parseInt(match[1] || match[2]);
  }

  return 1;
}
