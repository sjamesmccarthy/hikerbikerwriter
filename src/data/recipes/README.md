# Recipe Storage Architecture

## Overview

The recipe system now uses a more scalable architecture with individual files for each recipe instead of storing everything in a single JSON file.

## Structure

### Index File: `/src/data/recipes.json`

- Contains metadata for all recipes
- Used for listing, filtering, and quick access
- Structure:

```json
{
  "recipes": [
    {
      "id": 1234567890,
      "slug": "recipe-slug",
      "title": "Recipe Title",
      "description": "Recipe description",
      "type": "smoker|flat-top|grill",
      "categories": ["category1", "category2"],
      "prepTime": 30,
      "cookTime": 120,
      "author": "Author Name",
      "favorite": false,
      "date": "2025-08-09T12:00:00.000Z"
    }
  ]
}
```

### Individual Recipe Files: `/src/data/recipes/{slug}.json`

- Each recipe stored as a separate JSON file
- Named using the recipe's slug (e.g., `texas-style-smoked-brisket.json`)
- Contains complete recipe data including ingredients, steps, notes, etc.

## API Endpoints

### `/api/recipes` (GET)

- Returns all recipes with full data
- Reads index file and loads each individual recipe file

### `/api/recipes` (POST)

- Creates new recipe
- Generates slug from title
- Saves full recipe to individual file
- Updates index with metadata

### `/api/recipes` (PUT)

- Updates existing recipe
- Handles slug changes (renames file if needed)
- Updates both individual file and index

### `/api/recipes` (DELETE)

- Removes recipe
- Deletes individual file
- Removes from index

### `/api/recipes/[slug]` (GET)

- Returns single recipe by slug
- Direct file access for better performance

## Benefits

1. **Scalability**: No performance degradation as recipe count grows
2. **Efficiency**: Individual recipes load faster than entire collection
3. **Maintainability**: Easier to backup, version control, and debug individual recipes
4. **Flexibility**: Allows for future features like lazy loading, caching, etc.

## Adding New Recipes

When adding a new recipe, the system will:

1. Generate a unique slug from the title
2. Create a new file at `/src/data/recipes/{slug}.json` with full recipe data
3. Add metadata entry to the index file
4. Return the complete recipe object

The recipe list view uses the index for quick display, while the detail view loads the individual file for complete data.
