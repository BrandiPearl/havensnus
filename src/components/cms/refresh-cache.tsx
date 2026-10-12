"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { refreshSiteCache } from "@/app/(cms)/admin/actions";
import type { ActionState } from "@/lib/cms/form";
import { FormAlert } from "@/components/cms/form-alert";

export function RefreshCache() {
  const [state, action, pending] = useActionState<ActionState>(refreshSiteCache, null);

  return (
    <form action={action} className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Site cache</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Pages are cached so the site stays fast. Saving in the CMS refreshes the pages it affects. Use
          this after changing data outside the CMS, such as running the product import.
        </p>
      </div>
      <FormAlert state={state} />
      <button type="submit" className="btn-secondary px-4 py-2 text-sm" disabled={pending}>
        <RefreshCw className={pending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {pending ? "Refreshing…" : "Refresh site cache"}
      </button>
    </form>
  );
}
