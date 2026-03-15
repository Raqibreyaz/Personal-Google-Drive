import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaFolderPlus,
  FaUpload,
  FaUser,
  FaUsers,
  FaShareAlt,
  FaSignOutAlt,
  FaSignInAlt,
  FaChevronRight,
} from "react-icons/fa";
import ProfileImage from "./ProfileImage";
import { sanitizeText } from "../utils/sanitize.js";
import { getCurrentUser, logoutSelf, logoutAllDevices } from "../api/user.js";

function DirectoryHeader({
  directoryName,
  directoryPath = [],
  onCreateFolderClick,
  onUploadFilesClick,
  fileInputRef,
  handleFileSelect,
  disabled = false,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: userData, error: userError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loggedIn = !!userData;
  const userName = userData ? sanitizeText(userData.name) : "Guest User";
  const userEmail = userData?.email || "guest@example.com";
  const userRole = userData?.role || "User";
  const picture = userData?.picture || null;
  const maxStorageInBytes = userData?.maxStorageInBytes || 1073741824;
  const usedStorageInBytes = userData?.usedStorageInBytes || 0;

  const usedGB = usedStorageInBytes / 1024 ** 3;
  const totalGB = maxStorageInBytes / 1024 ** 3;

  const logoutMutation = useMutation({
    mutationFn: logoutSelf,
    onSuccess: () => {
      queryClient.setQueryData(["currentUser"], null);
      navigate("/login");
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: logoutAllDevices,
    onSuccess: () => {
      queryClient.setQueryData(["currentUser"], null);
      navigate("/login");
    },
  });

  const handleUserIconClick = () => setShowUserMenu((prev) => !prev);

  const handleLogout = () => {
    if (confirm("Do you really want to logout?")) {
      logoutMutation.mutate();
    }
    setShowUserMenu(false);
  };

  const handleLogoutAll = () => {
    if (confirm("You are about to logout all sessions!")) {
      logoutAllMutation.mutate();
    }
    setShowUserMenu(false);
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
      <div className="flex items-center m-0 mr-5 text-xl sm:text-2xl rounded text-gray-800 font-semibold overflow-x-auto whitespace-nowrap hide-scrollbar flex-1">
        <span
          className="cursor-pointer hover:underline text-blue-600 transition-colors"
          onClick={() => navigate("/")}
        >
          My Drive
        </span>
        {directoryPath && directoryPath.slice(1).map((folder) => (
          <span key={folder._id} className="flex items-center">
            <FaChevronRight className="mx-2 text-sm text-gray-400" />
            <span
              className="cursor-pointer hover:underline text-blue-600 transition-colors truncate max-w-[120px] sm:max-w-[200px]"
              onClick={() => navigate(`/directory/${folder._id}`)}
              title={folder.name}
            >
              {folder.name}
            </span>
          </span>
        ))}
        {directoryName !== "My Drive" && (
          <span className="flex items-center">
            <FaChevronRight className="mx-2 text-sm text-gray-400" />
            <span className="text-gray-600 truncate max-w-[150px] sm:max-w-xs block" title={directoryName}>
              {directoryName}
            </span>
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2.5 ml-4">
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
                    <div className="flex flex-col text-xs mr-2 mt-2">
                      <div className="w-40 h-1 bg-gray-300 rounded-full overflow-hidden mb-1">
                        <div
                          className="bg-blue-500 rounded-full h-full"
                          style={{ width: `${(usedGB / totalGB) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs">
                        {usedGB.toFixed(2)} GB of {totalGB} GB used
                      </div>
                    </div>
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
