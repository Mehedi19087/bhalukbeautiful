
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { AdCreative } from "@/components/site/AdSlot";
import { adsApi, type Ad, type AdSlot } from "@/lib/api-client";
import { AD_SLOT_CONFIG, prepareAdImage } from "@/lib/ad-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SLOTS: AdSlot[] = ["BANNER_TOP", "SIDEBAR", "IN_ARTICLE"];

export default () => (
    <AdminLayout>
      <AdsPage />
    </AdminLayout>
  );

type FormState = {
  title: string;
  slot: AdSlot;
  target_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const EMPTY: FormState = {
  title: "",
  slot: "BANNER_TOP",
  target_url: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

function makeFormData(form: FormState, image: File) {
  const data = new FormData();
  data.append("title", form.title.trim());
  data.append("slot", form.slot);
  data.append("target_url", form.target_url.trim());
  data.append("is_active", String(form.is_active));
  if (form.start_date) data.append("start_date", form.start_date);
  if (form.end_date) data.append("end_date", form.end_date);
  data.append("image", image);
  return data;
}

function AdsPage() {
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AdSlot | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [preparedImage, setPreparedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewBlobUrl = useRef<string | null>(null);
  const imageJob = useRef(0);

  const load = () => {
    setLoading(true);
    setError(null);
    adsApi
      .adminList(filter === "ALL" ? undefined : filter)
      .then(setItems)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "লোড ব্যর্থ"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  useEffect(
    () => () => {
      if (previewBlobUrl.current) URL.revokeObjectURL(previewBlobUrl.current);
    },
    [],
  );

  const showPreview = (url: string | null, isBlob = false) => {
    if (previewBlobUrl.current) URL.revokeObjectURL(previewBlobUrl.current);
    previewBlobUrl.current = isBlob ? url : null;
    setImagePreview(url);
  };

  const reset = (slot: AdSlot = "BANNER_TOP") => {
    imageJob.current += 1;
    showPreview(null);
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY, slot });
    setSourceImage(null);
    setPreparedImage(null);
    setProcessingImage(false);
    setSaving(false);
  };

  const processImage = async (file: File, slot: AdSlot) => {
    const currentJob = ++imageJob.current;
    setProcessingImage(true);
    setError(null);

    try {
      const processed = await prepareAdImage(file, slot);
      if (currentJob !== imageJob.current) return;
      setPreparedImage(processed);
      showPreview(URL.createObjectURL(processed), true);
    } catch (processError) {
      if (currentJob !== imageJob.current) return;
      setPreparedImage(null);
      showPreview(null);
      setError(processError instanceof Error ? processError.message : "ছবি প্রস্তুত করা যায়নি");
    } finally {
      if (currentJob === imageJob.current) setProcessingImage(false);
    }
  };

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSourceImage(file);
    void processImage(file, form.slot);
  };

  const onSlotChange = (slot: AdSlot) => {
    setForm((current) => ({ ...current, slot }));
    if (sourceImage) void processImage(sourceImage, slot);
  };

  const startCreate = () => {
    const selectedSlot = filter === "ALL" ? "BANNER_TOP" : filter;
    reset(selectedSlot);
    setShowForm(true);
  };

  const onFilterChange = (slot: AdSlot | "ALL") => {
    setFilter(slot);
    if (showForm && !editingId && slot !== "ALL") onSlotChange(slot);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!editingId && !preparedImage) {
      setError("বিজ্ঞাপনের একটি ছবি নির্বাচন করুন।");
      return;
    }

    setSaving(true);
    try {
      if (editingId && preparedImage) {
        await adsApi.updateWithImage(editingId, makeFormData(form, preparedImage));
      } else if (editingId) {
        await adsApi.update(editingId, form);
      } else if (preparedImage) {
        await adsApi.createWithImage(makeFormData(form, preparedImage));
      }
      reset();
      load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "সংরক্ষণ ব্যর্থ");
      setSaving(false);
    }
  };

  const onEdit = (ad: Ad) => {
    reset();
    setEditingId(ad.id);
    setForm({
      title: ad.title,
      slot: ad.slot,
      target_url: ad.target_url,
      start_date: ad.start_date ?? "",
      end_date: ad.end_date ?? "",
      is_active: ad.is_active ?? true,
    });
    showPreview(ad.image_url);
    setShowForm(true);
  };

  const onDelete = async (ad: Ad) => {
    if (!confirm(`"${ad.title}" মুছবেন?`)) return;
    try {
      await adsApi.remove(ad.id);
      load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "মুছতে ব্যর্থ");
    }
  };

  const slotConfig = AD_SLOT_CONFIG[form.slot];

  return (
    <>
      <PageHeader
        title="বিজ্ঞাপন ব্যবস্থাপনা"
        desc="ছবি আপলোড করুন, কোথায় দেখাবে ঠিক করুন এবং ক্লিকের লিংক দিন"
        action={
          <Button onClick={startCreate}>
            <Plus className="mr-1 h-4 w-4" /> নতুন বিজ্ঞাপন
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["ALL", ...SLOTS] as const).map((slot) => (
          <button
            key={slot}
            onClick={() => onFilterChange(slot)}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              filter === slot ? "border-neutral-900 bg-neutral-900 text-white" : "bg-white"
            }`}
          >
            {slot === "ALL" ? "সব" : AD_SLOT_CONFIG[slot].label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="mb-6 space-y-5 rounded-lg border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editingId ? "বিজ্ঞাপন এডিট" : "নতুন বিজ্ঞাপন"}</h2>
            <button
              type="button"
              onClick={() => reset()}
              className="text-neutral-500"
              aria-label="বন্ধ করুন"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ad-title">বিজ্ঞাপনের নাম</Label>
              <Input
                id="ad-title"
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="যেমন: ঈদ অফার"
              />
            </div>

            <div className="space-y-2">
              <Label>কোথায় দেখাবে</Label>
              <Select value={form.slot} onValueChange={onSlotChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOTS.map((slot) => {
                    const config = AD_SLOT_CONFIG[slot];
                    return (
                      <SelectItem key={slot} value={slot}>
                        {config.label} — {config.width}×{config.height}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500">{slotConfig.description}</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ad-image">বিজ্ঞাপনের ছবি</Label>
              <label
                htmlFor="ad-image"
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-4 transition-colors hover:bg-neutral-50"
              >
                <ImagePlus className="h-7 w-7 text-neutral-500" />
                <span className="text-sm">
                  <strong>ছবি নির্বাচন করুন</strong>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    JPG, PNG বা WebP · সর্বোচ্চ ১০ MB
                  </span>
                </span>
              </label>
              <Input
                id="ad-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onImageChange}
                className="sr-only"
              />
              <p className="text-xs text-neutral-500">
                যেকোনো সাইজের ছবি দিন। ছবি বিকৃত না করে স্বয়ংক্রিয়ভাবে {slotConfig.width}×
                {slotConfig.height} সাইজে প্রস্তুত করা হবে।
                {editingId && " নতুন ছবি না দিলে বর্তমান ছবিটিই রাখা হবে।"}
              </p>

              {processingImage && (
                <div className="text-sm text-neutral-600">
                  ছবির মান ঠিক রেখে প্রস্তুত করা হচ্ছে…
                </div>
              )}

              {imagePreview && !processingImage && (
                <div className="rounded-lg border bg-neutral-50 p-3">
                  <AdCreative
                    slot={form.slot}
                    title={form.title.trim() || "বিজ্ঞাপনের নাম এখানে দেখাবে"}
                    imageUrl={imagePreview}
                  />
                  {preparedImage && (
                    <p className="mt-2 text-center text-xs text-green-700">
                      প্রস্তুত: {slotConfig.width}×{slotConfig.height} ·{" "}
                      {(preparedImage.size / 1024).toFixed(0)} KB
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ad-target">ক্লিক করলে যে ওয়েবসাইটে যাবে</Label>
              <Input
                id="ad-target"
                type="url"
                required
                value={form.target_url}
                onChange={(event) => setForm({ ...form, target_url: event.target.value })}
                placeholder="https://example.com/product"
              />
              <p className="text-xs text-neutral-500">
                পাঠক বিজ্ঞাপনের ছবিতে ক্লিক করলে এই লিংকটি নতুন ট্যাবে খুলবে।
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-start-date">শুরুর তারিখ</Label>
              <Input
                id="ad-start-date"
                type="date"
                value={form.start_date}
                onChange={(event) => setForm({ ...form, start_date: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-end-date">শেষ তারিখ</Label>
              <Input
                id="ad-end-date"
                type="date"
                min={form.start_date || undefined}
                value={form.end_date}
                onChange={(event) => setForm({ ...form, end_date: event.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="ad-active"
              checked={form.is_active}
              onCheckedChange={(value) => setForm({ ...form, is_active: value })}
            />
            <Label htmlFor="ad-active">সক্রিয়</Label>
          </div>

          <Button type="submit" disabled={saving || processingImage}>
            {saving ? "সংরক্ষণ হচ্ছে…" : editingId ? "আপডেট করুন" : "বিজ্ঞাপন তৈরি করুন"}
          </Button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">প্রিভিউ</th>
              <th className="px-4 py-3">নাম</th>
              <th className="px-4 py-3">যেখানে দেখাবে</th>
              <th className="px-4 py-3">Impr.</th>
              <th className="px-4 py-3">Clicks</th>
              <th className="px-4 py-3">CTR</th>
              <th className="px-4 py-3">স্ট্যাটাস</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                  লোড হচ্ছে…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                  কোনো বিজ্ঞাপন নেই
                </td>
              </tr>
            ) : (
              items.map((ad) => {
                const impressions = ad.impressions ?? 0;
                const clicks = ad.clicks ?? 0;
                const ctr = impressions ? `${((clicks / impressions) * 100).toFixed(1)}%` : "—";
                const isActive = ad.is_active !== false;

                return (
                  <tr key={ad.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <img
                        src={ad.image_url}
                        alt=""
                        className="h-12 w-24 rounded border object-contain"
                        loading="lazy"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{ad.title}</td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      {AD_SLOT_CONFIG[ad.slot].label}
                    </td>
                    <td className="px-4 py-3">{impressions}</td>
                    <td className="px-4 py-3">{clicks}</td>
                    <td className="px-4 py-3">{ctr}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </span>
                    </td>
                    <td className="space-x-1 px-4 py-3 text-right">
                      <button
                        onClick={() => onEdit(ad)}
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-neutral-100"
                        aria-label="এডিট করুন"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDelete(ad)}
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        aria-label="মুছুন"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
