import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { User } from "../types";
import CreateUserModal from "./CreateUserModal";

interface LayoutProps {
  children: ReactNode;
  currentUser: User | null;
  onUserCreated: (user: User) => void;
  onLogout: () => void;
}

export default function Layout({
  children,
  currentUser,
  onUserCreated,
  onLogout,
}: LayoutProps) {
  const location = useLocation();
  const [showUserModal, setShowUserModal] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-neutral-200 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-neutral-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-white">SplitWise</h1>
                <p className="text-xs text-neutral-400">
                  Share expenses effortlessly
                </p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
                  isActive("/")
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="hidden md:inline">Dashboard</span>
              </Link>
              <Link
                to="/groups"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
                  isActive("/groups")
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="hidden md:inline">Groups</span>
              </Link>
            </nav>

            {/* User Section */}
            <div className="flex items-center space-x-3">
              {currentUser && currentUser.name ? (
                <>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {currentUser.email}
                    </p>
                  </div>
                  <div className="w-9 h-9 bg-neutral-800 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={onLogout}
                    className="px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white border border-neutral-800 hover:bg-neutral-800 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowUserModal(true)}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-white text-black hover:opacity-90 transition-opacity flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="hidden sm:inline">Login / Sign Up</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-6 mt-auto bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <p className="flex items-center space-x-2">
              <span>Made with</span>
              <svg
                className="w-4 h-4 text-neutral-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              <span>for splitting bills</span>
            </p>
            <p className="text-neutral-500">© 2025 SplitWise</p>
          </div>
        </div>
      </footer>

      {/* Create User Modal */}
      {showUserModal && (
        <CreateUserModal
          onClose={() => setShowUserModal(false)}
          onUserCreated={(user) => {
            onUserCreated(user);
            setShowUserModal(false);
          }}
        />
      )}
    </div>
  );
}
