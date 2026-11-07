import { useNavigate, Link } from "@/admin/navigation";

import { useState, type FormEvent } from "react";
import { AdminAuthProvider } from "@/lib/admin-auth";
import { authApi, setTokens, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default () => (
    <AdminAuthProvider>
      <AdminLoginPage />
    </AdminAuthProvider>
  );

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.login(email, password);
      const normalizedUser = {
        id: res.user.id,
        email: res.user.email,
        role: res.user.role,
      };
      setTokens(res.access, res.refresh);
      localStorage.setItem("dgn_admin_session", JSON.stringify(normalizedUser));
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-muted/30 px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8 shadow-sm">
        <div className="text-center mb-6">
          <Link to="/" className="font-serif text-2xl font-black tracking-tight">
            দিগন্ত নিউজ
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Journalist / Admin Console</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@digontonews.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-sm text-center text-muted-foreground pt-2">
            নতুন এখানে?{" "}
            <Link to="/admin/signup" className="text-red-600 font-medium">
              সাইন আপ করুন
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}