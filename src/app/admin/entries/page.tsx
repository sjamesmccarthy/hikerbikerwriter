"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Star as StarIcon,
  Public as PublicIcon,
} from "@mui/icons-material";
import { renderFooter } from "@/components/shared/footerHelpers";

interface Entry {
  id: number;
  title: string;
  author: string;
  entryType: string;
  tableName: string;
  formattedDate: string;
  isFavorite: boolean;
  isPublic: boolean;
  user_email?: string;
  slug?: string;
  json?: Record<string, unknown>;
}

// Generate URL for different entry types
const getEntryUrl = (entry: Entry): string => {
  switch (entry.entryType) {
    case "Recipe":
      // For recipes, try to extract slug from JSON or use a fallback
      if (entry.json && typeof entry.json === "object") {
        const slug = entry.json.slug || entry.slug;
        if (slug && typeof slug === "string") {
          return `/recipes/${slug}`;
        }
      }
      // Fallback to recipes page if no slug available
      return "/recipes";

    case "Field Note":
      // For field notes, try to extract slug from JSON or use a fallback
      if (entry.json && typeof entry.json === "object") {
        const slug = entry.json.slug || entry.slug;
        if (slug && typeof slug === "string") {
          return `/fieldnotes/${slug}`;
        }
      }
      // Fallback to fieldnotes page if no slug available
      return "/fieldnotes";

    case "Roll & Write":
      // For roll & write entries, link to the specific entry by ID
      return `/rollandwrite?id=${entry.id}`;

    default:
      // Fallback to home page
      return "/";
  }
};

