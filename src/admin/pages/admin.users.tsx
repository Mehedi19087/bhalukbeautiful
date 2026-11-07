
import { useEffect, useState } from "react";
import { AdminLayout, PageHeader } from "@/components/admin/AdminLayout";
import { usersApi, type User, type Role, isOwnerRole } from "@/lib/api-client";
import { useAdminAuth } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  User as UserIcon,
  UserPlus,
} from "lucide-react";

export default () => (
    <AdminLayout>
      <UsersManagementPage />
    </AdminLayout>
  );

const ROLES: { value: Role; label: string; description: string; badgeBg: string }[] = [
  {
    value: "OWNER",
    label: "মালিক (OWNER)",
    description: "সম্পূর্ণ অ্যাক্সেস + রোল পরিবর্তন ক্ষমতা",
    badgeBg: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    value: "EIC",
    label: "প্রধান সম্পাদক (EIC)",
    description: "সব পোস্ট অনুমোদন/বাতিল, বিজ্ঞাপন ও অ্যানালিটিক্স",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    value: "EDITOR",
    label: "সম্পাদক (EDITOR)",
    description: "পোস্ট অনুমোদন/বাতিল, বিজ্ঞাপন, ক্যাটাগরি ও অ্যানালিটিক্স",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    value: "REPORTER",
    label: "রিপোর্টার (REPORTER)",
    description: "নতুন পোস্ট তৈরি এবং নিজস্ব ড্রাফট সম্পাদনা",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    value: "READER",
    label: "পাঠক (READER)",
    description: "সাধারণ পাঠক (শুধুমাত্র পঠনযোগ্য)",
    badgeBg: "bg-neutral-100 text-neutral-700 border-neutral-300",
  },
];

