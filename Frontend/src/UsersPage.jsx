import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UsersPage.css";

export default function UsersPage() {
  const BACKEND_URI = import.meta.env.VITE_BACKEND_URI;
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  const logoutUser = async (userId) => {
    const confirmed = confirm(`You are about to logout this user!`);
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
  };

  const deleteUser = async (userId) => {
    const confirmed = confirm(`You are about to delete this user!`);
    if (!confirmed) return;

    const res = await fetch(`${BACKEND_URI}/user/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok)
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
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
      console.log(userData);
      if (userRes.ok && userData.role !== "User") setCurrentUser(userData);
      else navigate("/");

      fetchUsers();
    })();
  }, []);

  return (
    <div className="users-container">
      <h1 className="title">All Users</h1>
      <h2>
        {currentUser?.name}: {currentUser?.role}
      </h2>
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            {currentUser?.role === "Admin" && (
              <>
                <th></th>
                <th></th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            return user.email === currentUser.email ? null : (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.isLoggedIn ? "Logged In" : "Logged Out"}</td>
                {currentUser?.role === "Admin" && (
                  <>
                    <td>
                      <button
                        className="logout-button"
                        onClick={() => logoutUser(user._id)}
                        disabled={!user.isLoggedIn}
                      >
                        Logout
                      </button>
                    </td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => deleteUser(user._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