export default function AdminEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Filters
  const [selectedApp, setSelectedApp] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);

  // Handle sort change to extract favorites filter
  const handleSortChange = (value: string) => {
    if (value === "favorites") {
      setSortBy("newest");
      setFavoritesOnly(true);
      setPublicOnly(false);
    } else if (value === "public") {
      setSortBy("newest");
      setFavoritesOnly(false);
      setPublicOnly(true);
    } else {
      setSortBy(value);
      setFavoritesOnly(false);
      setPublicOnly(false);
    }
  };

  const fetchEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedApp !== "all") params.append("app", selectedApp);
      if (selectedUser && selectedUser !== "all")
        params.append("user", selectedUser);
      params.append("sortBy", sortBy);
      if (favoritesOnly) params.append("favorites", "true");

      console.log("Fetching entries with params:", params.toString());
      const response = await fetch(`/api/admin/entries?${params}`);
      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched data:", data);
        setEntries(data.entries);
        setUsers(data.users);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Failed to fetch entries:", response.status, errorData);
        alert(
          `Failed to fetch entries: ${errorData.error || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error fetching entries:", error);
      alert(
        `Error fetching entries: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [selectedApp, selectedUser, sortBy, favoritesOnly]);

  useEffect(() => {
    fetchEntries();
  }, [selectedApp, selectedUser, sortBy, favoritesOnly, fetchEntries]);

  const handleDelete = async (entry: Entry) => {
    if (!confirm(`Are you sure you want to delete "${entry.title}"?`)) {
      return;
    }

    setDeleting(entry.id);
    try {
      const response = await fetch(
        `/api/admin/entries?id=${entry.id}&table=${entry.tableName}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Refresh entries list
        fetchEntries();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("An error occurred while deleting the entry");
    } finally {
      setDeleting(null);
    }
  };

  const getEntryTypeColor = (
    type: string
  ): "success" | "info" | "secondary" | "default" => {
    switch (type) {
      case "Recipe":
        return "success";
      case "Field Note":
        return "info";
      case "Roll & Write":
        return "secondary";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.50",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={32} />
          <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 6, px: { xs: 2, sm: 3, lg: 4 } }}>
      <Box sx={{ maxWidth: "1400px", mx: "auto" }}>
        <Paper
          sx={{
            p: 4,
            background: "linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)",
            boxShadow: "none",
            border: "none",
            outline: "none",
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{ fontWeight: "bold", mb: 1 }}
            >
              Content Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage recipes, field notes, and roll & write entries across all
              users
            </Typography>
          </Box>

          {/* Filters */}
          <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
            <CardContent>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 3,
                  alignItems: "end",
                }}
              >
                <TextField
                  id="app-select"
                  label="App Type"
                  select
                  fullWidth
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                  size="small"
                >
                  <MenuItem value="all">All Apps</MenuItem>
                  <MenuItem value="recipe">Recipes</MenuItem>
                  <MenuItem value="field note">Field Notes</MenuItem>
                  <MenuItem value="roll & write">Roll & Write</MenuItem>
                </TextField>

                <TextField
                  id="user-select"
                  label="User"
                  select
                  fullWidth
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  size="small"
                >
                  <MenuItem value="all">All Users</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user} value={user}>
                      {user}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  id="sort-select"
                  label="Sort By"
                  select
                  fullWidth
                  value={(() => {
                    if (favoritesOnly) return "favorites";
                    if (publicOnly) return "public";
                    return sortBy;
                  })()}
                  onChange={(e) => handleSortChange(e.target.value)}
                  size="small"
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="favorites">Favorites Only</MenuItem>
                  <MenuItem value="public">Public Only</MenuItem>
                </TextField>
              </Box>
            </CardContent>
          </Card>

          {/* Filter and sort entries */}
          {(() => {
            let filteredEntries = [...entries];

            // Apply filters
            if (selectedApp !== "all") {
              filteredEntries = filteredEntries.filter(
                (entry) =>
                  entry.entryType.toLowerCase() === selectedApp.toLowerCase()
              );
            }

            if (selectedUser !== "all") {
              filteredEntries = filteredEntries.filter(
                (entry) => entry.user_email === selectedUser
              );
            }

            if (favoritesOnly) {
              filteredEntries = filteredEntries.filter(
                (entry) => entry.isFavorite
              );
            }

            if (publicOnly) {
              filteredEntries = filteredEntries.filter(
                (entry) => entry.isPublic
              );
            }

            // Apply sorting
            filteredEntries.sort((a, b) => {
              if (sortBy === "oldest") {
                return (
                  new Date(a.formattedDate).getTime() -
                  new Date(b.formattedDate).getTime()
                );
              } else {
                return (
                  new Date(b.formattedDate).getTime() -
                  new Date(a.formattedDate).getTime()
                );
              }
            });

            return (
              <>
                {/* Entries Table */}
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  {filteredEntries.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                      <Typography variant="body1" color="text.secondary">
                        No entries found with current filters
                      </Typography>
                    </Box>
                  ) : (
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "grey.50" }}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="medium">
                              Title
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="medium">
                              Type
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="medium">
                              Author
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="medium">
                              Username
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="medium">
                              Date
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="medium">
                              Status
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="medium">
                              Actions
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredEntries.map((entry) => (
                          <TableRow
                            key={`${entry.tableName}-${entry.id}`}
                            hover
                            sx={{ "&:hover": { bgcolor: "grey.50" } }}
                          >
                            <TableCell>
                              <Link
                                href={getEntryUrl(entry)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: "none" }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    maxWidth: 300,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    color: "primary.main",
                                    "&:hover": {
                                      textDecoration: "underline",
                                      cursor: "pointer",
                                    },
                                  }}
                                  title={entry.title}
                                >
                                  {entry.title}
                                </Typography>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={entry.entryType}
                                size="small"
                                color={getEntryTypeColor(entry.entryType)}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 200,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={entry.author}
                              >
                                {entry.author}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 200,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={entry.user_email || "Unknown"}
                              >
                                {entry.user_email
                                  ? entry.user_email.substring(0, 50)
                                  : "Unknown"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {entry.formattedDate}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 0.5,
                                  flexWrap: "wrap",
                                }}
                              >
                                {entry.isFavorite && (
                                  <Chip
                                    icon={<StarIcon />}
                                    label="Favorite"
                                    size="small"
                                    color="warning"
                                    variant="filled"
                                  />
                                )}
                                {entry.isPublic && (
                                  <Chip
                                    icon={<PublicIcon />}
                                    label="Public"
                                    size="small"
                                    color="success"
                                    variant="filled"
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDelete(entry)}
                                disabled={deleting === entry.id}
                                title="Delete entry"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TableContainer>
              </>
            );
          })()}
        </Paper>
      </Box>

      {/* Footer */}
      {renderFooter("component")}
    </Box>
  );
}
