import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium hover:underline" style={{ color: "#EF6418" }}>
            Create one
          </Link>
        </>
      }
    >
      {/* Google Button */}
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full h-12 flex items-center justify-center gap-3 rounded-lg text-sm font-medium text-white mb-6 transition-colors hover:bg-white/10"
        style={{ background: "#1a1a1a", border: "1px solid #3a3a3a" }}
      >
        <GoogleIcon className="w-5 h-5" />
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: "#3a3a3a" }} />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-3 text-gray-500" style={{ background: "#232323" }}>OR</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-white text-sm">Email</Label>
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
              style={{ background: "#1a1a1a", border: "1.5px solid #EF6418", borderRadius: "8px", outline: "none" }}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white text-sm">Password</Label>
            <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-[#EF6418] transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 text-white placeholder:text-gray-600"
              style={{ background: "#1a1a1a", border: "1px solid #3a3a3a", borderRadius: "8px" }}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-lg font-semibold text-white text-sm transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: "#EF6418", boxShadow: "0 4px 20px rgba(239,100,24,0.4)" }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}