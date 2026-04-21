import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }

    // Auth state change in App.tsx will handle the redirect
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-gray-100 px-10 py-12">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#e8f0eb] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-[#4a8c6a]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Our Home</h1>
          <p className="text-gray-400 text-sm">Sign in to your shared planner</p>
        </div>

        {/* Form */}
        <div className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-[#fafaf8] text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(e as unknown as React.MouseEvent<HTMLButtonElement>); }}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-[#fafaf8] text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-[#4a8c6a] hover:bg-[#3d7a5b] active:bg-[#346850] text-white font-medium text-sm transition-colors duration-150 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in…
              </>
            ) : "Sign In"}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-[#4a8c6a] hover:underline font-medium">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
}
