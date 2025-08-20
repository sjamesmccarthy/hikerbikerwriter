import React, { useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Button,
  Alert,
} from "@mui/material";

interface SearchUser {
  id: number;
  name: string;
  email: string;
}

interface AddPersonFormProps {
  onAdd: (
    user: SearchUser,
    relationship: string,
    network: string
  ) => Promise<void>;
  onClose: () => void;
}

export default function AddPersonForm({ onAdd, onClose }: AddPersonFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [relationship, setRelationship] = useState("");
  const [network, setNetwork] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      console.log("Searching for users with query:", query);
      const res = await fetch(
        `/api/search-users?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      console.log("Search results:", data);
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching users:", error);
      setError("Failed to search for users");
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser || !relationship || !network) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onAdd(selectedUser, relationship, network);
      onClose();
    } catch (error) {
      console.error("Error adding person:", error);
      setError("Failed to add person to family");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        size="small"
        label="Search for person"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        className="bg-white"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormControl size="small" fullWidth className="bg-white">
          <InputLabel>Relationship</InputLabel>
          <Select
            value={relationship}
            label="Relationship"
            onChange={(e) => setRelationship(e.target.value)}
          >
            <MenuItem value="Sister">Sister</MenuItem>
            <MenuItem value="Brother">Brother</MenuItem>
            <MenuItem value="Mother">Mother</MenuItem>
            <MenuItem value="Father">Father</MenuItem>
            <MenuItem value="Friend">Friend</MenuItem>
            <MenuItem value="Coworker">Coworker</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth className="bg-white">
          <InputLabel>Network</InputLabel>
          <Select
            value={network}
            label="Network"
            onChange={(e) => setNetwork(e.target.value)}
          >
            <MenuItem value="immediate">Immediate Family</MenuItem>
            <MenuItem value="extended">Extended Family</MenuItem>
            <MenuItem value="friend">Friend</MenuItem>
          </Select>
        </FormControl>
      </div>

      {searchResults.length > 0 && (
        <div className="bg-white rounded border border-gray-200 max-h-48 overflow-y-auto">
          <List>
            {searchResults.map((user) => (
              <ListItem key={user.id} disablePadding>
                <button
                  type="button"
                  onClick={() => setSelectedUser(user)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedUser(user);
                    }
                  }}
                  className={`w-full px-4 py-2 cursor-pointer text-left ${
                    selectedUser?.id === user.id ? "bg-gray-100" : ""
                  } hover:bg-gray-50`}
                >
                  <ListItemText primary={user.name} secondary={user.email} />
                </button>
              </ListItem>
            ))}
          </List>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={!selectedUser || !relationship || !network || isLoading}
        >
          {isLoading ? "Adding..." : "Add To Family"}
        </Button>
        <Button variant="outlined" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
