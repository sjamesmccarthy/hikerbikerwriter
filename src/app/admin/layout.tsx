"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tab,
  Tabs,
  Chip,
  Button,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Check admin status when session changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (status === "loading") return;

      if (!session) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/admin/check");
        const data = await response.json();
        setIsAdmin(data.isAdmin);

        if (!data.isAdmin) {
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        router.push("/");
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [session, status, router]);

  const navItems = [
    {
      name: "Content Management",
      href: "/admin/entries",
      description: "Manage recipes, field notes, and roll & write entries",
    },
    {
      name: "User Management",
      href: "/admin/user-management",
      description: "Manage users and their permissions",
    },
  ];

  const getCurrentTabValue = () => {
    const currentItem = navItems.find((item) => item.href === pathname);
    return currentItem ? navItems.indexOf(currentItem) : 0;
  };

  // Show loading state while checking authentication and admin status
  if (status === "loading" || checkingAdmin) {
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
            {status === "loading" ? "Loading..." : "Checking admin access..."}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Don't render anything if not authenticated or not admin (will redirect)
  if (!session || isAdmin === false) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      {/* Navigation */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ minHeight: "56px !important" }}>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Button
              component={Link}
              href="/"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              sx={{ textTransform: "none", mr: 1 }}
            >
              Back To Site
            </Button>
            <Typography variant="h6" sx={{ color: "grey.500" }}>
              |
            </Typography>
            <Chip
              label="ADMIN"
              color="error"
              size="small"
              variant="filled"
              sx={{ ml: 2 }}
            />
          </Box>

          {/* Desktop Auth UI */}
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 1,
            }}
          >
            {(() => {
              if (status === "loading") {
                return (
                  <span className="font-mono text-gray-500 text-sm">
                    Loading...
                  </span>
                );
              }
              if (!session) {
                return (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/auth/signup"
                      className="px-4 py-2 rounded bg-gray-600 text-white font-mono text-sm hover:bg-gray-700 transition"
                    >
                      Sign Up
                    </Link>
                    <span className="text-gray-400">|</span>
                    <button
                      onClick={() => signIn("google")}
                      className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                    >
                      Sign in with Google
                    </button>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-600 text-sm">
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
              );
            })()}
          </Box>

          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile menu */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
        }}
      >
        <List>
          {navItems.map((item) => (
            <ListItem
              key={item.name}
              component={Link}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              sx={{
                bgcolor:
                  pathname === item.href ? "action.selected" : "transparent",
                borderLeft: pathname === item.href ? 4 : 0,
                borderColor: "primary.main",
              }}
            >
              <ListItemText primary={item.name} secondary={item.description} />
            </ListItem>
          ))}

          {/* Mobile Auth UI */}
          {(() => {
            if (status === "loading") {
              return (
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderTop: 1,
                    borderColor: "divider",
                    mt: 1,
                  }}
                >
                  <span className="font-mono text-gray-500 text-sm">
                    Loading...
                  </span>
                </Box>
              );
            }
            if (!session) {
              return (
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderTop: 1,
                    borderColor: "divider",
                    mt: 1,
                  }}
                >
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/auth/signup"
                      className="px-4 py-2 rounded bg-gray-600 text-white font-mono text-sm hover:bg-gray-700 transition text-center"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign Up
                    </Link>
                    <button
                      onClick={() => {
                        signIn("google");
                        setMobileOpen(false);
                      }}
                      className="px-4 py-2 rounded bg-blue-600 text-white font-mono text-sm hover:bg-blue-700 transition"
                    >
                      Sign in with Google
                    </button>
                  </div>
                </Box>
              );
            }
            return (
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderTop: 1,
                  borderColor: "divider",
                  mt: 1,
                }}
              >
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-blue-600 text-sm text-center">
                    Signed in as {session.user?.name}
                  </span>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileOpen(false);
                    }}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-mono text-sm hover:bg-gray-300 transition cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </Box>
            );
          })()}
        </List>
      </Drawer>

      {/* Navigation Tabs - Now above main content */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Tabs
          value={getCurrentTabValue()}
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          {navItems.map((item) => (
            <Tab
              key={item.name}
              label={item.name}
              component={Link}
              href={item.href}
              sx={{ textTransform: "none" }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Page content */}
      <Box component="main">{children}</Box>
    </Box>
  );
}
