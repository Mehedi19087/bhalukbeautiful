
import { useEffect, useState } from "react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { analyticsApi, type TopArticle } from "@/lib/api-client";
import { AnalyticsTabs } from "./admin.analytics";

export default () => (
    <AdminLayout>
      <Page />
    </AdminLayout>
  );

function Page() {
  const [items, setItems] = useState<TopArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi
      .articles()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "লোড ব্যর্থ"))
      .finally(() => setLoading(false));
  }, []);

  const max = Math.max(...items.map((i) => i.views), 1);

  return (
    <>
      <PageHeader title="টপ আর্টিকেল" desc="সবচেয়ে বেশি পঠিত লেখাগুলি" />
      <AnalyticsTabs active="/admin/analytics/articles" />
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-neutral-500">লোড হচ্ছে…</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">শিরোনাম</th>
                <th className="px-4 py-3 w-64">ভিউ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it, i) => (
                <tr key={it.article_id}>
                  <td className="px-4 py-3 text-neutral-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    <a
                      href={`/article/${it.article__slug}`}
                      className="hover:underline"
                    >
                      {it.article__title}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600"
                          style={{ width: `${(it.views / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums w-16 text-right">
                        {it.views.toLocaleString("bn-BD")}
                      </span>
                    </div>
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