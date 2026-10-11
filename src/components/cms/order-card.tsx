"use client";

import { useActionState } from "react";
import { updateOrder } from "@/app/(cms)/admin/actions";
import { ORDER_STATUSES, ORDER_STATUS_COLORS } from "@/lib/cms/constants";
import type { ActionState } from "@/lib/cms/form";
import type { AdminOrder } from "@/lib/queries/cms";
import { FormAlert } from "@/components/cms/form-alert";
import { formatAud } from "@/lib/utils";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderCard({ order }: { order: AdminOrder }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateOrder, null);
  const address = [order.address_line1, order.address_line2, order.suburb, order.state, order.postcode, order.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-slate-900">{order.reference}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ORDER_STATUS_COLORS[order.status] ?? ""}`}>
              {order.status}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              {order.country}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">{formatDate(order.created_at)}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-lg font-bold text-slate-900">{formatAud(order.total)}</div>
          <div className="text-xs text-slate-400">
            {order.item_count} cans · shipping {order.shipping === 0 ? "free" : formatAud(order.shipping)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
        <div>
          <div className="font-semibold text-slate-900">
            {order.first_name} {order.last_name}
          </div>
          <a href={`mailto:${order.email}`} className="block text-xs text-orange-700 hover:underline">
            {order.email}
          </a>
          <div className="text-xs text-slate-500">{order.phone}</div>
          <div className="mt-2 text-xs leading-relaxed text-slate-600">{address}</div>
        </div>
        <ul className="space-y-1 text-xs text-slate-600">
          {order.items.map((item) => (
            <li key={item.sku} className="flex justify-between gap-3">
              <span>
                {item.qty} × {item.name}
              </span>
              <span className="shrink-0 font-medium text-slate-900">{formatAud(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
      </div>

      {order.notes ? (
        <p className="mt-4 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold">Customer note:</span> {order.notes}
        </p>
      ) : null}

      <form action={action} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
        <input type="hidden" name="id" value={order.id} />
        <FormAlert state={state} />
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <select name="status" defaultValue={order.status} className="input py-2 text-sm capitalize">
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            name="tracking_number"
            defaultValue={order.tracking_number}
            placeholder="Tracking number"
            className="input py-2 font-mono text-sm"
          />
        </div>
        <textarea
          name="internal_notes"
          defaultValue={order.internal_notes}
          rows={2}
          placeholder="Internal notes (not shown to the customer)"
          className="input text-sm"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" name="notify" defaultChecked className="h-3.5 w-3.5 accent-orange-600" />
            Email the customer when the status changes
          </label>
          <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
