import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFolderPlus,
  FaUpload,
  FaUser,
  FaUsers,
  FaShareAlt,
  FaSignOutAlt,
  FaSignInAlt,
} from "react-icons/fa";
import ProfileImage from "./ProfileImage";

function DirectoryHeader({
  directoryName,
  onCreateFolderClick,
  onUploadFilesClick,
  fileInputRef,
  handleFileSelect,
  disabled = false,
}) {
  // Use a constant for the API base URL
  const BASE_URL = import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("guest@example.com");
  const [userRole, setUserRole] = useState("User");
  const [picture, setPicture] = useState(null);

  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // -------------------------------------------
  // 1. Fetch user info from /user on mount
  // -------------------------------------------
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`${BASE_URL}/user`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          // Set user info if logged in
          setUserName(data.name);
          setUserEmail(data.email);
          setUserRole(data.role);
          // setPicture(data.picture);
          setLoggedIn(true);
        } else if (response.status === 401) {
          // User not logged in
          setUserName("Guest User");
          setUserEmail("guest@example.com");
          setLoggedIn(false);
        } else {
          // Handle other error statuses if needed
          console.error("Error fetching user info:", response.status);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    }
    fetchUser();
  }, [BASE_URL]);

  // -------------------------------------------
  // 2. Toggle user menu
  // -------------------------------------------
  const handleUserIconClick = () => {
    setShowUserMenu((prev) => !prev);
  };

  // -------------------------------------------
  // 3. Logout handler
  // -------------------------------------------
  const handleLogout = async () => {
    const confirmed = confirm(`Do you really want to logout?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${BASE_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        console.log("Logged out successfully");
        // Optionally reset local state
        setLoggedIn(false);
        setUserName("Guest User");
        setPicture(null);
        setUserEmail("guest@example.com");
        navigate("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setShowUserMenu(false);
    }
  };

  const handleLogoutAll = async () => {
    const confirmed = confirm(`You are about to logout all sessions!`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${BASE_URL}/user/logout/all`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        console.log("Logged out successfully");
        // Optionally reset local state
        setLoggedIn(false);
        setUserName("Guest User");
        setPicture(null);
        setUserEmail("guest@example.com");
        navigate("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setShowUserMenu(false);
    }
  };

  // -------------------------------------------
  // 4. Close menu on outside click
  // -------------------------------------------
  useEffect(() => {
    function handleDocumentClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);
  return (
    <header className="directory-header">
      <h1>{directoryName}</h1>
      <div className="header-links">
        {/* Create Folder (icon button) */}
        <button
          className="icon-button"
          title="Create Folder"
          onClick={onCreateFolderClick}
          disabled={disabled}
        >
          <FaFolderPlus />
        </button>

        {/* Upload Files (icon button) */}
        <button
          className="icon-button"
          title="Upload Files"
          onClick={onUploadFilesClick}
          disabled={disabled}
        >
          <FaUpload />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          style={{ display: "none" }}
          multiple
          onChange={handleFileSelect}
        />

        {/* User Icon & Dropdown Menu */}
        <div className="user-menu-container" ref={userMenuRef}>
          <button
            className="icon-button"
            title="User Menu"
            onClick={handleUserIconClick}
            disabled={disabled}
          >
            {picture ? <ProfileImage src={picture} /> : <FaUser />}
          </button>

          {showUserMenu && (
            <div className="user-menu">
              {loggedIn ? (
                <div>
                  {/* Display name & email if logged in */}
                  <div className="user-menu-item user-info">
                    <span className="user-name">{userName}</span>
                    <span className="user-email">{userEmail}</span>
                  </div>
                  <div className="user-menu-divider" />
                  <div
                    className="user-menu-item login-btn"
                    onClick={() => {
                      navigate("/shared");
                      setShowUserMenu(false);
                    }}
                  >
                    <FaShareAlt className="menu-item-icon" />
                    <span>Shared with Me</span>
                  </div>
                  {userRole !== "User" && (
                    <div
                      className="user-menu-item login-btn"
                      onClick={() => {
                        navigate("/users");
                        setShowUserMenu(false);
                      }}
                    >
                      <FaUsers className="menu-item-icon" />
                      <span>Manage Users</span>
                    </div>
                  )}
                  <div className="user-menu-divider" />
                  <div
                    className="user-menu-item login-btn"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="menu-item-icon" />
                    <span>Logout</span>
                  </div>
                  <div
                    className="user-menu-item login-btn"
                    onClick={handleLogoutAll}
                  >
                    <FaSignOutAlt className="menu-item-icon" />
                    <span>Logout All</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Show Login if not logged in */}
                  <div
                    className="user-menu-item login-btn"
                    onClick={() => {
                      navigate("/login");
                      setShowUserMenu(false);
                    }}
                  >
                    <FaSignInAlt className="menu-item-icon" />
                    <span>Login</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default DirectoryHeader;
