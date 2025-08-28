const fetch = require("node-fetch");

async function testFamilySharing() {
  try {
    // Test the main recipes API
    const response = await fetch("http://localhost:3001/api/recipes");
    if (!response.ok) {
      console.log("API response not OK:", response.status);
      return;
    }

    const recipes = await response.json();
    console.log("Total recipes found:", recipes.length);

    // Check for recipes with family sharing
    const familySharedRecipes = recipes.filter(
      (recipe) => recipe.shared_family === true || recipe.shared_family === 1
    );
    console.log("Family shared recipes:", familySharedRecipes.length);

    if (familySharedRecipes.length > 0) {
      console.log("Family shared recipes:");
      familySharedRecipes.forEach((recipe, index) => {
        console.log(
          `${index + 1}. ${recipe.title} (${recipe.slug}) - shared_family: ${
            recipe.shared_family
          }, user: ${recipe.userEmail}`
        );
      });

      // Test individual recipe API for first family shared recipe
      const firstFamilyRecipe = familySharedRecipes[0];
      console.log(
        `\nTesting individual recipe API for: ${firstFamilyRecipe.slug}`
      );

      const individualResponse = await fetch(
        `http://localhost:3001/api/recipes/${firstFamilyRecipe.slug}`
      );
      if (individualResponse.ok) {
        const individualRecipe = await individualResponse.json();
        console.log(
          "Individual recipe shared_family:",
          individualRecipe.shared_family
        );
        console.log("Individual recipe userEmail:", individualRecipe.userEmail);
      } else {
        console.log("Failed to fetch individual recipe");
      }
    } else {
      console.log("No family shared recipes found");

      // Show all recipes for debugging
      console.log("\nAll recipes:");
      recipes.forEach((recipe, index) => {
        console.log(
          `${index + 1}. ${recipe.title} (${recipe.slug}) - shared_family: ${
            recipe.shared_family
          }, user: ${recipe.userEmail}`
        );
      });
    }
  } catch (error) {
    console.error("Error testing family sharing:", error);
  }
}

testFamilySharing();
