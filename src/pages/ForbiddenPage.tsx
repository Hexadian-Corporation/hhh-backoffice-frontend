import { clearTokens, redirectToLogin } from "@/lib/auth";

export default function ForbiddenPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[var(--color-bg)] text-center">
      <h1 className="text-6xl font-bold text-[var(--color-text)]">403</h1>
      <p className="mt-4 text-lg text-[var(--color-text-muted)]">
        You don&apos;t have permission to access this application.
      </p>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]" style={{ opacity: 0.6 }}>
        Contact an administrator to request access.
      </p>
      <button
        onClick={() => {
          clearTokens();
          redirectToLogin();
        }}
        className="mt-8 rounded-md px-6 py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
          fontFamily: "var(--font-body)",
        }}
      >
        Log out
      </button>
    </div>
  );
}
