import { Link, useNavigate } from "@/admin/navigation";

import { useState, type FormEvent } from "react";
import { authApi, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default SignupPage;

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setTimedOut(false);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    try {
      await authApi.signup(email.trim(), password, controller.signal);
      navigate({ to: "/admin/verify-otp", search: { email: email.trim() } });
    } catch (err) {
      if (controller.signal.aborted) {
        setTimedOut(true);
        setError(
          "সার্ভার ৩০ সেকেন্ডের মধ্যে উত্তর দেয়নি। ইমেইলে OTP এসেছে কি না দেখুন। না এলে কিছুক্ষণ পর আবার চেষ্টা করুন।",
        );
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "সার্ভারের সঙ্গে সংযোগ করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
        );
      }
    } finally {
      window.clearTimeout(timeout);
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
          <h1 className="text-2xl font-bold">অ্যাকাউন্ট তৈরি করুন</h1>
          <p className="text-sm text-neutral-500 mt-1">
            অ্যাকাউন্ট তৈরি করুন। যাচাইয়ের জন্য ইমেইলে OTP পাঠানো হবে।
          </p>
        </div>
        {error && (
          <div
            role="alert"
            className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded"
          >
            {error}
            {timedOut && (
              <Link
                to="/admin/verify-otp"
                search={{ email: email.trim() }}
                className="mt-2 block font-semibold underline"
              >
                OTP পেয়েছেন? যাচাই করুন
              </Link>
            )}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">ইমেইল</Label>
          <Input
            id="email"
            type="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">পাসওয়ার্ড</Label>
          <Input
            id="password"
            type="password"
            required
            disabled={loading}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "পাঠানো হচ্ছে…" : "সাইন আপ করুন"}
        </Button>
        <p className="text-sm text-center text-neutral-600">
          আগে থেকেই অ্যাকাউন্ট আছে?{" "}
          <Link to="/admin/login" className="text-red-600 font-medium">
            লগ ইন
          </Link>
        </p>
      </form>
    </div>
  );
}
