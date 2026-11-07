import { Link, useNavigate, useSearch } from "@/admin/navigation";

import { useState, type FormEvent } from "react";
import { authApi, setTokens, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default VerifyOtpPage;

function VerifyOtpPage() {
  const search = useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState(search.email ?? "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.verifyOtp(email, otp);
      const normalizedUser = {
        id: res.user.id,
        email: res.user.email,
        role: res.user.role,
      };
      setTokens(res.access, res.refresh);
      localStorage.setItem("dgn_admin_session", JSON.stringify(normalizedUser));
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "OTP যাচাই ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-lg border p-8 shadow-sm space-y-5"
      >
        <div>
          <h1 className="text-2xl font-bold">OTP যাচাই করুন</h1>
          <p className="text-sm text-neutral-500 mt-1">
            আপনার ইমেইলে পাঠানো ৬ ডিজিটের কোডটি লিখুন।
          </p>
        </div>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">ইমেইল</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="otp">OTP কোড</Label>
          <Input
            id="otp"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-[0.5em] font-mono"
          />
        </div>
        <Button type="submit" disabled={loading || otp.length !== 6} className="w-full">
          {loading ? "যাচাই হচ্ছে…" : "যাচাই করুন"}
        </Button>
        <p className="text-sm text-center text-neutral-600">
          <Link to="/admin/signup" className="text-red-600 font-medium">
            পুনরায় সাইন আপ
          </Link>
        </p>
      </form>
    </div>
  );
}