import { ChangePasswordForm } from "@/components/change-password-form";
import { DeleteAccountForm } from "@/components/delete-account-form";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account security and deletion
        </p>
      </div>
      <ChangePasswordForm />
      <DeleteAccountForm />
    </div>
  );
}
