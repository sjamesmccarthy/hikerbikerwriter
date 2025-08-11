const fs = require("fs");
const path = require("path");

// Read existing field notes
const oldFile = path.join("src", "data", "fieldNotes.json");
const newIndexFile = path.join("src", "data", "fieldnotes.json");
const newDir = path.join("src", "data", "fieldnotes");

if (fs.existsSync(oldFile)) {
  const oldData = JSON.parse(fs.readFileSync(oldFile, "utf8"));
  const oldNotes = Array.isArray(oldData) ? oldData : oldData.fieldnotes || [];
  const newIndex = { fieldnotes: [] };

  // Ensure directory exists
  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir, { recursive: true });
  }

  // Convert each note
  oldNotes.forEach((note) => {
    // Generate slug from title
    let slug = note.slug;
    if (!slug) {
      slug =
        note.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim("-") || "untitled-" + note.id;
    }

    // Create the full note with slug - need to get content if missing
    const newNote = {
      id: note.id,
      slug: slug,
      title: note.title,
      content: note.content || "Content not available",
      tags: note.tags || "",
      mood: note.mood || "",
      author: note.author || "Anonymous",
      date: note.date || new Date().toISOString(),
    };

    // Write individual file
    fs.writeFileSync(
      path.join(newDir, slug + ".json"),
      JSON.stringify(newNote, null, 2)
    );

    // Add to index
    newIndex.fieldnotes.push({
      id: note.id,
      slug: slug,
      title: note.title,
      author: note.author,
      date: note.date,
      tags: note.tags || "",
      mood: note.mood || "",
    });
  });

  // Write new index
  fs.writeFileSync(newIndexFile, JSON.stringify(newIndex, null, 2));

  console.log(
    "Migration completed! Converted",
    oldNotes.length,
    "field notes."
  );
} else {
  console.log("No existing field notes found.");
}
