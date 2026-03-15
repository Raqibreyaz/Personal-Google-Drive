import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaArrowLeft } from "react-icons/fa";
import {
  getCurrentUser,
  getAllUsers,
  logoutUser as apiLogoutUser,
  softDeleteUser as apiSoftDeleteUser,
  hardDeleteUser as apiHardDeleteUser,
  recoverUser as apiRecoverUser,
  changeUserRole as apiChangeUserRole,
} from "./api/user.js";

const ROLES = ["Owner", "Admin", "Manager", "User"];
const ROLE_LEVEL = { Owner: 0, Admin: 1, Manager: 2, User: 3 };

export default function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (currentUser && currentUser.role === "User") {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const logoutMutation = useMutation({
    mutationFn: (userId) => apiLogoutUser(userId),
    onSuccess: invalidateUsers,
  });

  const softDeleteMutation = useMutation({
    mutationFn: (userId) => apiSoftDeleteUser(userId),
    onSuccess: invalidateUsers,
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (userId) => apiHardDeleteUser(userId),
    onSuccess: invalidateUsers,
  });

  const recoverMutation = useMutation({
    mutationFn: (userId) => apiRecoverUser(userId),
    onSuccess: invalidateUsers,
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) => apiChangeUserRole(userId, newRole),
    onSuccess: invalidateUsers,
  });

  function canActOn(targetRole) {
    if (!currentUser) return false;
    return ROLE_LEVEL[currentUser.role] < ROLE_LEVEL[targetRole];
  }

  function getAssignableRoles() {
    if (!currentUser) return [];
    return ROLES.filter((r) => ROLE_LEVEL[currentUser.role] < ROLE_LEVEL[r]);
  }

  const logoutUser = (userId) => {
    if (!confirm("You are about to logout this user!")) return;
    logoutMutation.mutate(userId);
  };

  const softDeleteUser = (userId) => {
    if (!confirm("Soft-delete this user? Their account will be deactivated but can be recovered.")) return;
    softDeleteMutation.mutate(userId);
  };

  const hardDeleteUser = (userId) => {
    if (!confirm("⚠️ PERMANENTLY delete this user and ALL their data? This cannot be undone!")) return;
    hardDeleteMutation.mutate(userId);
  };

  const recoverUser = (userId) => {
    if (!confirm("Recover this user?")) return;
    recoverMutation.mutate(userId);
  };

  const changeRole = (userId, newRole) => {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    changeRoleMutation.mutate({ userId, newRole });
  };


  const assignableRoles = getAssignableRoles();
  const isOwner = currentUser?.role === "Owner";
  const isAdminOrOwner = currentUser?.role === "Admin" || currentUser?.role === "Owner";

  const actionBtnBase = "py-1.5 px-3 text-[13px] border-none rounded text-white cursor-pointer transition-colors duration-200";

  return (
    <div className="max-w-[900px] mx-auto p-5 font-sans">
      <header className="flex items-center gap-3 mb-6 border-b-2 border-gray-300 pb-3">
        <button className="bg-none border-none text-xl cursor-pointer text-blue-600 flex items-center p-1.5 rounded-full hover:bg-gray-100" onClick={() => navigate("/")}>
          <FaArrowLeft />
        </button>
        <div>
          <h1 className="m-0 text-3xl font-bold">All Users</h1>
          <p className="mt-1 text-[0.9rem] text-gray-500">
            {currentUser?.name} — {currentUser?.role}
          </p>
        </div>
      </header>

      {(error || logoutMutation.error || softDeleteMutation.error || hardDeleteMutation.error || recoverMutation.error || changeRoleMutation.error) && (
        <div className="bg-red-50 text-red-700 py-2.5 px-4 rounded-md mb-4 text-[0.9rem]">
          {error?.message || 
           logoutMutation.error?.message || 
           softDeleteMutation.error?.message || 
           hardDeleteMutation.error?.message || 
           recoverMutation.error?.message || 
           changeRoleMutation.error?.message}
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-200 p-3 text-left bg-gray-50 font-semibold text-[0.9rem] text-gray-700">Name</th>
            <th className="border border-gray-200 p-3 text-left bg-gray-50 font-semibold text-[0.9rem] text-gray-700">Email</th>
            <th className="border border-gray-200 p-3 text-left bg-gray-50 font-semibold text-[0.9rem] text-gray-700">Role</th>
            <th className="border border-gray-200 p-3 text-left bg-gray-50 font-semibold text-[0.9rem] text-gray-700">Status</th>
            {isAdminOrOwner && <th className="border border-gray-200 p-3 text-left bg-gray-50 font-semibold text-[0.9rem] text-gray-700">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={isAdminOrOwner ? 5 : 4} className="text-center p-10 text-gray-500 italic">Loading...</td></tr>
          ) : users.map((user) => {
            if (user.email === currentUser?.email) return null;
            const isDeleted = user.isDeleted;
            if (isDeleted && !isOwner) return null;
            const userIsUnderMe = canActOn(user.role);

            return (
              <tr key={user._id} className={isDeleted ? "opacity-60 bg-red-50" : ""}>
                <td className="border border-gray-200 p-3">
                  {user.name}
                  {isDeleted && (
                    <span className="inline-block bg-red-200 text-red-800 text-[0.7rem] py-0.5 px-1.5 rounded-lg ml-2 font-semibold uppercase">
                      deleted
                    </span>
                  )}
                </td>
                <td className="border border-gray-200 p-3">{user.email}</td>
                <td className="border border-gray-200 p-3">
                  {userIsUnderMe && !isDeleted ? (
                    <select
                      className="py-1.5 px-2.5 border border-gray-300 rounded text-[0.85rem] bg-white cursor-pointer focus:outline-none focus:border-blue-600"
                      value={user.role}
                      onChange={(e) => changeRole(user._id, e.target.value)}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role} disabled={!assignableRoles.includes(role)}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td className="border border-gray-200 p-3">
                  <span
                    className={`inline-block py-0.5 px-2.5 rounded-xl text-[0.8rem] font-medium ${user.isLoggedIn ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {user.isLoggedIn ? "Online" : "Offline"}
                  </span>
                </td>
                {isAdminOrOwner && (
                  <td className="border border-gray-200 p-3">
                    <div className="flex gap-2 flex-wrap">
                      {isDeleted ? (
                        isOwner && (
                          <>
                            <button className={`${actionBtnBase} bg-green-600 hover:bg-green-700`} onClick={() => recoverUser(user._id)}>
                              Recover
                            </button>
                            <button className={`${actionBtnBase} bg-pink-900 hover:bg-pink-950`} onClick={() => hardDeleteUser(user._id)}>
                              Delete Permanently
                            </button>
                          </>
                        )
                      ) : userIsUnderMe ? (
                        <>
                          <button
                            className={`${actionBtnBase} bg-blue-600 hover:enabled:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed`}
                            onClick={() => logoutUser(user._id)}
                            disabled={!user.isLoggedIn}
                          >
                            Logout
                          </button>
                          <button className={`${actionBtnBase} bg-red-600 hover:bg-red-700`} onClick={() => softDeleteUser(user._id)}>
                            Delete
                          </button>
                          {isOwner && (
                            <button className={`${actionBtnBase} bg-pink-900 hover:bg-pink-950`} onClick={() => hardDeleteUser(user._id)}>
                              Delete Permanently
                            </button>
                          )}
                        </>
                      ) : null}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
