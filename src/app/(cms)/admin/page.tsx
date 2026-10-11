import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, DollarSign, MessageSquare, Package, ShoppingBag } from "lucide-react";
import { AdminPageHeader } from "@/components/cms/admin-page-header";
import { ORDER_STATUS_COLORS } from "@/lib/cms/constants";
import { getAdminStats, getOrders } from "@/lib/queries/cms";
import { formatAud } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const [stats, orders] = await Promise.all([getAdminStats(), getOrders(8)]);

  const statCards = [
    { label: "Awaiting payment", value: stats.pendingOrders, icon: ShoppingBag, hint: `${stats.orders} orders all time`, href: "/admin/orders?status=pending" },
    { label: "Revenue, 30 days", value: formatAud(stats.revenue30d), icon: DollarSign, hint: "Paid and later statuses", href: "/admin/orders" },
    { label: "Products", value: stats.products, icon: Package, hint: `${stats.inStock} in stock`, href: "/admin/products" },
    { label: "New messages", value: stats.newMessages, icon: MessageSquare, hint: "From the contact form", href: "/admin/messages" },
  ];

  return (
    <div>
      <AdminPageHeader title="Dashboard" description="Orders, stock and messages at a glance." />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-orange-200"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="spec text-[0.625rem] uppercase tracking-[0.14em] text-slate-500">{stat.label}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="font-display text-3xl font-bold tracking-tight text-slate-900">{stat.value}</div>
            <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Recent orders</h2>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700">
            All orders
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="px-5 py-10 text-sm text-slate-500">No orders yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((o) => (
              <Link key={o.id} href={`/admin/orders?status=${o.status}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {o.first_name} {o.last_name}
                    <span className="ml-2 font-mono text-xs font-normal text-slate-400">{o.reference}</span>
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {o.item_count} cans · {o.suburb}, {o.country}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-semibold text-slate-900">{formatAud(o.total)}</div>
                <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ORDER_STATUS_COLORS[o.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {o.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
