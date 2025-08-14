"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  IconButton,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

interface User {
  id: number;
  name: string;
  email: string;
  oauth: string;
  created: string;
  is_admin: number;
}

interface SignupRequest {
  id: number;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  notes?: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState(0); // 0 = Users, 1 = Signup Requests
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SignupRequest | null>(
    null
  );
  const [updating, setUpdating] = useState<number | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        const error = await response.json();
        console.error("Failed to fetch users:", error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [search]);

  const fetchSignupRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filter) params.append("filter", filter);

      const response = await fetch(`/api/admin/signup-requests?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSignupRequests(data.signupRequests);
      } else {
        const error = await response.json();
        console.error("Failed to fetch signup requests:", error);
      }
    } catch (error) {
      console.error("Error fetching signup requests:", error);
    }
  }, [search, filter]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        if (activeTab === 0) {
          await fetchUsers();
        } else {
          await fetchSignupRequests();
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [activeTab, fetchUsers, fetchSignupRequests]);

  // Search and filter changes (debounced)
  useEffect(() => {
    if (loading) return; // Don't trigger during initial load

    const timeoutId = setTimeout(() => {
      if (activeTab === 0) {
        fetchUsers();
      } else {
        fetchSignupRequests();
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [search, filter, fetchUsers, fetchSignupRequests, activeTab, loading]);

  const handleApproveRequest = async (request: SignupRequest) => {
    setProcessing(request.id);
    try {
      const response = await fetch("/api/admin/signup-requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: request.id,
          action: "approve",
        }),
      });

      if (response.ok) {
        setSignupRequests(
          signupRequests.map((r) =>
            r.id === request.id
              ? {
                  ...r,
                  status: "approved",
                  processed_at: new Date().toISOString(),
                }
              : r
          )
        );
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("An error occurred while approving the request");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRequest = async (request: SignupRequest) => {
    setProcessing(request.id);
    try {
      const response = await fetch("/api/admin/signup-requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: request.id,
          action: "reject",
        }),
      });

      if (response.ok) {
        setSignupRequests(
          signupRequests.map((r) =>
            r.id === request.id
              ? {
                  ...r,
                  status: "rejected",
                  processed_at: new Date().toISOString(),
                }
              : r
          )
        );
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("An error occurred while rejecting the request");
    } finally {
      setProcessing(null);
    }
  };

  const handleAdminToggle = async (user: User, newAdminStatus: boolean) => {
    setUpdating(user.id);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          is_admin: newAdminStatus,
        }),
      });

      if (response.ok) {
        // Update the user in state
        setUsers(
          users.map((u) =>
            u.id === user.id ? { ...u, is_admin: newAdminStatus ? 1 : 0 } : u
          )
        );
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("An error occurred while updating the user");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== selectedUser.id));
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("An error occurred while deleting the user");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{ fontWeight: "bold", mb: 1 }}
            >
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage user accounts, permissions, and signup requests
            </Typography>
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Users" />
            <Tab label="Signup Requests" />
          </Tabs>

          {/* Search and Filter */}
          <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
            <CardContent>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  fullWidth
                  label="Search by email or name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <SearchIcon sx={{ color: "action.active", mr: 1 }} />
                      ),
                    },
                  }}
                  placeholder="Type to search..."
                  sx={{ flex: 1, minWidth: "300px" }}
                />
                {activeTab === 1 && (
                  <FormControl sx={{ minWidth: "150px" }}>
                    <InputLabel>Filter</InputLabel>
                    <Select
                      value={filter}
                      label="Filter"
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                      <MenuItem value="newest">Newest First</MenuItem>
                      <MenuItem value="oldest">Oldest First</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Box sx={{ mb: 3, display: "flex", gap: 3, flexWrap: "wrap" }}>
            {activeTab === 0 ? (
              <>
                <Chip
                  label={`Total Users: ${users.length}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Admins: ${
                    users.filter((u) => u.is_admin === 1).length
                  }`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={`Regular Users: ${
                    users.filter((u) => u.is_admin === 0).length
                  }`}
                  color="default"
                  variant="outlined"
                />
              </>
            ) : (
              <>
                <Chip
                  label={`Total Requests: ${signupRequests.length}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Pending: ${
                    signupRequests.filter((r) => r.status === "pending").length
                  }`}
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  label={`Approved: ${
                    signupRequests.filter((r) => r.status === "approved").length
                  }`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={`Rejected: ${
                    signupRequests.filter((r) => r.status === "rejected").length
                  }`}
                  color="error"
                  variant="outlined"
                />
              </>
            )}
          </Box>

          {/* Users Table */}
          {activeTab === 0 && (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Name
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Email
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        OAuth Provider
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Created
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Admin
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
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {search
                            ? "No users found matching your search"
                            : "No users found"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {user.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.oauth}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(user.created)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={user.is_admin === 1}
                                onChange={(e) =>
                                  handleAdminToggle(user, e.target.checked)
                                }
                                disabled={updating === user.id}
                                size="small"
                              />
                            }
                            label=""
                            sx={{ m: 0 }}
                          />
                          {updating === user.id && (
                            <CircularProgress size={16} sx={{ ml: 1 }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleDeleteClick(user)}
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Signup Requests Table */}
          {activeTab === 1 && (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Name
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Email
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Status
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Requested
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
                  {signupRequests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {search
                            ? "No signup requests found matching your search"
                            : "No signup requests found"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    signupRequests.map((request) => (
                      <TableRow key={request.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {request.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {request.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.status}
                            size="small"
                            color={
                              request.status === "pending"
                                ? "warning"
                                : request.status === "approved"
                                ? "success"
                                : "error"
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(request.requested_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {request.status === "pending" ? (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <IconButton
                                onClick={() => handleApproveRequest(request)}
                                color="success"
                                size="small"
                                disabled={processing === request.id}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                onClick={() => handleRejectRequest(request)}
                                color="error"
                                size="small"
                                disabled={processing === request.id}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                              {processing === request.id && (
                                <CircularProgress size={16} sx={{ ml: 1 }} />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              {request.status === "approved"
                                ? "Approved"
                                : "Rejected"}
                              {request.processed_at && <br />}
                              {request.processed_at && (
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  {formatDate(request.processed_at)}
                                </Typography>
                              )}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user &ldquo;{selectedUser?.name}
            &rdquo; ({selectedUser?.email})? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
