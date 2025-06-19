import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-6 py-8">
        {/* Header Navigation */}
        <div className="mb-8 flex items-center gap-4">
          <Link 
            href="/home" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="mb-8 flex flex-wrap gap-4 text-sm">
          <Link href="/terms-of-service" className="text-primary hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          <span className="font-medium">Security Policy</span>
        </div>

        {/* Main Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-6">T3 CHAT SECURITY POLICY</h1>
          <p className="text-muted-foreground mb-8">Last Updated: 2025-02-14</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              T3 Chat is committed to ensuring the security of our users' data and our platform. This security policy outlines our practices and procedures for maintaining security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Reporting Security Issues</h2>
            <p className="mb-4">
              We welcome security researchers, ethical hackers, and technology enthusiasts to participate in our responsible disclosure program. We provide safe harbor for security testing conducted in good faith and may offer rewards for vulnerability discoveries based on severity and potential impact.
            </p>
            <p className="mb-4">
              If you discover a security vulnerability, please report it immediately to{' '}
              <a href="mailto:security@ping.gg" className="text-primary hover:underline">
                security@ping.gg
              </a>
              . Include:
            </p>
            <ul className="mb-4 space-y-2">
              <li>A detailed description of the vulnerability</li>
              <li>Clear steps to reproduce the issue</li>
              <li>Any relevant screenshots, logs, or proof-of-concept code</li>
              <li>Potential impact assessment</li>
              <li>Your contact information for follow-up</li>
            </ul>
            <p className="mb-4">We commit to:</p>
            <ul className="mb-4 space-y-2">
              <li>Acknowledging receipt within 1 business day</li>
              <li>Working with you to validate and resolve the issue</li>
              <li>Giving appropriate credit if desired</li>
            </ul>
            <p className="mb-4">
              We value the security community's contributions in keeping T3 Chat secure. All legitimate reports will be thoroughly investigated and addressed with appropriate urgency.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Our Security Practices</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">3.1. Data Protection</h3>
              <ul className="space-y-2">
                <li>All data is encrypted in transit using TLS</li>
                <li>We collect only essential user information, adhering to data minimization principles</li>
                <li>User data is stored securely with appropriate access controls</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">3.2. Authentication</h3>
              <ul className="space-y-2">
                <li>Industry-standard authentication protocols</li>
                <li>Multi-factor authentication support</li>
                <li>Secure session management</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">3.3. Infrastructure</h3>
              <ul className="space-y-2">
                <li>Regular security audits and assessments</li>
                <li>Regular security updates and patches</li>
                <li>Monitoring for suspicious activities</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
            <p className="mb-4">To help maintain the security of your account:</p>
            <ul className="space-y-2">
              <li>Use secure authentication providers you trust</li>
              <li>Keep your OAuth provider account secure with strong passwords and two-factor authentication</li>
              <li>Never share access to your authorized T3 Chat sessions</li>
              <li>Report suspicious activities immediately</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Updates to This Policy</h2>
            <p>
              We may update this Security Policy from time to time. When we do, we will revise the "Last Updated" date at the top of this page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 