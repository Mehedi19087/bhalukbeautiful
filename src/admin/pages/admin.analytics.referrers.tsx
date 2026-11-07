
import { useEffect, useState } from "react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { analyticsApi, type ReferrerRow } from "@/lib/api-client";
import { AnalyticsTabs } from "./admin.analytics";

export default () => (
    <AdminLayout>
      <Page />
    </AdminLayout>
  );

function Page() {
  const [items, setItems] = useState<ReferrerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi
      .referrers()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "লোড ব্যর্থ"))
      .finally(() => setLoading(false));
  }, []);

  const total = items.reduce((s, x) => s + x.views, 0) || 1;

  return (
    <>
      <PageHeader title="ট্রাফিক সোর্স" desc="ভিজিটররা কোথা থেকে আসছেন" />
      <AnalyticsTabs active="/admin/analytics/referrers" />
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-neutral-500">লোড হচ্ছে…</p>
      ) : (
        <div className="bg-white rounded-lg border p-6 space-y-3">
          {items.map((it) => {
            const pct = (it.views / total) * 100;
            return (
              <div key={it.referrer}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{it.referrer || "direct"}</span>
                  <span className="text-neutral-500">
                    {it.views.toLocaleString("bn-BD")} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}