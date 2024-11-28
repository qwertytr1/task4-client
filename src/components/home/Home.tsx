import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchUsersData from '../../utils/fetchUsers';
import { User } from '../../utils/interfaces';
import { useAuth } from '../AuthProvider/AuthProvider';
import './index.css';
import API_URL from '../../utils/links';

const Home: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [dataUser, setDataUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    setUserToken(token);
    if (userData) setDataUser(JSON.parse(userData));
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!userToken) return;

    try {
      const data = await fetchUsersData(userToken);
      const formattedData = data.map((user: User) => ({
        ...user,
        lastLogin: user.lastLogin
          ? new Date(user.lastLogin).toLocaleString()
          : 'Never',
      }));
      setUsers(formattedData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [userToken]);

  useEffect(() => {
    fetchUsers();
  }, [userToken, fetchUsers]);

  const handleLogout = useCallback(() => {
    logout();
    localStorage.removeItem('userData');
    navigate('/login');
  }, [logout, navigate]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((user) => user.id));
    }
    setSelectAll(!selectAll);
  };

  const handleCheckboxChange = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
    setSelectAll(selectedIds.length + 1 === users.length);
  };
  const handleAction = async (endpoint: string, updateStatus: "active" | "blocked") => {
    try {
      const response = await fetch(`${API_URL}/users/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) throw new Error(`Failed to ${endpoint} users.`);

      // Update status of affected users
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          selectedIds.includes(user.id) ? { ...user, status: updateStatus } : user
        )
      );
      setSelectedIds([]);
      setSelectAll(false);
    } catch (error) {
      console.error(`Error during ${endpoint}:`, error);
    }
  };

  const handleBlockUsers = () => handleAction('block', 'blocked');
  const handleUnblockUsers = () => handleAction('unblock', 'active');
  const handleDeleteUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) throw new Error('Failed to delete users.');

      // Filter out deleted users from the list
      setUsers((prevUsers) => prevUsers.filter((user) => !selectedIds.includes(user.id)));

      setSelectedIds([]);
      setSelectAll(false);

      if (selectedIds.includes(dataUser?.id || 0)) {
        handleLogout();
      }
    } catch (error) {
      console.error('Error during deletion:', error);
    }
  };

  return (
    <div className="container mt-4">
      <h1>User Table</h1>
      <button type="button" onClick={handleLogout} className="btn btn-secondary mb-3">
        Logout
      </button>
      <div className="toolbar mb-4">
        <button
          type="button"
          className="btn btn-primary me-3"
          onClick={handleBlockUsers}
          disabled={!selectedIds.length}
        >
          Block
        </button>
        <button
          type="button"
          className="btn btn-outline-primary me-3"
          onClick={handleUnblockUsers}
          disabled={!selectedIds.length}
        >
          Unblock
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDeleteUsers}
          disabled={!selectedIds.length}
        >
          Delete
        </button>
      </div>
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </th>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Last Login</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(user.id)}
                  onChange={() => handleCheckboxChange(user.id)}
                />
              </td>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.lastLogin}</td>
              <td>{user.status === 'active' ? 'Active' : 'Blocked'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Home;
