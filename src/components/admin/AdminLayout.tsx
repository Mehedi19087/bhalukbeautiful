import { Link, useNavigate } from "@/admin/navigation";
import { useLocation } from "react-router-dom";
import { type ReactNode, useEffect } from "react";
import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  Clock,
  FolderTree,
  Megaphone,
  BarChart3,
  Users,
  LogOut,
  Share2 as Facebook,
} from "lucide-react";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";
import { clearTokens, isOwnerRole } from "@/lib/api-client";

const BASE_NAV = [
  { to: "/admin/dashboard", label: "ওভারভিউ", icon: LayoutDashboard },
  { to: "/admin/articles", label: "সব পোস্ট", icon: FileText },
  { to: "/admin/articles/pending", label: "অনুমোদনের জন্য", icon: Clock },
  { to: "/admin/articles/new", label: "নতুন পোস্ট", icon: FilePlus2 },
  { to: "/admin/categories", label: "ক্যাটাগরি", icon: FolderTree },
  { to: "/admin/facebook", label: "ফেসবুক ইন্টিগ্রেশন", icon: Facebook },
  { to: "/admin/ads", label: "বিজ্ঞাপন", icon: Megaphone },
  { to: "/admin/analytics", label: "অ্যানালিটিক্স", icon: BarChart3 },
] as const;

function getRoleLabel(role?: string): string {
  switch (role?.toUpperCase()) {
    case "OWNER":
    case "ADMIN":
    case "SUPERADMIN":
      return "মালিক (Owner)";
    case "EIC":
      return "প্রধান সম্পাদক (EIC)";
    case "EDITOR":
      return "সম্পাদক (Editor)";
    case "REPORTER":
    case "JOURNALIST":
      return "রিপোর্টার (Reporter)";
    case "READER":
      return "পাঠক (Reader)";
    default:
      return role || "ব্যবহারকারী";
  }
}

function Shell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAdminAuth();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/admin/login" });
  }, [loading, user, navigate]);

  if (user?.role === "READER") return <div className="p-8"><h1>এই অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই। মালিকের সঙ্গে যোগাযোগ করুন।</h1><button onClick={() => { void logout(); }}>লগ আউট</button></div>;

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 text-sm text-neutral-500">
        লোড হচ্ছে…
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    clearTokens();
    navigate({ to: "/admin/login" });
  };

  const navItems = [
    ...BASE_NAV,
    ...(isOwnerRole(user.role)
      ? [{ to: "/admin/users", label: "ব্যবহারকারী ও রোল", icon: Users }]
      : []),
  ];

  return (
    <div className="admin-shell min-h-screen flex bg-neutral-50">
      <aside className="admin-sidebar w-64 shrink-0 bg-white border-r border-neutral-200 flex flex-col">
        <div className="px-6 py-5 border-b">
          <Link to="/admin/dashboard" className="flex flex-col items-start gap-2 group">
            <img
              src="/assets/diganta-logo-transparent.png"
              alt="Diganta News"
              className="w-12 h-12 object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 mt-0.5">অ্যাডমিন প্যানেল</p>
            </div>
          </Link>
        </div>
        <nav aria-label="অ্যাডমিন মেনু" className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const base = to.split("?")[0];
            const active =
              pathname === base || (base !== "/admin/dashboard" && pathname.startsWith(base));
            return (
              <Link
                key={to}
                to={to.split("?")[0]}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                  active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <div className="px-3 py-2 text-xs">
            <p className="font-medium truncate">{user.email}</p>
            <p className="text-neutral-500 font-medium">
              {getRoleLabel(user.role)}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-neutral-700 hover:bg-neutral-100"
          >
            <LogOut className="w-4 h-4" />
            লগ আউট
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-8 overflow-x-auto">
        {children}
      </main>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <Shell>{children}</Shell>
    </AdminAuthProvider>
  );
}

export function PageHeader({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative z-10 mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {desc ? <p className="text-sm text-neutral-500 mt-1">{desc}</p> : null}
      </div>
      <div className="relative z-20 shrink-0 pointer-events-auto">{action}</div>
    </div>
  );
}
