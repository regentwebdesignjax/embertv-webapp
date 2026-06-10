import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="We'll send you a link to reset it"
      footer={
        <Link to="/login" className="font-medium hover:underline flex items-center justify-center gap-1" style={{ color: "#EF6418" }}>
          <ArrowLeft className="w-3 h-3" />Back to log in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-gray-400 text-center">
          If an account exists with that email, you'll receive a password reset link shortly.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white text-sm">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 text-white placeholder:text-gray-600"
                style={{ background: "#1a1a1a", border: "1.5px solid #EF6418", borderRadius: "8px" }}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg font-semibold text-white text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#EF6418", boxShadow: "0 4px 20px rgba(239,100,24,0.4)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}