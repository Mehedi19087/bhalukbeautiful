
import { useEffect, useState } from "react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { analyticsApi, type CategoryRow } from "@/lib/api-client";
import { AnalyticsTabs } from "./admin.analytics";

export default () => (
    <AdminLayout>
      <Page />
    </AdminLayout>
  );

function Page() {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi
      .categories()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "লোড ব্যর্থ"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="ক্যাটাগরি পারফরম্যান্স" desc="ক্যাটাগরি অনুযায়ী ভিউ ও আর্টিকেল" />
      <AnalyticsTabs active="/admin/analytics/categories" />
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-neutral-500">লোড হচ্ছে…</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">ক্যাটাগরি</th>
                <th className="px-4 py-3">আর্টিকেল</th>
                <th className="px-4 py-3">মোট ভিউ</th>
                <th className="px-4 py-3">গড় ভিউ / আর্টিকেল</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it) => (
                <tr key={it.article__category_id}>
                  <td className="px-4 py-3 font-medium">{it.article__category__name}</td>
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