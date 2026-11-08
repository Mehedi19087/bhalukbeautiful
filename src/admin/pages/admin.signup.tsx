import { Link } from "@/admin/navigation";

import { useState, type FormEvent } from "react";
import { authApi, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default SignupPage;

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"EDITOR" | "REPORTER" | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || !role) return;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    try {
      await authApi.signupStaff(email.trim(), password, role, controller.signal);
      setPassword("");
      setSubmitted(true);
    } catch (err) {
      if (controller.signal.aborted) {
        setError(
          "সার্ভার ৩০ সেকেন্ডের মধ্যে উত্তর দেয়নি। আবেদন জমা হয়ে থাকতে পারে। পোর্টালের মালিকের সঙ্গে যোগাযোগ করুন।",
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

  if (submitted) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg border p-8 shadow-sm space-y-5">
          <h1 className="text-2xl font-bold">আবেদন জমা হয়েছে</h1>
          <p role="status" className="text-sm text-neutral-600">
            আপনার অ্যাকাউন্ট পোর্টালের মালিকের অনুমোদনের অপেক্ষায় আছে। অনুমোদনের পর ইমেইল ও পাসওয়ার্ড দিয়ে লগ ইন করুন।
          </p>
          <Link to="/admin/login" className="block text-red-600 font-medium">লগ ইন পাতায় যান</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-lg border p-8 shadow-sm space-y-5"
      >
        <div>
          <h1 className="text-2xl font-bold">অ্যাকাউন্ট তৈরি করুন</h1>
          <p className="text-sm text-neutral-500 mt-1">
            এই পোর্টালে সম্পাদক বা রিপোর্টার হিসেবে আবেদন করুন। পোর্টালের মালিক অনুমোদন দিলে লগ ইন করতে পারবেন।
          </p>
        </div>
        {error && (
          <div
            role="alert"
            className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded"
          >
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">ইমেইল</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            maxLength={150}
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
            autoComplete="new-password"
            required
            disabled={loading}
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">রোল</Label>
          <select
            id="role"
            required
            disabled={loading}
            value={role}
            onChange={(e) => setRole(e.target.value as "EDITOR" | "REPORTER" | "")}
            className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="" disabled>রোল নির্বাচন করুন</option>
            <option value="EDITOR">সম্পাদক</option>
            <option value="REPORTER">রিপোর্টার</option>
          </select>
        </div>
        <Button type="submit" disabled={loading || !role} className="w-full">
          {loading ? "পাঠানো হচ্ছে…" : "আবেদন জমা দিন"}
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
