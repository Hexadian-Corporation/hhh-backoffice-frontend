import { Link } from "react-router";
import { ShieldX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function InsufficientPermissionsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <ShieldX className="h-16 w-16 text-[var(--color-danger)] mb-4" />
      <h1 className="text-2xl font-bold mb-2">Insufficient Permissions</h1>
      <p className="text-[var(--color-text-muted)] mb-6 max-w-md">
        You do not have the required permissions to access this page. Contact an
        administrator if you believe this is an error.
      </p>
      <Link to="/" className={buttonVariants({ variant: "outline" })}>
        Back to Dashboard
      </Link>
    </div>
  );
}
