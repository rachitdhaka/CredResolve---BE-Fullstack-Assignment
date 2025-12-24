import { useState, useEffect } from "react";
import type { User, Group } from "../types";
import { apiService } from "../services/api";

interface AddMemberModalProps {
  group: Group;
  onClose: () => void;
  onMemberAdded: () => void;
}

export default function AddMemberModal({
  group,
  onClose,
  onMemberAdded,
}: AddMemberModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await apiService.getUsers();
      const availableUsers = allUsers.filter(
        (u) => !group.members.includes(u.id)
      );
      setUsers(availableUsers);
      if (availableUsers.length > 0) {
        setSelectedUserId(availableUsers[0].id);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiService.addMemberToGroup(group.id, selectedUserId);
      onMemberAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Add Member</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {users.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-neutral-700"
              >
                {users.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                    className="bg-neutral-900"
                  >
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-md text-sm border border-neutral-800 bg-black text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-white text-black font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Member"}
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-neutral-400"
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
            </div>
            <p className="text-neutral-400 mb-4">
              All users are already in this group!
            </p>
            <button
              onClick={onClose}
              className="text-white hover:opacity-80 font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
