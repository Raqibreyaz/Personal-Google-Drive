import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./UsersPage.css";

// Must match backend Role order: Owner=0, Admin=1, Manager=2, User=3
const ROLES = ["Owner", "Admin", "Manager", "User"];
const ROLE_LEVEL = { Owner: 0, Admin: 1, Manager: 2, User: 3 };

export default function UsersPage() {
  const BACKEND_URI =
    import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  // Can the current user act on this target user? (target must be strictly below)
  function canActOn(targetRole) {
    if (!currentUser) return false;
    return ROLE_LEVEL[currentUser.role] < ROLE_LEVEL[targetRole];
  }

  // Get roles the current user is allowed to assign (strictly below their own level)
  function getAssignableRoles() {
    if (!currentUser) return [];
    return ROLES.filter((r) => ROLE_LEVEL[currentUser.role] < ROLE_LEVEL[r]);
  }

  const logoutUser = async (userId) => {
    const confirmed = confirm("You are about to logout this user!");
    if (!confirmed) return;

    const res = await fetch(`${BACKEND_URI}/user/logout/${userId}`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok)
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, isLoggedIn: false } : user,
        ),
      );
    else setError("Failed to logout user.");
  };

  // Soft delete (marks user as deleted, recoverable)
  const softDeleteUser = async (userId) => {
    const confirmed = confirm(
      "Soft-delete this user? Their account will be deactivated but can be recovered.",
    );
    if (!confirmed) return;

    const res = await fetch(`${BACKEND_URI}/user/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok)
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, isDeleted: true } : user,
        ),
      );
    else setError("Failed to delete user.");
  };

  // Hard delete (permanent, removes all data)
  const hardDeleteUser = async (userId) => {
    const confirmed = confirm(
      "⚠️ PERMANENTLY delete this user and ALL their data? This cannot be undone!",
    );
    if (!confirmed) return;

    const res = await fetch(`${BACKEND_URI}/user/${userId}?permanent=true`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok)
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user._id !== userId),
      );
    else setError("Failed to permanently delete user.");
  };

  const recoverUser = async (userId) => {
    const confirmed = confirm("Recover this user?");
    if (!confirmed) return;

    const res = await fetch(`${BACKEND_URI}/user/recover/${userId}`, {
      method: "PATCH",
      credentials: "include",
    });
    if (res.ok)
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, isDeleted: false } : user,
        ),
      );
    else setError("Failed to recover user.");
  };

  const changeRole = async (userId, newRole) => {
    const confirmed = confirm(`Change this user's role to ${newRole}?`);
    if (!confirmed) return;

    const res = await fetch(`${BACKEND_URI}/user/role/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok)
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user,
        ),
      );
    else setError("Failed to change role.");
  };

  const fetchUsers = async () => {
    const res = await fetch(`${BACKEND_URI}/user/all`, {
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) setUsers(data);
  };

  useEffect(() => {
    (async () => {
      const userRes = await fetch(`${BACKEND_URI}/user`, {
        credentials: "include",
      });
      const userData = await userRes.json();
      if (userRes.ok && userData.role !== "User") setCurrentUser(userData);
      else navigate("/");

      fetchUsers();
    })();
  }, []);

  const assignableRoles = getAssignableRoles();
  const isOwner = currentUser?.role === "Owner";
  const isAdminOrOwner =
    currentUser?.role === "Admin" || currentUser?.role === "Owner";

  return (
    <div className="users-container">
      <header className="users-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          <FaArrowLeft />
        </button>
        <div>
          <h1 className="title">All Users</h1>
          <p className="users-subtitle">
            {currentUser?.name} — {currentUser?.role}
          </p>
        </div>
      </header>

      {error && <div className="users-error">{error}</div>}

      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            {isAdminOrOwner && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            if (user.email === currentUser?.email) return null;

            const isDeleted = user.isDeleted;

            // Only Owner can see soft-deleted users
            if (isDeleted && !isOwner) return null;

            // Can the current user act on this user? (must be strictly below)
            const userIsUnderMe = canActOn(user.role);

            return (
              <tr
                key={user._id}
                className={isDeleted ? "deleted-row" : ""}
              >
                <td>
                  {user.name}
                  {isDeleted && (
                    <span className="deleted-badge">deleted</span>
                  )}
                </td>
                <td>{user.email}</td>
                <td>
                  {/* Only show role dropdown if the user is strictly below current user */}
                  {userIsUnderMe && !isDeleted ? (
                    <select
                      className="role-select"
                      value={user.role}
                      onChange={(e) => changeRole(user._id, e.target.value)}
                    >
                      {/* Show current role + assignable roles only */}
                      {ROLES.map((role) => (
                        <option
                          key={role}
                          value={role}
                          disabled={!assignableRoles.includes(role)}
                        >
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td>
                  <span
                    className={`status-badge ${user.isLoggedIn ? "logged-in" : "logged-out"}`}
                  >
                    {user.isLoggedIn ? "Online" : "Offline"}
                  </span>
                </td>
                {isAdminOrOwner && (
                  <td className="actions-cell">
                    {isDeleted ? (
                      /* Soft-deleted user: Owner can recover or permanently delete */
                      isOwner && (
                        <>
                          <button
                            className="recover-button"
                            onClick={() => recoverUser(user._id)}
                          >
                            Recover
                          </button>
                          <button
                            className="hard-delete-button"
                            onClick={() => hardDeleteUser(user._id)}
                          >
                            Delete Permanently
                          </button>
                        </>
                      )
                    ) : userIsUnderMe ? (
                      /* Active user under me: can logout, soft delete, or hard delete (Owner only) */
                      <>
                        <button
                          className="logout-button"
                          onClick={() => logoutUser(user._id)}
                          disabled={!user.isLoggedIn}
                        >
                          Logout
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => softDeleteUser(user._id)}
                        >
                          Delete
                        </button>
                        {isOwner && (
                          <button
                            className="hard-delete-button"
                            onClick={() => hardDeleteUser(user._id)}
                          >
                            Delete Permanently
                          </button>
                        )}
                      </>
                    ) : null}
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
