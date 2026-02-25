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
  const BASE_URL = import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("guest@example.com");
  const [userRole, setUserRole] = useState("User");
  const [picture, setPicture] = useState(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`${BASE_URL}/user`, { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setUserName(data.name);
          setUserEmail(data.email);
          setUserRole(data.role);
          setLoggedIn(true);
        } else if (response.status === 401) {
          setUserName("Guest User");
          setUserEmail("guest@example.com");
          setLoggedIn(false);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    }
    fetchUser();
  }, [BASE_URL]);

  const handleUserIconClick = () => setShowUserMenu((prev) => !prev);

  const handleLogout = async () => {
    const confirmed = confirm("Do you really want to logout?");
    if (!confirmed) return;
    try {
      const response = await fetch(`${BASE_URL}/user/logout`, { method: "POST", credentials: "include" });
      if (response.ok) {
        setLoggedIn(false);
        setUserName("Guest User");
        setPicture(null);
        setUserEmail("guest@example.com");
        navigate("/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setShowUserMenu(false);
    }
  };

  const handleLogoutAll = async () => {
    const confirmed = confirm("You are about to logout all sessions!");
    if (!confirmed) return;
    try {
      const response = await fetch(`${BASE_URL}/user/logout/all`, { method: "POST", credentials: "include" });
      if (response.ok) {
        setLoggedIn(false);
        setUserName("Guest User");
        setPicture(null);
        setUserEmail("guest@example.com");
        navigate("/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setShowUserMenu(false);
    }
  };

  useEffect(() => {
    function handleDocumentClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  const iconBtnClass = "bg-transparent border-none cursor-pointer text-xl text-blue-600 flex items-center justify-center disabled:opacity-50 hover:enabled:text-blue-800";

  return (
    <header className="flex flex-wrap justify-between items-center border-b-2 border-gray-300 py-2.5 sticky top-0 z-10 bg-white">
      <h1 className="m-0 mr-5 text-2xl rounded">{directoryName}</h1>
      <div className="flex flex-wrap items-center gap-2.5">
        <button className={iconBtnClass} title="Create Folder" onClick={onCreateFolderClick} disabled={disabled}>
          <FaFolderPlus />
        </button>
        <button className={iconBtnClass} title="Upload Files" onClick={onUploadFilesClick} disabled={disabled}>
          <FaUpload />
        </button>
        <input ref={fileInputRef} id="file-upload" type="file" style={{ display: "none" }} multiple onChange={handleFileSelect} />

        <div className="relative" ref={userMenuRef}>
          <button className={iconBtnClass} title="User Menu" onClick={handleUserIconClick} disabled={disabled}>
            {picture ? <ProfileImage src={picture} /> : <FaUser />}
          </button>

          {showUserMenu && (
            <div className="absolute top-7 right-0 bg-white border border-gray-200 rounded-md shadow-md z-[999] min-w-[150px]">
              {loggedIn ? (
                <div>
                  <div className="flex flex-col overflow-hidden gap-1 px-4 py-2 cursor-auto">
                    <span className="font-semibold text-gray-800">{userName}</span>
                    <span className="text-[0.85rem] text-gray-500">{userEmail}</span>
                  </div>
                  <div className="border-t border-gray-200" />
                  <div
                    className="flex overflow-hidden gap-1 px-4 py-2 cursor-pointer text-gray-700 text-[0.95rem] whitespace-nowrap hover:bg-gray-100"
                    onClick={() => { navigate("/shared"); setShowUserMenu(false); }}
                  >
                    <FaShareAlt className="text-base text-blue-600" />
                    <span>Shared with Me</span>
                  </div>
                  {userRole !== "User" && (
                    <div
                      className="flex overflow-hidden gap-1 px-4 py-2 cursor-pointer text-gray-700 text-[0.95rem] whitespace-nowrap hover:bg-gray-100"
                      onClick={() => { navigate("/users"); setShowUserMenu(false); }}
                    >
                      <FaUsers className="text-base text-blue-600" />
                      <span>Manage Users</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200" />
                  <div className="flex overflow-hidden gap-1 px-4 py-2 cursor-pointer text-gray-700 text-[0.95rem] whitespace-nowrap hover:bg-gray-100" onClick={handleLogout}>
                    <FaSignOutAlt className="text-base text-blue-600" />
                    <span>Logout</span>
                  </div>
                  <div className="flex overflow-hidden gap-1 px-4 py-2 cursor-pointer text-gray-700 text-[0.95rem] whitespace-nowrap hover:bg-gray-100" onClick={handleLogoutAll}>
                    <FaSignOutAlt className="text-base text-blue-600" />
                    <span>Logout All</span>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="flex overflow-hidden gap-1 px-4 py-2 cursor-pointer text-gray-700 text-[0.95rem] whitespace-nowrap hover:bg-gray-100"
                    onClick={() => { navigate("/login"); setShowUserMenu(false); }}
                  >
                    <FaSignInAlt className="text-base text-blue-600" />
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
