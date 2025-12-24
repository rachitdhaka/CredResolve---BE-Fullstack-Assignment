import { useState, useEffect } from "react";
import type { User, Group } from "../types";
import { apiService } from "../services/api";

interface AddExpenseModalProps {
  group: Group;
  currentUser: User;
  onClose: () => void;
  onExpenseAdded: () => void;
}

export default function AddExpenseModal({
  group,
  currentUser,
  onClose,
  onExpenseAdded,
}: AddExpenseModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUser.id);
  const [splitType, setSplitType] = useState<"EQUAL" | "EXACT" | "PERCENTAGE">(
    "EQUAL"
  );
  const [splits, setSplits] = useState<
    { userId: string; amount?: number; percentage?: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await apiService.getUsers();
      const groupUsers = allUsers.filter((u) => group.members.includes(u.id));
      setUsers(groupUsers);

      // Initialize splits for all members
      setSplits(groupUsers.map((u) => ({ userId: u.id })));
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const expenseData: any = {
        groupId: group.id,
        description,
        totalAmount: parseFloat(amount),
        paidBy,
        splitType,
        splits: [],
      };

      if (splitType === "EQUAL") {
        // For equal split, include all group members
        expenseData.splits = users.map((u) => ({ userId: u.id }));
      } else if (splitType === "EXACT") {
        expenseData.splits = splits
          .filter((s) => s.amount && s.amount > 0)
          .map((s) => ({ userId: s.userId, amount: s.amount! }));
      } else if (splitType === "PERCENTAGE") {
        expenseData.splits = splits
          .filter((s) => s.percentage && s.percentage > 0)
          .map((s) => ({ userId: s.userId, percentage: s.percentage! }));
      }

      await apiService.addExpense(expenseData);
      onExpenseAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const updateSplit = (
    userId: string,
    field: "amount" | "percentage",
    value: string
  ) => {
    setSplits(
      splits.map((s) =>
        s.userId === userId
          ? { ...s, [field]: value ? parseFloat(value) : undefined }
          : s
      )
    );
  };

  const totalSplitAmount = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalSplitPercentage = splits.reduce(
    (sum, s) => sum + (s.percentage || 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-white">Add Expense</h2>
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
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-md bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-neutral-700"
              placeholder="e.g., Dinner at restaurant"
            />
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

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Paid by
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
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
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Split Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["EQUAL", "EXACT", "PERCENTAGE"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`py-2.5 px-3 rounded-md text-sm font-medium transition-colors ${
                    splitType === type
                      ? "bg-white text-black"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Split Details for EXACT */}
          {splitType === "EXACT" && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                Exact Amounts
              </label>
              <div className="space-y-2 rounded-md border border-neutral-800 bg-black p-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-neutral-300">
                      {user.name}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      onChange={(e) =>
                        updateSplit(user.id, "amount", e.target.value)
                      }
                      className="w-32 px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-neutral-700"
                    />
                  </div>
                ))}
                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">Total:</span>
                  <span className="font-semibold text-white">
                    ${totalSplitAmount.toFixed(2)} / $
                    {parseFloat(amount || "0").toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Split Details for PERCENTAGE */}
          {splitType === "PERCENTAGE" && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                Percentage Split
              </label>
              <div className="space-y-2 rounded-md border border-neutral-800 bg-black p-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-neutral-300">
                      {user.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        onChange={(e) =>
                          updateSplit(user.id, "percentage", e.target.value)
                        }
                        className="w-24 px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-neutral-700"
                      />
                      <span className="text-sm text-neutral-400">%</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">Total:</span>
                  <span className="font-semibold text-white">
                    {totalSplitPercentage.toFixed(2)}% / 100%
                  </span>
                </div>
              </div>
            </div>
          )}

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
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
