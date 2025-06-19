"use client";

import React from "react";
import Link from "next/link";
import { SignIn, SignOutButton, useUser } from "@clerk/nextjs";

export default function LoginPage() {
  const { user, isSignedIn } = useUser();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#181419] to-[#231b20]">
      <div className="absolute top-4 left-4">
        <Link href="/home" className="text-sm text-white/70 hover:underline">&larr; Back to Chat</Link>
      </div>
      <div className="flex flex-col items-center justify-center w-full max-w-md p-8 rounded-2xl shadow-lg bg-[#1a151a]/80 border border-[#2d232a]">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to <span className="text-pink-400">T3.chat</span></h1>
        
        {isSignedIn ? (
          <>
            <p className="text-white/70 mb-6 text-center text-sm">
              Welcome back, <span className="text-pink-400">{user?.firstName || user?.emailAddresses?.[0]?.emailAddress}</span>!
            </p>
            <div className="flex flex-col items-center space-y-4">
              <Link 
                href="/home" 
                className="bg-gradient-to-r from-[#3a223a] to-[#4a234a] hover:from-[#4a234a] hover:to-[#3a223a] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg"
              >
                Go to Chat
              </Link>
              <SignOutButton>
                <button className="bg-[#2d232a] hover:bg-[#3a223a] border border-[#4a234a] text-white font-medium px-6 py-2 rounded-lg transition-all duration-200">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </>
        ) : (
          <>
            <p className="text-white/70 mb-6 text-center text-sm">Sign in below (we&apos;ll increase your message limits if you do <span className="">😉</span>)</p>
            
            {/* Custom CSS for Clerk styling */}
            <style jsx>{`
              :global(.cl-socialButtonsBlockButton) {
                background-color: #2d232a !important;
                border: 2px solid #e879f9 !important;
                color: white !important;
                font-weight: 600 !important;
              }
              :global(.cl-socialButtonsBlockButton:hover) {
                background-color: #3a223a !important;
                border-color: #f0abfc !important;
              }
              :global(.cl-socialButtonsBlockButtonText) {
                color: white !important;
                font-weight: 600 !important;
              }
              :global(.cl-socialButtonsBlockButtonArrow) {
                color: white !important;
              }
              :global(.cl-socialButtonsProviderIcon) {
                filter: brightness(0) invert(1) !important;
              }
              
              /* Hide all possible Clerk footer elements */
              :global(.cl-footer) {
                display: none !important;
              }
              :global(.cl-footerActionLink) {
                display: none !important;
              }
              :global(.cl-footerActionText) {
                display: none !important;
              }
              :global(.cl-internal-b3fm6y) {
                display: none !important;
              }
              :global([data-localization-key="signIn.start.footer"]) {
                display: none !important;
              }
              :global(.cl-formFooter) {
                display: none !important;
              }
              :global(.cl-signIn-footer) {
                display: none !important;
              }
              :global(.cl-component .cl-footer) {
                display: none !important;
              }
              :global(.cl-card .cl-footer) {
                display: none !important;
              }
              /* Target any element containing "Secured by Clerk" */
              :global([aria-label*="Secured by Clerk"]) {
                display: none !important;
              }
              :global(*:contains("Secured by Clerk")) {
                display: none !important;
              }
            `}</style>
            
            <SignIn 
              redirectUrl="/home"
              afterSignInUrl="/home"
              appearance={{
                elements: {
                  // Main card styling
                  card: "bg-transparent shadow-none border-none",
                  
                  // Header styling
                  headerTitle: "text-white text-xl font-semibold",
                  headerSubtitle: "text-white/70 text-sm",
                  
                  // Form styling
                  formButtonPrimary: 
                    "bg-gradient-to-r from-[#3a223a] to-[#4a234a] hover:from-[#4a234a] hover:to-[#3a223a] text-white font-semibold text-base shadow-lg transition-all duration-200 border-none",
                  
                  // Input fields
                  formFieldLabel: "text-white font-medium",
                  formFieldInput: "bg-[#2d232a] border-[#3a223a] text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-1 focus:ring-pink-400",
                  
                  // Social buttons - using custom CSS above for better control
                  socialButtonsBlockButton: "!bg-[#2d232a] !border-2 !border-pink-400 !text-white !font-semibold",
                  socialButtonsBlockButtonText: "!text-white !font-semibold",
                  socialButtonsBlockButtonArrow: "!text-white",
                  
                  // Links and footer
                  identityPreviewText: "text-white/70",
                  identityPreviewEditButton: "text-pink-400 hover:text-pink-300",
                  
                  // Form field wrapper
                  formFieldRow: "space-y-2",
                  
                  // Alternative methods
                  alternativeMethodsBlockButton: "!bg-[#2d232a] !border-2 !border-pink-400 !text-white !font-semibold",
                  alternativeMethodsBlockButtonText: "!text-white !font-semibold",
                  
                  // Divider
                  dividerLine: "bg-[#4a234a]",
                  dividerText: "text-white/70 font-medium",
                  
                  // Form messages
                  formFieldErrorText: "text-red-400",
                  formFieldSuccessText: "text-green-400",
                  
                  // Loading spinner
                  spinner: "text-pink-400",
                  
                  // OTP input
                  formFieldInputShowPasswordButton: "text-white/70 hover:text-white",
                  
                  // Footer styling - hide it completely
                  footer: "hidden",
                  footerActionLink: "hidden",
                  footerActionText: "hidden",
                },
                variables: {
                  colorPrimary: "#e879f9",
                  colorBackground: "transparent",
                  colorInputBackground: "#2d232a",
                  colorInputText: "#ffffff",
                  colorText: "#ffffff",
                  colorTextSecondary: "#ffffff70",
                  colorNeutral: "#e879f9",
                  borderRadius: "0.5rem",
                }
              }}
            />
          </>
        )}
        
        <div className="text-xs text-white/50 mt-2 text-center">
          By continuing, you agree to our{' '}
          <Link href="/terms-of-service" className="underline hover:text-white">Terms of Service</Link> and{' '}
          <Link href="/privacy-policy" className="underline hover:text-white">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
} 