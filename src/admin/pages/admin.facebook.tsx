import { useSearch } from "@/admin/navigation";

import { useCallback, useEffect, useState } from "react";
import { getFacebookPublishFeedback } from "@/lib/facebook-publish-result";
import {
  Share2 as Facebook,
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  Sparkles,
  ShieldCheck,
  Check,
  Send,
  Eye,
  ImageIcon,
  Key,
} from "lucide-react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import {
  facebookApi,
  articlesApi,
  type FacebookPage,
  type ApiArticle,
  isEditorRole,
} from "@/lib/api-client";
import { useAdminAuth } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default () => (
    <AdminLayout>
      <FacebookIntegrationPage />
    </AdminLayout>
  );

function FacebookIntegrationPage() {
  const { user } = useAdminAuth();
  const search = useSearch({ from: "/admin/facebook" });

  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
    link?: string;
  } | null>(null);

  // Manual article publishing state
  const [recentArticles, setRecentArticles] = useState<ApiArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [publishingSlug, setPublishingSlug] = useState<string | null>(null);
  const [previewCardUrl, setPreviewCardUrl] = useState<string | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [inputPageId, setInputPageId] = useState("");
  const [submittingToken, setSubmittingToken] = useState(false);

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await facebookApi.getPages();
      setPages(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setNotification({
        type: "error",
        text: (err as { message?: string }).message || "ফেসবুক পেজের তথ্য আনা যায়নি। আবার চেষ্টা করুন।",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const articles = await articlesApi.list();
      setRecentArticles(Array.isArray(articles) ? articles.filter((article) => article.status === "PUBLISHED").slice(0, 10) : []);
    } catch (err: unknown) {
      console.error("Failed loading recent articles:", err);
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
    loadArticles();
  }, [loadPages, loadArticles]);

  // Handle OAuth callback search params
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#_=_") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    if (search.facebook === "connected") {
      const count = search.pages_count || "1";
      setNotification({
        type: "success",
        text: `ফেসবুক সফলভাবে কানেক্ট হয়েছে! মোট ${count}টি পেজ পাওয়া গেছে।`,
      });
      if (typeof window !== "undefined") {
        setTimeout(() => {
          history.replaceState(null, "", window.location.pathname);
        }, 1200);
      }
    } else if (search.facebook === "error") {
      setNotification({
        type: "error",
        text: `ফেসবুক সংযোগে ত্রুটি: ${search.detail || search.message || "অজানা সমস্যা"}`,
      });
    }
  }, [search]);

  const handleConnect = async () => {
    setConnecting(true);
    setNotification(null);
    try {
      const res = await facebookApi.getAuthUrl();
      if (res.auth_url) {
        window.location.href = res.auth_url;
      }
    } catch (err: unknown) {
      setNotification({
        type: "error",
        text: (err as { message?: string }).message || "ফেসবুক অথেন্টিকেশন লিংক তৈরি করা সম্ভব হয়নি।",
      });
      setConnecting(false);
    }
  };

  const handleConnectWithToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    setSubmittingToken(true);
    setNotification(null);
    try {
      const res = await facebookApi.connectWithToken({
        access_token: inputToken.trim(),
        page_id: inputPageId.trim() || undefined,
      });
      const count = Array.isArray(res) ? res.length : 1;
      setNotification({
        type: "success",
        text: `সফলভাবে ${count}টি ফেসবুক পেজ যুক্ত হয়েছে!`,
      });
      setInputToken("");
      setInputPageId("");
      setTokenModalOpen(false);
      await loadPages();
    } catch (err: unknown) {
      setNotification({
        type: "error",
        text: (err as { message?: string }).message || "টোকেন দিয়ে পেজ যুক্ত করা সম্ভব হয়নি।",
      });
    } finally {
      setSubmittingToken(false);
    }
  };

  const handleToggleAutoPost = async (page: FacebookPage) => {
    setActionId(page.id);
    try {
      const updated = await facebookApi.updatePage(page.id, {
        auto_post: !page.auto_post,
      });
      setPages((prev) => prev.map((p) => (p.id === page.id ? updated : p)));
    } catch (err: unknown) {
      alert((err as { message?: string }).message || "স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি।");
    } finally {
      setActionId(null);
    }
  };

  const handleDisconnect = async (page: FacebookPage) => {
    if (!confirm(`আপনি কি "${page.page_name}" পেজটি ডিসকানেক্ট করতে চান?`)) return;
    setActionId(page.id);
    try {
      await facebookApi.disconnectPage(page.id);
      setPages((prev) => prev.filter((p) => p.id !== page.id));
      setNotification({
        type: "success",
        text: `"${page.page_name}" পেজটি সফলভাবে ডিসকানেক্ট করা হয়েছে।`,
      });
    } catch (err: unknown) {
      alert((err as { message?: string }).message || "পেজ ডিসকানেক্ট করতে সমস্যা হয়েছে।");
    } finally {
      setActionId(null);
    }
  };

  const handleManualPublish = async (article: ApiArticle) => {
    setPublishingSlug(article.slug);
    setNotification(null);
    try {
      const res = await facebookApi.publishToFacebook(article.slug);
      const results = res.results || [];
      const successful = results.find((r) => r.status === "SUCCESS");
      const feedback = getFacebookPublishFeedback(res);
      setNotification(feedback);

      if (successful) {
        const postLink = feedback.link;
        // Update share_card_url and facebook_posted in local articles
        const shareCardUrl = res.share_card_url;
        const cacheBustedUrl = shareCardUrl
          ? `${shareCardUrl}${shareCardUrl.includes("?") ? "&" : "?"}t=${Date.now()}`
          : article.share_card_url;

        setRecentArticles((prev) =>
          prev.map((a) =>
            a.slug === article.slug
              ? {
                  ...a,
                  share_card_url: cacheBustedUrl,
                  facebook_posted: true,
                  facebook_post_url: postLink,
                }
              : a
          )
        );
      }
    } catch (err: unknown) {
      setNotification({
        type: "error",
        text: (err as { message?: string }).message || "পোস্ট করতে গিয়ে ত্রুটি ঘটেছে।",
      });
    } finally {
      setPublishingSlug(null);
    }
  };

  if (!isEditorRole(user?.role)) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500">
        এই পেজটি দেখার জন্য আপনার এডিটর বা অ্যাডমিন পারমিশন প্রয়োজন।
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ফেসবুক পেজ ইন্টিগ্রেশন"
        desc="Meta Graph API OAuth 2.0-এর মাধ্যমে ফেসবুক পেজ কানেক্ট করুন এবং সংবাদ প্রকাশের সাথে সাথে স্বয়ংক্রিয় ফটোকার্ড পোস্ট করুন।"
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setTokenModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2 font-semibold"
            >
              <Key className="w-4 h-4 text-neutral-600" />
              টোকেন দিয়ে সরাসরি যুক্ত করুন
            </Button>
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="bg-[#1877F2] hover:bg-[#0c63d4] text-white flex items-center gap-2 shadow-sm font-semibold"
            >
              <Facebook className="w-4 h-4 fill-white" />
              {connecting ? "কানেক্ট হচ্ছে…" : "ফেসবুক দিয়ে কানেক্ট করুন"}
            </Button>
          </div>
        }
      />

      {notification && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 text-sm border ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-medium">{notification.text}</div>
            {notification.link && (
              <a
                href={notification.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline mt-1.5"
              >
                ফেসবুক পোস্টটি দেখুন <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Feature highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>অটো-পাবলিশ ফটোকার্ড</span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            অটো-পোস্ট চালু থাকলে সংবাদ প্রকাশের পর ফটোকার্ড পেজে যায়। সংবাদের লিংক কমেন্টে যোগ হয়।
          </p>
        </div>

        <div className="p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>পেজ সংযোগের অনুমতি</span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            ফটোকার্ড পোস্ট ও লিংক কমেন্টের অনুমতি দিন। ফেসবুক অনুমতি বাতিল করলে আবার পেজ কানেক্ট করুন।
          </p>
        </div>

        <div className="p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 font-semibold mb-1">
            <Share2 className="w-4 h-4" />
            <span>০ টাকা এআই খরচ</span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            পেইড এআই ইমেজ মডেল নয়; পিওর পাইথন পিলো ও গুগল হিন্ড শিলিগুড়ি ফন্ট দিয়ে ইনস্ট্যান্ট ০.১৫ সেকেন্ডে তৈরি।
          </p>
        </div>
      </div>

      {/* Connected Pages Section */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              সংযুক্ত ফেসবুক পেজসমূহ
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              যে পেজগুলোতে স্বয়ংক্রিয় ফটোকার্ড পোস্ট করতে চান তা সক্রিয় রাখুন।
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPages}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-neutral-400">
            পেজ তথ্য লোড হচ্ছে…
          </div>
        ) : pages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1877F2] grid place-items-center mx-auto">
              <Facebook className="w-6 h-6 fill-[#1877F2]" />
            </div>
            <p className="text-sm font-semibold text-neutral-800">
              এখনও কোনো ফেসবুক পেজ সংযুক্ত করা হয়নি
            </p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              নিচের নীল বাটনে ক্লিক করে ফেসবুক অ্যাকাউন্টে লগইন করুন এবং আপনার পরিচালিত পেজটি নির্বাচন করুন।
            </p>
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="mt-2 bg-[#1877F2] hover:bg-[#0c63d4] text-white flex items-center gap-2 mx-auto font-semibold"
            >
              <Facebook className="w-4 h-4 fill-white" />
              {connecting ? "কানেক্ট হচ্ছে…" : "ফেসবুক দিয়ে পেজ কানেক্ট করুন"}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {pages.map((page) => (
              <div
                key={page.id}
                className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1877F2] grid place-items-center font-bold text-lg shrink-0">
                    <Facebook className="w-5 h-5 fill-[#1877F2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900">
                        {page.page_name}
                      </h3>
                      {page.is_active && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3" /> সক্রিয়
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                      <span>পেজ আইডি: {page.page_id}</span>
                      {page.page_category && <span>• {page.page_category}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <Button
                    variant={page.auto_post ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleAutoPost(page)}
                    disabled={actionId === page.id}
                    className={`text-xs flex items-center gap-1.5 ${
                      page.auto_post
                        ? "bg-neutral-900 text-white hover:bg-neutral-800"
                        : "text-neutral-700"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {page.auto_post ? "অটো-পোস্ট চালু" : "অটো-পোস্ট বন্ধ"}
                  </Button>

                  <a
                    href={`https://facebook.com/${page.page_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-neutral-500 hover:text-blue-600 flex items-center gap-1 px-2 py-1"
                  >
                    ভিজিট <ExternalLink className="w-3 h-3" />
                  </a>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(page)}
                    disabled={actionId === page.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ডিসকানেক্ট
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Article Photocard Publishing Section */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              প্রকাশিত সংবাদে ফটোকার্ড পোস্ট করুন
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              তৈরি থাকা ফটোকার্ড দেখে সরাসরি ফেসবুক পেজে পোস্ট পাঠাতে পারেন।
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadArticles}
            disabled={loadingArticles}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingArticles ? "animate-spin" : ""}`} />
            রিফ্রেশ সংবাদ
          </Button>
        </div>

        {loadingArticles ? (
          <div className="p-12 text-center text-sm text-neutral-400">
            সংবাদ তালিকা লোড হচ্ছে…
          </div>
        ) : recentArticles.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            এখনও কোনো প্রকাশিত সংবাদ পাওয়া যায়নি।
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentArticles.map((article) => (
              <div
                key={article.id}
                className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  {article.featured_image_url ? (
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-16 h-12 rounded object-cover border shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-12 rounded bg-neutral-100 border grid place-items-center text-neutral-400 shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 line-clamp-1">
                      {article.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-1.5">
                      <span className="font-semibold text-neutral-700">
                        {article.category?.name || "সংবাদ"}
                      </span>
                      <span>•</span>
                      <span>
                        {article.published_at
                          ? new Date(article.published_at).toLocaleDateString("bn-BD")
                          : "প্রকাশিত"}
                      </span>
                      {article.share_card_url ? (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-3 h-3" /> ফটোকার্ড তৈরি আছে
                          </span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                            কার্ড তৈরি নেই
                          </span>
                        </>
                      )}

                      {article.facebook_posted ? (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1877F2] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            <Facebook className="w-3 h-3 fill-[#1877F2]" /> ফেসবুকে পোস্ট সম্পন্ন
                          </span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            ফেসবুকে পোস্ট বাকি
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
                  {/* View Card Button */}
                  {article.share_card_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = article.share_card_url!;
                        setPreviewCardUrl(url.includes("t=") ? url : `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`);
                      }}
                      className="text-xs flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900 border-neutral-300"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      কার্ড দেখুন
                    </Button>
                  )}

                  {/* Facebook Post Button / Link */}
                  {article.facebook_posted ? (
                    article.facebook_post_url ? (
                      <a
                        href={article.facebook_post_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#1877F2] text-white hover:bg-[#0c63d4] shadow-sm transition-colors"
                      >
                        <Facebook className="w-3.5 h-3.5 fill-white" />
                        পেজে দেখুন
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                        পোস্ট সম্পন্ন
                      </span>
                    )
                  ) : article.share_card_url ? (
                    <Button
                      onClick={() => handleManualPublish(article)}
                      disabled={publishingSlug === article.slug || pages.length === 0}
                      className="bg-[#1877F2] hover:bg-[#0c63d4] text-white text-xs flex items-center gap-1.5 shadow-sm font-semibold"
                    >
                      <Send className={`w-3.5 h-3.5 ${publishingSlug === article.slug ? "animate-pulse" : ""}`} />
                      {publishingSlug === article.slug ? "পোস্ট হচ্ছে…" : "ফেসবুকে পোস্ট পাঠান"}
                    </Button>
                  ) : (
                    <span className="text-xs text-neutral-400 italic px-2">
                      ফটোকার্ড নেই
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photocard Preview Dialog */}
      <Dialog open={!!previewCardUrl} onOpenChange={() => setPreviewCardUrl(null)}>
        <DialogContent className="sm:max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              ফটোকার্ড প্রিভিউ
            </DialogTitle>
          </DialogHeader>
          {previewCardUrl && (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg overflow-hidden border shadow-sm">
                <img
                  src={previewCardUrl}
                  alt="PhotoCard Preview"
                  className="w-full h-auto"
                />
              </div>
              <a
                href={previewCardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-medium text-blue-700 underline underline-offset-4"
              >
                পূর্ণ রেজোলিউশনে দেখুন
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Token Connection Dialog */}
      <Dialog open={tokenModalOpen} onOpenChange={setTokenModalOpen}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              টোকেন দিয়ে সরাসরি ফেসবুক পেজ যুক্ত করুন
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConnectWithToken} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fb-access-token" className="text-xs font-semibold">
                ফেসবুক অ্যাক্সেস টোকেন <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="fb-access-token"
                rows={3}
                placeholder="Page Access Token বা System User Token পেস্ট করুন (যেমন: EAAPmW95...)"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                required
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-neutral-500">
                মেটা সিস্টেম ইউজার টোকেন অথবা পার্মানেন্ট পেজ এক্সেস টোকেন দিন।
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-page-id" className="text-xs font-semibold">
                পেইজ আইডি (ঐচ্ছিক)
              </Label>
              <Input
                id="fb-page-id"
                placeholder="যেমন: 1928781004026319 (খালি রাখলে স্বয়ংক্রিয়ভাবে সনাক্ত হবে)"
                value={inputPageId}
                onChange={(e) => setInputPageId(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTokenModalOpen(false)}
                disabled={submittingToken}
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={submittingToken || !inputToken.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {submittingToken ? "যাচাই হচ্ছে…" : "পেজ যুক্ত করুন"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
