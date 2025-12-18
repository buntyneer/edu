import React from "react";
import { useNavigate } from "react-router-dom";
import GoogleSignIn from "./GoogleSignIn";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Edumanege</h1>
        <p className="text-slate-600 mb-6">Sign in with Google to continue</p>

        {/* GoogleSignIn component handles full Google → Firebase → backend JWT flow */}
        <GoogleSignIn />
      </div>
    </div>
  );
}