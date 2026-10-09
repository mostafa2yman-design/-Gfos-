import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppUser, PermissionKey } from '../types';
import {
  getStoredUsers,
  getActiveSessionUser,
  setActiveSessionUser,
  createStoredUser,
  updateStoredUser,
  deleteStoredUser,
  resetUsersToDefaults,
  hasUserPermission
} from '../lib/usersStorage';

interface AuthContextType {
  currentUser: AppUser;
  users: AppUser[];
  switchUser: (userId: string) => void;
  login: (username: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  hasPermission: (permission: PermissionKey) => boolean;
  canAccess: (permission: PermissionKey) => boolean;
  refreshUsers: () => void;
  addUser: (data: Omit<AppUser, 'id' | 'createdAt'>) => AppUser;
  editUser: (userId: string, data: Partial<AppUser>) => AppUser;
  removeUser: (userId: string) => void;
  resetDefaults: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Requirement: Default user is Admin!
  const [currentUser, setCurrentUser] = useState<AppUser>(() => getActiveSessionUser());
  const [users, setUsers] = useState<AppUser[]>(() => getStoredUsers());

  const refreshUsers = () => {
    const list = getStoredUsers();
    setUsers(list);
    const active = getActiveSessionUser();
    setCurrentUser(active);
  };

  useEffect(() => {
    const handleAuthChanged = () => {
      const active = getActiveSessionUser();
      setCurrentUser(active);
    };

    const handleUsersUpdated = () => {
      setUsers(getStoredUsers());
      const active = getActiveSessionUser();
      setCurrentUser(active);
    };

    window.addEventListener('auth_changed', handleAuthChanged);
    window.addEventListener('users_updated', handleUsersUpdated);
    window.addEventListener('storage', handleUsersUpdated);

    return () => {
      window.removeEventListener('auth_changed', handleAuthChanged);
      window.removeEventListener('users_updated', handleUsersUpdated);
      window.removeEventListener('storage', handleUsersUpdated);
    };
  }, []);

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (!target.isActive) {
      alert('هذا الحساب معطل حالياً');
      return;
    }
    // Update lastLogin
    updateStoredUser(target.id, { lastLogin: new Date().toISOString() });
    setActiveSessionUser(target);
    setCurrentUser(target);
  };

  const login = (username: string, password?: string): { success: boolean; message?: string } => {
    const target = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!target) {
      return { success: false, message: 'اسم المستخدم غير موجود' };
    }
    if (!target.isActive) {
      return { success: false, message: 'هذا الحساب معطل، يرجى مراجعة إدارة النظام' };
    }
    if (password && target.password && target.password !== password.trim()) {
      return { success: false, message: 'كلمة المرور غير صحيحة' };
    }

    updateStoredUser(target.id, { lastLogin: new Date().toISOString() });
    setActiveSessionUser(target);
    setCurrentUser(target);
    return { success: true };
  };

  const logout = () => {
    // Switch to admin or first active user
    const admin = users.find(u => u.role === 'admin' || u.username === 'admin') || users[0];
    setActiveSessionUser(admin);
    setCurrentUser(admin);
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    return hasUserPermission(currentUser, permission);
  };

  const canAccess = (permission: PermissionKey): boolean => {
    return hasPermission(permission);
  };

  const addUser = (data: Omit<AppUser, 'id' | 'createdAt'>): AppUser => {
    const created = createStoredUser(data);
    refreshUsers();
    return created;
  };

  const editUser = (userId: string, data: Partial<AppUser>): AppUser => {
    const updated = updateStoredUser(userId, data);
    refreshUsers();
    return updated;
  };

  const removeUser = (userId: string) => {
    deleteStoredUser(userId);
    refreshUsers();
  };

  const resetDefaults = () => {
    const list = resetUsersToDefaults();
    setUsers(list);
    setCurrentUser(list[0]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        switchUser,
        login,
        logout,
        hasPermission,
        canAccess,
        refreshUsers,
        addUser,
        editUser,
        removeUser,
        resetDefaults
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
