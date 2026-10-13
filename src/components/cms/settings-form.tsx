"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/(cms)/admin/actions";
import type { ActionState } from "@/lib/cms/form";
import type { SiteSettings } from "@/lib/queries/settings";
import { FormAlert } from "@/components/cms/form-alert";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSettings, null);

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <FormAlert state={state} />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-5">Business Information</h2>
        <div className="space-y-4">
          <Field name="business_name" label="Business Name" defaultValue={settings.business_name} />
          <Field name="phone" label="Phone Number" defaultValue={settings.phone} type="tel" />
          <Field name="email" label="Email Address" defaultValue={settings.email} type="email" />
          <Field name="address" label="Address" defaultValue={settings.address} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Shipping</h2>
        <p className="text-xs text-slate-500 mb-5">Flat rates in AUD. Set the threshold to 0 to turn free shipping off.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="shipping_au" label="Flat rate" defaultValue={String(settings.shipping_au)} type="number" step="0.01" />
          <Field
            name="free_shipping_threshold"
            label="Free shipping from"
            defaultValue={String(settings.free_shipping_threshold)}
            type="number"
            step="0.01"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-5">SEO Defaults</h2>
        <div className="space-y-4">
          <Field name="seo_title" label="Default Meta Title" defaultValue={settings.seo_title} />
          <div>
            <label className="label">Default Meta Description</label>
            <textarea name="seo_description" className="input resize-none" rows={3} defaultValue={settings.seo_description} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-5">Announcement Bar</h2>
        <div className="space-y-4">
          <Field name="announcement" label="Announcement Text" defaultValue={settings.announcement} />
          <Field name="announcement_link_text" label="Announcement Link Text" defaultValue={settings.announcement_link_text} />
          <Field name="announcement_link_url" label="Announcement Link URL" defaultValue={settings.announcement_link_url} />
        </div>
      </div>

      <button type="submit" className="btn-primary text-sm py-2 px-4" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  step,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} type={type} step={step} min={type === "number" ? "0" : undefined} className="input" defaultValue={defaultValue} />
    </div>
  );
}
