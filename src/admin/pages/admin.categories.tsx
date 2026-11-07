
import { useEffect, useState, type FormEvent } from "react";
import { Trash2, Pencil, Plus, X } from "lucide-react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { categoriesApi, type Category } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default () => (
    <AdminLayout>
      <CategoriesPage />
    </AdminLayout>
  );

function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const load = () => {
    setLoading(true);
    categoriesApi
      .list()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "লোড ব্যর্থ"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const reset = () => {
    setEditing(null);
    setName("");
    setSlug("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await categoriesApi.update(editing.slug, { name, slug: slug || undefined });
      } else {
        await categoriesApi.create({ name, slug: slug || undefined });
      }
      reset();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "সংরক্ষণ ব্যর্থ");
    }
  };

  const onDelete = async (c: Category) => {
    if (!confirm(`"${c.name}" মুছে ফেলবেন?`)) return;
    setError(null);
    try {
      await categoriesApi.remove(c.slug);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "মুছে ফেলা ব্যর্থ হয়েছে");
    }
  };

  return (
    <>
      <PageHeader title="ক্যাটাগরি ব্যবস্থাপনা" desc="সাইটের সব ক্যাটাগরি এখানে দেখুন ও এডিট করুন" />

      {error && (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={onSubmit} className="bg-white rounded-lg border p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              {editing ? "ক্যাটাগরি এডিট" : "নতুন ক্যাটাগরি"}
            </h2>
            {editing && (
              <button type="button" onClick={reset} className="text-neutral-500 hover:text-neutral-900">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">নাম</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">স্লাগ (ঐচ্ছিক)</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" />
          </div>
          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-1" />
            {editing ? "আপডেট" : "যুক্ত করুন"}
          </Button>
        </form>

        <div className="lg:col-span-2 bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">নাম</th>
                <th className="px-4 py-3">স্লাগ</th>
                <th className="px-4 py-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-neutral-500">লোড হচ্ছে…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-neutral-500">কোনো ক্যাটাগরি নেই</td></tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-neutral-500 font-mono text-xs">{c.slug}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditing(c);
                          setName(c.name);
                          setSlug(c.slug);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-neutral-100"
                      >
                        <Pencil className="w-3 h-3" /> এডিট
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}