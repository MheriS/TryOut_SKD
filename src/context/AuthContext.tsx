import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAdmin: boolean;
  switchUser: (userId: string) => void;
  refreshUsers: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const userList = await api.getUsers();
      setUsers(userList);

      const savedId = localStorage.getItem('cat_user_id');
      const found = userList.find(u => u.id === savedId) || userList[0];
      setCurrentUser(found || null);
      if (found) {
        localStorage.setItem('cat_user_id', found.id);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('cat_user_id', user.id);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAdmin,
        switchUser,
        refreshUsers: loadUsers,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
