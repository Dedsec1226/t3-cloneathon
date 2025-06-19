"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, LogIn } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AccountPage() {
  const { user, isLoaded } = useUser();

  const handleCopyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast.success('User ID copied to clipboard');
    }
  };

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show sign in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <LogIn className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Sign in required</h2>
          <p className="text-muted-foreground max-w-md">
            Please sign in to view your account information, manage your settings, and access premium features.
          </p>
        </div>
        <Link 
          href="/login"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Message Usage (Mobile Only) */}
      <div className="space-y-6 rounded-lg bg-card p-4 md:hidden">
        <div className="flex flex-row justify-between sm:flex-col sm:justify-between lg:flex-row lg:items-center">
          <span className="text-sm font-semibold">Message Usage</span>
          <div className="text-xs text-muted-foreground">
            <p>Open source - unlimited usage</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">All Models</h3>
              <span className="text-sm text-muted-foreground">∞</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: '100%' }}></div>
            </div>
            <p className="text-sm text-muted-foreground">Unlimited access to all AI models</p>
          </div>
        </div>
      </div>

      {/* Open Source Benefits */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="text-center text-2xl font-bold md:text-left">Open Source Benefits</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col items-start rounded-lg border border-secondary/40 bg-card/30 px-6 py-4">
            <div className="mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rocket mr-2 h-5 w-5 text-primary">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
              </svg>
              <span className="text-base font-semibold">Access to All Models</span>
            </div>
            <p className="text-sm text-muted-foreground/80">Get access to our full suite of models including Claude, o3-mini, GPT-4, and more - completely free!</p>
          </div>
          <div className="flex flex-col items-start rounded-lg border border-secondary/40 bg-card/30 px-6 py-4">
            <div className="mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles mr-2 h-5 w-5 text-primary">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                <path d="M20 3v4"></path>
                <path d="M22 5h-4"></path>
                <path d="M4 17v2"></path>
                <path d="M5 18H3"></path>
              </svg>
              <span className="text-base font-semibold">Unlimited Usage</span>
            </div>
            <p className="text-sm text-muted-foreground/80">Enjoy <b>unlimited conversations</b> and <b>unlimited model access</b> with your own API keys.</p>
          </div>
          <div className="flex flex-col items-start rounded-lg border border-secondary/40 bg-card/30 px-6 py-4">
            <div className="mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-headset mr-2 h-5 w-5 text-primary">
                <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"></path>
                <path d="M21 16v2a4 4 0 0 1-4 4h-5"></path>
              </svg>
              <span className="text-base font-semibold">Community Support</span>
            </div>
            <p className="text-sm text-muted-foreground/80">Join our open source community for support, contribute code, and help shape the future of T3 Chat!</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-pink-600/90 disabled:hover:bg-primary h-9 px-4 py-2 w-full md:w-64">
            View on GitHub
          </button>
        </div>
        <p className="text-sm text-muted-foreground/60">
          <span className="mx-0.5 text-base font-medium">*</span>T3 Chat is completely free and open source. Use your own API keys for unlimited access to premium models like GPT-4, Claude, and Gemini.
        </p>
      </div>

      {/* Support Information (Mobile Only) */}
      <div className="mt-8 block md:hidden">
        <div className="w-fit space-y-2">
          <h2 className="text-2xl font-bold">Support Information</h2>
          <div className="space-y-2">
            <p className="px-px py-1.5 text-sm text-muted-foreground/80">
              Your user ID may be requested by our support team to help resolve issues.
            </p>
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleCopyUserId}
            >
              <span>Copy User ID</span>
              <Copy className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 