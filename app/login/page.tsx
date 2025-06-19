import React from "react";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#181419] to-[#231b20]">
      <div className="absolute top-4 left-4">
        <Link href="/home" className="text-sm text-white/70 hover:underline">&larr; Back to Chat</Link>
      </div>
      <div className="flex flex-col items-center justify-center w-full max-w-md p-8 rounded-2xl shadow-lg bg-[#1a151a]/80 border border-[#2d232a]">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to <span className="text-pink-400">T3.chat</span></h1>
        <p className="text-white/70 mb-6 text-center text-sm">Sign in below (we&apos;ll increase your message limits if you do <span className="">😉</span>)</p>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-gradient-to-r from-[#3a223a] to-[#4a234a] hover:from-[#4a234a] hover:to-[#3a223a] text-white font-semibold text-base shadow transition",
              card: "bg-transparent shadow-none",
              headerTitle: "text-white",
              headerSubtitle: "text-white/70",
              socialButtonsBlockButton: "bg-gradient-to-r from-[#3a223a] to-[#4a234a] hover:from-[#4a234a] hover:to-[#3a223a] text-white font-semibold text-base shadow transition",
              socialButtonsBlockButtonText: "text-white",
              formFieldLabel: "text-white",
              formFieldInput: "bg-[#2d232a] border-[#3a223a] text-white",
              footerActionLink: "text-pink-400 hover:text-pink-300",
            },
          }}
        />
        <div className="text-xs text-white/50 mt-2 text-center">
          By continuing, you agree to our{' '}
          <Link href="/terms-of-service" className="underline hover:text-white">Terms of Service</Link> and{' '}
          <Link href="/privacy-policy" className="underline hover:text-white">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
} 