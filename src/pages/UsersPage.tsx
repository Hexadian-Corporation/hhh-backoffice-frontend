import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Shield } from "lucide-react";
import type { User } from "@/types/user";
import { getUsers } from "@/api/auth";
import { Button } from "@/components/ui/button";
import VerificationModal from "@/components/VerificationModal";
import { useAuth } from "@hexadian-corporation/auth-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { hasPermission } = useAuth();
  const canAdmin = hasPermission("auth:users:admin");

  useEffect(() => {
    let cancelled = false;

    getUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  function handleVerified() {
    setRetryCount((c) => c + 1);
    setLoading(true);
    setError(null);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-40 rounded bg-[var(--color-surface)] animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 rounded border border-[var(--color-border)] bg-[var(--color-surface)] animate-pulse"
              data-testid="skeleton-row"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-danger)]">{error}</p>
        <Button
          className="mt-4"
          onClick={() => {
            setLoading(true);
            setError(null);
            setRetryCount((c) => c + 1);
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-md bg-[var(--color-danger)]/10 px-4 py-2 text-sm text-[var(--color-danger)] border border-[var(--color-danger)]/20">
          {error}
        </div>
      )}

      {/* Users table */}
      {users.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-8">
          No users found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <th className="text-left px-4 py-3 font-semibold uppercase text-[var(--color-text-muted)]">Username</th>
                <th className="text-left px-4 py-3 font-semibold uppercase text-[var(--color-text-muted)]">Email</th>
                <th className="text-left px-4 py-3 font-semibold uppercase text-[var(--color-text-muted)]">RSI Handle</th>
                <th className="text-left px-4 py-3 font-semibold uppercase text-[var(--color-text-muted)]">Verified</th>
                <th className="text-left px-4 py-3 font-semibold uppercase text-[var(--color-text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-alt)]"
                >
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    {user.rsi_handle ?? (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.rsi_verified ? (
                      <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[var(--color-danger)]">
                        <XCircle className="h-4 w-4" />
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      {user.rsi_verified ? "Re-verify" : "Verify"}
                    </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Verification Modal */}
      {selectedUser && (
        <VerificationModal
          open={selectedUser !== null}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onVerified={handleVerified}
        />
      )}
    </div>
  );
}
