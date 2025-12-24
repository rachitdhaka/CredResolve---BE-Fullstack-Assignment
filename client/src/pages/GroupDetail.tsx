import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { User, Group, Expense, Balance } from "../types";
import { apiService } from "../services/api";
import AddExpenseModal from "../components/AddExpenseModal";
import RecordSettlementModal from "../components/RecordSettlementModal";
import AddMemberModal from "../components/AddMemberModal";

interface GroupDetailProps {
  currentUser: User | null;
}

export default function GroupDetail({ currentUser }: GroupDetailProps) {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [simplifiedBalances, setSimplifiedBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "expenses" | "balances" | "simplified"
  >("expenses");
  const [users, setUsers] = useState<Map<string, string>>(new Map()); // Map of userId -> userName

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      // Load all users first to build the mapping
      const allUsers = await apiService.getUsers();
      const userMap = new Map<string, string>();
      allUsers.forEach((u) => userMap.set(u.id, u.name));
      setUsers(userMap);

      const [
        fetchedGroup,
        fetchedExpenses,
        fetchedBalances,
        fetchedSimplified,
      ] = await Promise.all([
        apiService.getGroup(groupId!),
        apiService.getGroupExpenses(groupId!),
        apiService.getGroupBalances(groupId!),
        apiService.getSimplifiedBalances(groupId!),
      ]);

      setGroup(fetchedGroup);
      setExpenses(fetchedExpenses);
      setBalances(fetchedBalances);
      setSimplifiedBalances(fetchedSimplified);
    } catch (error) {
      console.error("Failed to load group data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-neutral-800 border-t-white"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Group Not Found
        </h2>
        <button
          onClick={() => navigate("/groups")}
          className="text-neutral-300 hover:text-white font-medium"
        >
          ← Back to Groups
        </button>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-12 text-center">
          <div className="w-16 h-16 rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-neutral-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-semibold text-white mb-4">
            Please Login
          </h2>
          <p className="text-neutral-400 mb-8 text-lg">
            You need to be logged in to view this group.
          </p>
        </div>
      </div>
    );
  }

  // Calculate current user's balance in this group
  const userBalance = currentUser
    ? balances.reduce((total, b) => {
        if (b.fromUserId === currentUser.id) {
          return total - b.amount; // User owes
        } else if (b.toUserId === currentUser.id) {
          return total + b.amount; // User is owed
        }
        return total;
      }, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-neutral-300"
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
            <div>
              <h1 className="text-3xl font-semibold text-white">
                {group.name}
              </h1>
              <p className="text-neutral-400 mt-1">{group.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-neutral-500">
                <span className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  {group.members.length} members
                </span>
                <span>
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/groups")}
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
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

        {/* Your Balance Card */}
        {currentUser && (
          <div className="rounded-md p-4 border border-neutral-800 bg-black">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-400">
                Your balance in this group:
              </span>
              <span className="text-2xl font-semibold text-white">
                ${Math.abs(userBalance).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {userBalance > 0
                ? "You are owed"
                : userBalance < 0
                ? "You owe"
                : "All settled up"}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 mt-4">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex-1 py-2.5 bg-white text-black rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => setShowSettlementModal(true)}
            className="flex-1 py-2.5 border border-neutral-800 text-neutral-200 rounded-md font-medium hover:bg-neutral-900 transition-colors flex items-center justify-center space-x-2"
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Settle Up</span>
          </button>
          <button
            onClick={() => setShowMemberModal(true)}
            className="px-3 py-2.5 border border-neutral-800 text-neutral-200 rounded-md hover:bg-neutral-900 transition-colors"
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg border border-neutral-800 overflow-hidden">
        <div className="border-b border-neutral-800 bg-neutral-900">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("expenses")}
              className={`flex-1 py-3 px-6 text-center text-sm font-medium border-b-2 transition-colors ${
                activeTab === "expenses"
                  ? "border-white text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
              }`}
            >
              Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab("balances")}
              className={`flex-1 py-3 px-6 text-center text-sm font-medium border-b-2 transition-colors ${
                activeTab === "balances"
                  ? "border-white text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
              }`}
            >
              All Balances
            </button>
            <button
              onClick={() => setActiveTab("simplified")}
              className={`flex-1 py-3 px-6 text-center text-sm font-medium border-b-2 transition-colors ${
                activeTab === "simplified"
                  ? "border-white text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
              }`}
            >
              Simplified
            </button>
          </nav>
        </div>

        <div className="p-6 bg-black">
          {/* Expenses Tab */}
          {activeTab === "expenses" && (
            <div className="space-y-3">
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-md p-4 border border-neutral-800 bg-neutral-900"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">
                          {expense.description}
                        </h3>
                        <div className="flex items-center space-x-3 mt-1 text-xs text-neutral-400">
                          <span>
                            Paid by{" "}
                            {users.get(expense.paidBy) || expense.paidBy}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(expense.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="px-2 py-0.5 border border-neutral-800 rounded text-[10px] text-neutral-300">
                            {expense.splitType}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-white">
                          ${expense.totalAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-neutral-400">
                    No expenses yet. Add your first expense!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Balances Tab */}
          {activeTab === "balances" && (
            <div className="space-y-3">
              {/* Detailed who owes whom */}
              {balances.length > 0 && (
                <div className="rounded-md p-4 border border-neutral-800 bg-neutral-900">
                  <h4 className="text-sm font-medium text-white mb-3">
                    Who pays whom
                  </h4>
                  <div className="space-y-2">
                    {balances
                      .filter((b) => Math.abs(b.amount) > 0.01)
                      .sort((a, b) => b.amount - a.amount)
                      .map((b) => (
                        <div
                          key={`${b.fromUserId}-${b.toUserId}`}
                          className="flex justify-between text-sm text-neutral-300"
                        >
                          <span>
                            <strong className="text-white">
                              {users.get(b.fromUserId) || b.fromUserId}
                            </strong>{" "}
                            pays{" "}
                            <strong className="text-white">
                              {users.get(b.toUserId) || b.toUserId}
                            </strong>
                          </span>
                          <span className="font-semibold text-white">
                            ${b.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {balances.length > 0 ? (
                (() => {
                  // Aggregate balances by user
                  const userBalances = new Map<string, number>();
                  balances.forEach((b) => {
                    const currentFrom = userBalances.get(b.fromUserId) || 0;
                    const currentTo = userBalances.get(b.toUserId) || 0;
                    userBalances.set(b.fromUserId, currentFrom - b.amount);
                    userBalances.set(b.toUserId, currentTo + b.amount);
                  });

                  const sortedBalances = Array.from(userBalances.entries())
                    .filter(([_, balance]) => Math.abs(balance) > 0.01)
                    .sort(([_, a], [__, b]) => b - a);

                  return sortedBalances.length > 0 ? (
                    sortedBalances.map(([userId, balance]) => (
                      <div
                        key={userId}
                        className="rounded-md p-4 border border-neutral-800 bg-neutral-900"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">
                            {users.get(userId) || userId}
                          </span>
                          <span className="text-lg font-semibold text-white">
                            {balance > 0 ? "+" : ""}${balance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-6 h-6 text-neutral-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-neutral-400">All settled up! 🎉</p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-neutral-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-neutral-400">All settled up! 🎉</p>
                </div>
              )}
            </div>
          )}

          {/* Simplified Balances Tab */}
          {activeTab === "simplified" && (
            <div className="space-y-3">
              {/* Detailed simplified settlements */}
              {simplifiedBalances.length > 0 && (
                <div className="rounded-md p-4 border border-neutral-800 bg-neutral-900">
                  <h4 className="text-sm font-medium text-white mb-3">
                    Minimum payments to settle
                  </h4>
                  <div className="space-y-2">
                    {simplifiedBalances
                      .filter((b) => Math.abs(b.amount) > 0.01)
                      .sort((a, b) => b.amount - a.amount)
                      .map((b) => (
                        <div
                          key={`${b.fromUserId}-${b.toUserId}`}
                          className="flex justify-between text-sm text-neutral-300"
                        >
                          <span>
                            <strong className="text-white">
                              {users.get(b.fromUserId) || b.fromUserId}
                            </strong>{" "}
                            pays{" "}
                            <strong className="text-white">
                              {users.get(b.toUserId) || b.toUserId}
                            </strong>
                          </span>
                          <span className="font-semibold text-white">
                            ${b.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {simplifiedBalances.length > 0 ? (
                (() => {
                  // Aggregate simplified balances by user
                  const userBalances = new Map<string, number>();
                  simplifiedBalances.forEach((b) => {
                    const currentFrom = userBalances.get(b.fromUserId) || 0;
                    const currentTo = userBalances.get(b.toUserId) || 0;
                    userBalances.set(b.fromUserId, currentFrom - b.amount);
                    userBalances.set(b.toUserId, currentTo + b.amount);
                  });

                  const sortedBalances = Array.from(userBalances.entries())
                    .filter(([_, balance]) => Math.abs(balance) > 0.01)
                    .sort(([_, a], [__, b]) => b - a);

                  return sortedBalances.length > 0 ? (
                    <>
                      {sortedBalances.map(([userId, balance]) => (
                        <div
                          key={userId}
                          className="rounded-md p-4 border border-neutral-800 bg-neutral-900"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white">
                              {users.get(userId) || userId}
                            </span>
                            <span className="text-lg font-semibold text-white">
                              {balance > 0 ? "+" : ""}${balance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-6 h-6 text-neutral-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-neutral-400">All settled up! 🎉</p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-neutral-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-neutral-400">All settled up! 🎉</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showExpenseModal && currentUser && (
        <AddExpenseModal
          group={group}
          currentUser={currentUser}
          onClose={() => setShowExpenseModal(false)}
          onExpenseAdded={() => {
            loadGroupData();
            setShowExpenseModal(false);
          }}
        />
      )}

      {showSettlementModal && currentUser && (
        <RecordSettlementModal
          group={group}
          currentUser={currentUser}
          onClose={() => setShowSettlementModal(false)}
          onSettlementRecorded={() => {
            loadGroupData();
            setShowSettlementModal(false);
          }}
        />
      )}

      {showMemberModal && (
        <AddMemberModal
          group={group}
          onClose={() => setShowMemberModal(false)}
          onMemberAdded={() => {
            loadGroupData();
            setShowMemberModal(false);
          }}
        />
      )}
    </div>
  );
}
