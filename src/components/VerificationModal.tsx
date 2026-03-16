import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Copy, Check } from "lucide-react";
import type { User } from "@/types/user";
import { startVerification, confirmVerification } from "@/api/auth";

type Step = "start" | "code" | "confirm";

interface VerificationModalProps {
  open: boolean;
  user: User;
  onClose: () => void;
  onVerified: () => void;
}

const RSI_HANDLE_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;

export default function VerificationModal({
  open,
  user,
  onClose,
  onVerified,
}: VerificationModalProps) {
  const [step, setStep] = useState<Step>("start");
  const [rsiHandle, setRsiHandle] = useState(user.rsi_handle ?? "");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleValid = RSI_HANDLE_PATTERN.test(rsiHandle);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const result = await startVerification(user._id, rsiHandle);
      if (result.verification_code) {
        setVerificationCode(result.verification_code);
        setStep("code");
      } else {
        setError(result.message);
      }
    } catch {
      setError("Failed to start verification");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await confirmVerification(user._id);
      if (result.verified) {
        setSuccess(result.message);
        setStep("confirm");
        onVerified();
      } else {
        setError(result.message);
        setStep("confirm");
      }
    } catch {
      setError("Failed to confirm verification");
      setStep("confirm");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    const text = `Hexadian account validation code: ${verificationCode}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setStep("start");
    setError(null);
    setSuccess(null);
    setVerificationCode("");
    setCopied(false);
    setLoading(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-dialog-title"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="verification-dialog-title"
          className="text-lg font-semibold mb-4"
        >
          RSI Verification — {user.username}
        </h2>

        {/* Step 1: Start */}
        {step === "start" && (
          <div>
            <label
              htmlFor="rsi-handle"
              className="block text-sm font-medium mb-1"
            >
              RSI Handle
            </label>
            <input
              id="rsi-handle"
              type="text"
              value={rsiHandle}
              onChange={(e) => setRsiHandle(e.target.value)}
              placeholder="Your RSI handle (3-30 chars)"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            {rsiHandle.length > 0 && !handleValid && (
              <p className="text-xs text-[var(--color-danger)] mt-1">
                Handle must be 3-30 characters, alphanumeric, dash or
                underscore.
              </p>
            )}
            {error && (
              <div className="flex items-center gap-2 mt-3 text-sm text-[var(--color-danger)]">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleStart}
                disabled={!handleValid || loading}
              >
                {loading ? "Generating…" : "Generate Code"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Code Display */}
        {step === "code" && (
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">
              Paste this string in your RSI profile bio at{" "}
              <span className="text-[var(--color-accent)]">
                robertsspaceindustries.com/account/profile
              </span>
            </p>
            <div className="relative rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
              <code className="text-sm break-all" data-testid="verification-string">
                Hexadian account validation code: {verificationCode}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1 rounded hover:bg-[var(--color-border)]/50 transition-colors"
                aria-label="Copy verification string"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-[var(--color-success)]" />
                ) : (
                  <Copy className="h-4 w-4 text-[var(--color-text-muted)]" />
                )}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-3 text-sm text-[var(--color-danger)]">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading ? "Verifying…" : "Verify"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm result */}
        {step === "confirm" && (
          <div>
            {success && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-success)] mb-4">
                <CheckCircle className="h-4 w-4" />
                {success}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-danger)] mb-4">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