function getRoleBadge(roleStr: Role) {
  const config = ROLES.find((r) => r.value === roleStr);
  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-300">
        {roleStr}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeBg}`}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function UsersManagementPage() {
  const { user: currentUser } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: "EDITOR" | "REPORTER";
    area: string;
  }>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "EDITOR",
    area: "",
  });

  const isOwner = isOwnerRole(currentUser?.role);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await usersApi.list();
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ব্যবহারকারীদের তালিকা লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      void loadUsers();
    } else {
      setLoading(false);
    }
  }, [isOwner]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      setCreateError("ইমেইল ও পাসওয়ার্ড প্রদান করা আবশ্যক।");
      return;
    }
    if (formData.password.length < 8) {
      setCreateError("পাসওয়ার্ড ন্যূনতম ৮ অক্ষরের হতে হবে।");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    try {
      const newUser = await usersApi.create({
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role,
        area: formData.area.trim(),
      });
      setUsers((prev) => [newUser, ...prev]);
      setSuccessMsg(`সফলভাবে ${newUser.email} অ্যাকাউন্টটি তৈরি করা হয়েছে।`);
      setTimeout(() => setSuccessMsg(null), 5000);
      setIsAddModalOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "EDITOR",
        area: "",
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "সদস্য যুক্ত করতে ব্যর্থ হয়েছে");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, targetEmail: string, newRole: Role) => {
    if (currentUser?.id === userId || currentUser?.email === targetEmail) {
      setError("আপনি নিজের রোল পরিবর্তন করতে পারবেন না");
      return;
    }

    setUpdatingId(userId);
    setError(null);
    setSuccessMsg(null);

    try {
      const updatedUser = await usersApi.updateRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      const roleConfig = ROLES.find((r) => r.value === newRole);
      setSuccessMsg(
        `সফলভাবে ${targetEmail}-এর রোল '${roleConfig?.label || newRole}' হিসেবে পরিবর্তন করা হয়েছে`
      );
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "রোল পরিবর্তন ব্যর্থ হয়েছে");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 bg-white rounded-lg border shadow-sm text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">অ্যাক্সেস অনুমোদিত নয়</h2>
        <p className="text-sm text-neutral-600">
          ব্যবহারকারী ও রোল ব্যবস্থাপনা কেবল মাত্র পোর্টাল অ্যাডমিন অ্যাকাউন্টের জন্য সীমাবদ্ধ।
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.area && u.area.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <PageHeader
        title="ব্যবহারকারী ও রোল ব্যবস্থাপনা"
        desc="আপনার পোর্টালের সদস্যদের পরিচালনা করুন এবং নতুন এডিটর ও রিপোর্টার যুক্ত করুন"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              রিফ্রেশ
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                  <UserPlus className="w-4 h-4 mr-2" />
                  নতুন সদস্য যুক্ত করুন
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>নতুন সদস্য যুক্ত করুন</DialogTitle>
                  <DialogDescription>
                    আপনার পোর্টালে নতুন এডিটর বা রিপোর্টার অ্যাকাউন্ট তৈরি করুন।
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 py-2">
                  {createError && (
                    <div className="p-3 text-xs rounded border border-red-200 bg-red-50 text-red-800">
                      {createError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="first_name">প্রথম নাম</Label>
                      <Input
                        id="first_name"
                        placeholder="রহিম"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="last_name">শেষ নাম</Label>
                      <Input
                        id="last_name"
                        placeholder="উদ্দিন"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">ইমেইল *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="editor@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password">পাসওয়ার্ড (ন্যূনতম ৮ অক্ষর) *</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="role">রোল (পদবী) *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(val: "EDITOR" | "REPORTER") =>
                          setFormData({ ...formData, role: val })
                        }
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="রোল নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EDITOR">সম্পাদক (EDITOR)</SelectItem>
                          <SelectItem value="REPORTER">রিপোর্টার (REPORTER)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="area">এলাকা / কর্মক্ষেত্র</Label>
                      <Input
                        id="area"
                        placeholder="যেমন: ঢাকা বা সিলেট"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddModalOpen(false)}
                      disabled={createLoading}
                    >
                      বাতিল
                    </Button>
                    <Button
                      type="submit"
                      disabled={createLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                      {createLoading ? "তৈরি হচ্ছে..." : "সংরক্ষণ করুন"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Role Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        {ROLES.map((r) => {
          const count = users.filter((u) => u.role === r.value).length;
          return (
            <div key={r.value} className="bg-white border rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase">{r.value}</span>
                <span className="text-sm font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                  {count}
                </span>
              </div>
              <p className="text-xs font-medium text-neutral-800 mt-1 truncate">{r.label}</p>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-4 rounded-lg border border-green-200 bg-green-50 text-sm text-green-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">{successMsg}</div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4 bg-white p-4 border rounded-lg shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
          <Input
            placeholder="ইমেইল, নাম বা রোল দিয়ে খুঁজুন..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-xs text-neutral-500 font-medium">
          মোট ব্যবহারকারী: <span className="text-neutral-900 font-bold">{filteredUsers.length}</span> জন
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-neutral-500">
            ব্যবহারকারী তথ্য লোড হচ্ছে…
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-sm text-neutral-500">
            {searchQuery ? "কোনো ব্যবহারকারী পাওয়া যায়নি" : "কোনো ব্যবহারকারী নিবন্ধিত নেই"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 w-12">ID</th>
                  <th className="px-4 py-3.5">ব্যবহারকারী (Email / Name)</th>
                  <th className="px-4 py-3.5">বর্তমান রোল</th>
                  <th className="px-4 py-3.5">এলাকা</th>
                  <th className="px-4 py-3.5">স্ট্যাটাস</th>
                  <th className="px-4 py-3.5">যোগদানের তারিখ</th>
                  <th className="px-4 py-3.5 min-w-[200px]">রোল পরিবর্তন করুন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id || currentUser?.email === u.email;
                  const isUpdating = updatingId === u.id;
                  const nameStr = [u.first_name, u.last_name].filter(Boolean).join(" ");

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-neutral-50 transition-colors ${
                        isSelf ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="px-4 py-4 font-mono text-xs text-neutral-500">#{u.id}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 border text-neutral-600 flex items-center justify-center text-xs font-semibold shrink-0">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 font-medium text-neutral-900">
                              <span>{u.email}</span>
                              {isSelf && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                                  আপনি (You)
                                </span>
                              )}
                            </div>
                            {nameStr && (
                              <p className="text-xs text-neutral-500 mt-0.5">{nameStr}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">{getRoleBadge(u.role)}</td>
                      <td className="px-4 py-4 text-xs text-neutral-600">
                        {u.area ? (
                          <span className="bg-neutral-100 px-2 py-1 rounded text-neutral-800">
                            {u.area}
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {u.is_active !== false ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                            সক্রিয়
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                            নিষ্ক্রিয়
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-neutral-500">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        {isSelf ? (
                          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100/60 border border-amber-200 px-3 py-1.5 rounded-md font-medium">
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span>নিজের রোল পরিবর্তন অসম্ভব</span>
                          </div>
                        ) : (
                          <Select
                            value={u.role}
                            disabled={isUpdating}
                            onValueChange={(val) =>
                              handleRoleChange(u.id, u.email, val as Role)
                            }
                          >
                            <SelectTrigger className="w-full h-9 bg-white">
                              <SelectValue placeholder="রোল নির্বাচন করুন" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  <div className="flex flex-col py-0.5">
                                    <span className="font-medium text-xs text-neutral-900">
                                      {r.label}
                                    </span>
                                    <span className="text-[10px] text-neutral-500">
                                      {r.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
