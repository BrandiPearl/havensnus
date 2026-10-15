"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { sendTestEmail } from "@/app/(cms)/admin/actions";
import type { ActionState } from "@/lib/cms/form";
import { FormAlert } from "@/components/cms/form-alert";

export function TestEmail() {
  const [state, action, pending] = useActionState<ActionState>(sendTestEmail, null);

  return (
    <form action={action} className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Email</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Sends a test email to the admin inbox using the live mail settings, and shows the exact error if it fails.
        </p>
      </div>
      <FormAlert state={state} />
      <button type="submit" className="btn-secondary px-4 py-2 text-sm" disabled={pending}>
        <Mail className="h-4 w-4" />
        {pending ? "Sending…" : "Send test email"}
      </button>
    </form>
  );
}
