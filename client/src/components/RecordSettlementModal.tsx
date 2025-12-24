import { useState, useEffect } from "react";
import type { User, Group } from "../types";
import { apiService } from "../services/api";

interface RecordSettlementModalProps {
  group: Group;
  currentUser: User;
  onClose: () => void;
  onSettlementRecorded: () => void;
}

export default function RecordSettlementModal({
  group,
  currentUser,
  onClose,
  onSettlementRecorded,
}: RecordSettlementModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [from, setFrom] = useState(currentUser.id);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await apiService.getUsers();
      const groupUsers = allUsers.filter(
        (u) => group.members.includes(u.id) && u.id !== currentUser.id
      );
      setUsers(groupUsers);
      if (groupUsers.length > 0) {
        setTo(groupUsers[0].id);
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
      await apiService.recordSettlement({
        groupId: group.id,
        fromUserId: from,
        toUserId: to,
        amount: parseFloat(amount),
      });
      onSettlementRecorded();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record settlement"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">
            Record Settlement
          </h2>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-md border border-neutral-800 bg-black p-4">
            <div className="flex items-start space-x-2">
              <svg
                className="w-5 h-5 text-neutral-300 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-neutral-400">
                Record a payment to settle up balances. This doesn't create a
                new expense, just tracks a payment.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              From (Payer)
            </label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-neutral-700"
            >
              <option value={currentUser.id} className="bg-neutral-900">
                {currentUser.name} (You)
              </option>
              {users.map((user) => (
                <option
                  key={user.id}
                  value={user.id}
                  className="bg-neutral-900"
                >
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              To (Recipient)
            </label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-neutral-700"
            >
              {users.map((user) => (
                <option
                  key={user.id}
                  value={user.id}
                  className="bg-neutral-900"
                >
                  {user.name}
                </option>
              ))}
              <option value={currentUser.id} className="bg-neutral-900">
                {currentUser.name} (You)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-md bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-neutral-700"
              placeholder="0.00"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-md text-sm border border-neutral-800 bg-black text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !to}
            className="w-full py-2.5 rounded-md bg-white text-black font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Recording..." : "Record Settlement"}
          </button>
        </form>
      </div>
    </div>
  );
}
