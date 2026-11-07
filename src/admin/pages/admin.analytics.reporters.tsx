
import { useEffect, useState } from "react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { analyticsApi, type ReporterPerf } from "@/lib/api-client";
import { AnalyticsTabs } from "./admin.analytics";

export default () => (
    <AdminLayout>
      <Page />
    </AdminLayout>
  );

function Page() {
  const [items, setItems] = useState<ReporterPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi
      .reporters()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "লোড ব্যর্থ"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="রিপোর্টার লিডারবোর্ড" desc="প্রত্যেক রিপোর্টারের মোট ভিউ ও সংখ্যা" />
      <AnalyticsTabs active="/admin/analytics/reporters" />
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-neutral-500">লোড হচ্ছে…</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">রিপোর্টার</th>
                <th className="px-4 py-3">আর্টিকেল</th>
                <th className="px-4 py-3">মোট ভিউ</th>
                <th className="px-4 py-3">গড় ভিউ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it, i) => (
                <tr key={it.article__author_id}>
                  <td className="px-4 py-3 text-neutral-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{it.article__author__email}</td>
                  <td className="px-4 py-3">{it.articles}</td>
                  <td className="px-4 py-3">{it.views.toLocaleString("bn-BD")}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {it.articles ? Math.round(it.views / it.articles).toLocaleString("bn-BD") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}