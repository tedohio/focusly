"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    console.log('🔍 Auth callback called with code:', code ? 'present' : 'missing');
    
    if (!code) {
      console.error("No code found in URL");
      router.replace("/login?error=missing_code");
      return;
    }

    const supabase = createClientComponentClient();

    (async () => {
      console.log("🔄 Exchanging code for session...");
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("❌ exchangeCodeForSession error:", error);
        router.replace("/login?error=exchange_failed");
        return;
      }

      console.log("✅ Session exchange successful, redirecting to home...");
      // Success — user is signed in
      router.replace("/");
    })();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}