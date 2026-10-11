import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/cms/admin-page-header";
import { ContactCard } from "@/components/cms/contact-card";
import { getContactMessages } from "@/lib/queries/cms";

export const metadata: Metadata = { title: "Messages" };

export default async function AdminMessagesPage() {
  const messages = await getContactMessages(200);

  return (
    <div>
      <AdminPageHeader title="Messages" description={`${messages.length} messages from the contact form`} />
      {messages.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          No messages yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {messages.map((message) => (
            <ContactCard key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  );
}
