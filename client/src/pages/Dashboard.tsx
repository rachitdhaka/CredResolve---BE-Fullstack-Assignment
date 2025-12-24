import { useEffect, useState } from "react";
import type { User, UserBalance } from "../types";
import { apiService } from "../services/api";

interface DashboardProps {
  currentUser: User | null;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [balances, setBalances] = useState<UserBalance | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      const [userBalances, allUsers] = await Promise.all([
        apiService.getUserBalances(currentUser.id),
        apiService.getUsers(),
      ]);
      setBalances(userBalances);
      setUsers(allUsers);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || "Unknown";
  };

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
            Welcome to SplitWise!
          </h2>
          <p className="text-neutral-400 mb-8 text-lg">
            Create an account to start tracking and splitting expenses with
            friends.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-neutral-800 border-t-white"></div>
      </div>
    );
  }

  const totalOwes = balances?.owes.reduce((sum, b) => sum + b.amount, 0) || 0;
  const totalOwed = balances?.owed.reduce((sum, b) => sum + b.amount, 0) || 0;
  const netBalance = balances?.netBalance || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h1 className="text-2xl font-semibold text-white">
          Welcome back, {currentUser.name}! 👋
        </h1>
        <p className="text-neutral-400 mt-1">Here's your expense overview</p>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* You Owe */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-400">
              You Owe
            </span>
            <svg
              className="w-5 h-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 11l5-5m0 0l5 5m-5-5v12"
              />
            </svg>
          </div>
          <p className="text-3xl font-semibold text-white">
            ${totalOwes.toFixed(2)}
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            {balances?.owes.length || 0} people
          </p>
        </div>

        {/* You Are Owed */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-400">
              You're Owed
            </span>
            <svg
              className="w-5 h-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 13l-5 5m0 0l-5-5m5 5V6"
              />
            </svg>
          </div>
          <p className="text-3xl font-semibold text-white">
            ${totalOwed.toFixed(2)}
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            {balances?.owed.length || 0} people
          </p>
        </div>

        {/* Net Balance */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-400">
              Net Balance
            </span>
            <svg
              className="w-5 h-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-3xl font-semibold text-white">
            ${Math.abs(netBalance).toFixed(2)}
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            {netBalance > 0
              ? "You are owed"
              : netBalance < 0
              ? "You owe"
              : "All settled up!"}
          </p>
        </div>
      </div>

      {/* Detailed Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* You Owe List */}
        <div className="rounded-lg border border-neutral-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-900">
            <h3 className="text-base font-medium text-white">You Owe</h3>
          </div>
          <div className="p-6 bg-black">
            {balances && balances.owes.length > 0 ? (
              <div className="space-y-3">
                {balances.owes.map((balance, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-md border border-neutral-800 bg-neutral-900"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {getUserName(balance.toUserId)}
                      </p>
                      <p className="text-sm text-neutral-400">You owe</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-white">
                        ${balance.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-neutral-400">You don't owe anyone!</p>
              </div>
            )}
          </div>
        </div>

        {/* You Are Owed List */}
        <div className="rounded-lg border border-neutral-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-900">
            <h3 className="text-base font-medium text-white">You're Owed</h3>
          </div>
          <div className="p-6 bg-black">
            {balances && balances.owed.length > 0 ? (
              <div className="space-y-3">
                {balances.owed.map((balance, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-md border border-neutral-800 bg-neutral-900"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {getUserName(balance.fromUserId)}
                      </p>
                      <p className="text-sm text-neutral-400">Owes you</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-white">
                        ${balance.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-neutral-400">Nobody owes you!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
