import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/cms/admin-page-header";
import { OrderCard } from "@/components/cms/order-card";
import { ORDER_STATUSES } from "@/lib/cms/constants";
import { getOrders } from "@/lib/queries/cms";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: raw } = await searchParams;
  const status = ORDER_STATUSES.includes(raw as (typeof ORDER_STATUSES)[number]) ? raw : undefined;
  const orders = await getOrders(200, status);

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="Mark orders paid once payment lands, then add tracking when they ship. Customers are emailed at each step."
      />

      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter by status">
        {[undefined, ...ORDER_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/orders?status=${s}` : "/admin/orders"}
            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
              status === s ? "border-orange-600 bg-orange-50 text-orange-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {s ?? "All"}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          {status ? `No ${status} orders.` : "No orders yet. Orders placed at checkout show up here."}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
