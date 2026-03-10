import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import useApiCall from "./hooks/useApiCall.js";

const ROLES = ["Owner", "Admin", "Manager", "User"];
const ROLE_LEVEL = { Owner: 0, Admin: 1, Manager: 2, User: 3 };

export default function UsersPage() {
  const navigate = useNavigate();
  const { execute, error, setError } = useApiCall();

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  function canActOn(targetRole) {
    if (!currentUser) return false;
    return ROLE_LEVEL[currentUser.role] < ROLE_LEVEL[targetRole];
  }

  function getAssignableRoles() {
    if (!currentUser) return [];
    return ROLES.filter((r) => ROLE_LEVEL[currentUser.role] < ROLE_LEVEL[r]);
  }

  const logoutUser = (userId) => {
    const confirmed = confirm("You are about to logout this user!");
    if (!confirmed) return;
    execute(
      () => apiLogoutUser(userId),
      () => setUsers((prev) => prev.map((user) => user._id === userId ? { ...user, isLoggedIn: false } : user)),
    );
  };

  const softDeleteUser = (userId) => {
    const confirmed = confirm("Soft-delete this user? Their account will be deactivated but can be recovered.");
    if (!confirmed) return;
    execute(
      () => apiSoftDeleteUser(userId),
      () => setUsers((prev) => prev.map((user) => user._id === userId ? { ...user, isDeleted: true } : user)),
    );
  };

  const hardDeleteUser = (userId) => {
    const confirmed = confirm("⚠️ PERMANENTLY delete this user and ALL their data? This cannot be undone!");
    if (!confirmed) return;
    execute(
      () => apiHardDeleteUser(userId),
      () => setUsers((prev) => prev.filter((user) => user._id !== userId)),
    );
  };

  const recoverUser = (userId) => {
    const confirmed = confirm("Recover this user?");
    if (!confirmed) return;
    execute(
      () => apiRecoverUser(userId),
      () => setUsers((prev) => prev.map((user) => user._id === userId ? { ...user, isDeleted: false } : user)),
    );
  };

  const changeRole = (userId, newRole) => {
    const confirmed = confirm(`Change this user's role to ${newRole}?`);
    if (!confirmed) return;
    execute(
      () => apiChangeUserRole(userId, newRole),
      () => setUsers((prev) => prev.map((user) => user._id === userId ? { ...user, role: newRole } : user)),
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const userData = await getCurrentUser();
        if (userData.role !== "User") setCurrentUser(userData);
        else navigate("/");
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (err) {
        // 401 is handled by interceptor (auto-redirect to /login)
        setError(err.message);
      }
    })();
  }, []);

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

      {error && (
        <div className="bg-red-50 text-red-700 py-2.5 px-4 rounded-md mb-4 text-[0.9rem]">{error}</div>
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
          {users.map((user) => {
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
