"use client";

import { updateContactStatus } from "@/app/(cms)/admin/actions";
import { CONTACT_STATUSES } from "@/lib/cms/constants";
import type { ContactListItem } from "@/lib/queries/cms";

const CONTACT_COLORS: Record<string, string> = {
  new: "bg-amber-50 text-amber-700",
  read: "bg-blue-50 text-blue-700",
  replied: "bg-emerald-50 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function ContactCard({ message }: { message: ContactListItem }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-slate-900">{message.name}</div>
          <div className="mt-0.5 text-xs text-slate-400">
            {message.email}
            {message.phone ? ` · ${message.phone}` : ""}
          </div>
        </div>
        <span className="flex-shrink-0 text-xs text-slate-400">{formatDate(message.created_at)}</span>
      </div>
      {message.subject ? <div className="mb-2 text-sm font-medium text-slate-700">{message.subject}</div> : null}
      <p className="whitespace-pre-line border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">{message.message}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a href={`mailto:${message.email}`} className="btn-secondary px-3 py-1.5 text-xs">
          Reply by email
        </a>
        <form action={updateContactStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={message.id} />
          <select
            name="status"
            defaultValue={message.status}
            className={`input w-auto py-1.5 text-xs ${CONTACT_COLORS[message.status] ?? ""}`}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            aria-label="Message status"
          >
            {CONTACT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </form>
      </div>
    </div>
  );
}
