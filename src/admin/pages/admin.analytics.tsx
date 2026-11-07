import { Link } from "@/admin/navigation";

import { useEffect, useState } from "react";
import { Eye, FileCheck2, Clock, Megaphone } from "lucide-react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { analyticsApi, type AnalyticsOverview } from "@/lib/api-client";

export default () => (
    <AdminLayout>
      <AnalyticsOverviewPage />
    </AdminLayout>
  );

const TABS = [
  { to: "/admin/analytics", label: "ওভারভিউ", exact: true },
  { to: "/admin/analytics/articles", label: "টপ আর্টিকেল" },
  { to: "/admin/analytics/reporters", label: "রিপোর্টার" },
  { to: "/admin/analytics/referrers", label: "সোর্স" },
  { to: "/admin/analytics/categories", label: "ক্যাটাগরি" },
] as const;

export function AnalyticsTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-2 mb-6 border-b overflow-x-auto">
      {TABS.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={`px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap ${
            active === t.to
              ? "border-red-600 text-red-600 font-medium"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

function AnalyticsOverviewPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi
      .overview()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "লোড ব্যর্থ"))
      .finally(() => setLoading(false));
  }, []);

  const maxDay = data ? Math.max(...data.views_by_day.map((d) => d.count), 1) : 1;

  return (
    <>
      <PageHeader title="অ্যানালিটিক্স ওভারভিউ" desc="আপনার প্রকাশনার সামগ্রিক পরিসংখ্যান" />
      <AnalyticsTabs active="/admin/analytics" />

      {error && (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-neutral-500">লোড হচ্ছে…</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Eye} label="মোট ভিউ" value={data.total_views} tone="blue" />
            <StatCard icon={FileCheck2} label="প্রকাশিত" value={data.published_articles} tone="green" />
            <StatCard icon={Clock} label="অপেক্ষমাণ" value={data.pending_articles} tone="amber" />
            <StatCard icon={Megaphone} label="সক্রিয় বিজ্ঞাপন" value={data.active_ads} tone="red" />
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-semibold mb-4">দৈনিক ভিউ</h2>
            <div className="flex items-end gap-2 h-56">
              {data.views_by_day.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="text-[10px] text-neutral-500">{d.count}</div>
                  <div
                    className="w-full bg-red-600 rounded-t"
                    style={{ height: `${(d.count / maxDay) * 100}%` }}
                  />
                  <div className="text-[10px] text-neutral-500 truncate w-full text-center">
                    {d.day.slice(5)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "blue" | "green" | "amber" | "red";
}) {
  const toneMap = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className={`w-10 h-10 rounded-lg grid place-items-center mb-3 ${toneMap[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value.toLocaleString("bn-BD")}</p>
    </div>
  );
}