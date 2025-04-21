import React, { useState, useEffect } from "react";
import {
  Menu as MenuIcon,
  X as XIcon,
  User as UserIcon,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const NavigationMenu: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Create Supabase client for getting user data
  const supabase = createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL || "",
    import.meta.env.PUBLIC_SUPABASE_KEY || ""
  );

  useEffect(() => {
    setCurrentPath(window.location.pathname);

    // Fetch user data on component mount
    const fetchUserData = async () => {
      try {
        setIsLoadingUser(true);
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error fetching user session:", error);
          return;
        }

        if (data.session?.user) {
          setUserEmail(data.session.user.email || null);
        }
      } catch (error) {
        console.error("Unexpected error fetching user data:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  const links = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Generate", href: "/flashcards/generate" },
    { name: "My Flashcards", href: "/flashcards" },
    { name: "Session", href: "/session" },
  ];

  const handleSignOut = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError(null);

    // Close dropdown
    setUserDropdownOpen(false);

    // Call the server-side logout endpoint
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest", // CSRF protection
        },
      });

      if (response.redirected) {
        // Server returned a redirect, follow it
        window.location.href = response.url;
      } else if (response.ok) {
        // Server responded OK but without redirect, manually redirect
        window.location.href = "/login";
      } else {
        // Handle error
        const errorData = await response.json().catch(() => null);
        setLogoutError(errorData?.error || "Logout failed. Please try again.");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Error during logout:", error);
      setLogoutError("Network error. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setMenuOpen(!menuOpen);
    }
  };

  const handleUserDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setUserDropdownOpen(!userDropdownOpen);
    } else if (e.key === "Escape" && userDropdownOpen) {
      e.preventDefault();
      setUserDropdownOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (userDropdownOpen && !target.closest(".user-dropdown-container")) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  const isActive = (href: string) => currentPath === href;

  // Function to get user initials for avatar
  const getUserInitials = () => {
    if (!userEmail) return "?";
    return userEmail.charAt(0).toUpperCase();
  };

  return (
    <nav
      className="bg-gray-800 text-gray-100"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <a
              href="/dashboard"
              className="text-xl font-bold"
              aria-label="10xFlashCards Home"
            >
              10xFlashCards
            </a>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.name}
              </a>
            ))}

            {/* User Avatar and Dropdown */}
            <div className="relative user-dropdown-container ml-2">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                onKeyDown={handleUserDropdownKeyDown}
                className="flex items-center space-x-1 px-2 py-1 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
                aria-label="User menu"
                disabled={isLoadingUser}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-medium">
                  {isLoadingUser ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    getUserInitials()
                  )}
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-700"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm text-gray-400">Signed in as</p>
                    <p className="text-sm font-medium text-white truncate">
                      {userEmail || "..."}
                    </p>
                  </div>

                  <a
                    href="/profile"
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    role="menuitem"
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </a>

                  <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    role="menuitem"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              onKeyDown={handleKeyDown}
              aria-label={
                menuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-controls="mobile-menu"
              aria-expanded={menuOpen}
              tabIndex={0}
              className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white p-2 rounded-md"
            >
              {menuOpen ? (
                <XIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <MenuIcon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-gray-800" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.href)
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.name}
              </a>
            ))}

            {/* User info and logout in mobile menu */}
            {userEmail && (
              <div className="px-3 py-2 text-gray-400 text-sm">
                <p>
                  Signed in as:{" "}
                  <span className="font-medium text-white">{userEmail}</span>
                </p>
              </div>
            )}

            <a
              href="/profile"
              className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </a>

            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
              aria-busy={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
          {logoutError && (
            <div className="px-4 py-2 text-sm text-red-400" role="alert">
              {logoutError}
            </div>
          )}
        </div>
      )}
      {logoutError && !menuOpen && (
        <div className="hidden md:block max-w-7xl mx-auto px-4 py-2">
          <div className="text-sm text-red-400" role="alert">
            {logoutError}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationMenu;
