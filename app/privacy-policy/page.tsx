import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - T3 Chat',
  description: 'Privacy Policy for T3 Chat',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Navigation */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">T3 Chat</h1>
          <nav className="flex gap-6 text-sm">
            <Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="text-primary hover:text-primary/80 font-medium">
              Privacy Policy
            </Link>
            <Link href="/security-policy" className="text-muted-foreground hover:text-foreground">
              Security Policy
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-2xl font-bold text-foreground mb-6">T3 CHAT PRIVACY POLICY</h1>
          <div className="text-muted-foreground mb-8">
            <p>Last Updated: 2025-05-31</p>
            <p>Effective Date: 2025-05-31</p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-foreground leading-relaxed">
              This privacy policy ("Policy") describes how T3 Tools, Inc. ("Company", "T3 Tools", "we", "us") collects, uses, and shares personal information of consumer users of this website, T3 Chat https://t3.chat (the "Site"), as well as associated products and services, including UploadThing (together, the "Services"), and applies to personal information that we collect through the Site and our Services as well as personal information you provide to us directly. This Policy also applies to any of our other websites and Services that post this Policy. Please note that by using the Site or the Services, you accept the practices and policies described in this Policy and you consent that we will collect, use, and share your personal information as described below. If you do not agree to this Policy, please do not use the Site or the Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Personal Information We Collect</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We collect personal information about you in a number of different ways. Our products, T3 Chat and UploadThing, collect different personal information:
            </p>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Personal Information From Users Of T3 Chat:</h3>
              <p className="text-foreground leading-relaxed mb-2">When you use our T3 Chat product, we collect the following personal information from you:</p>
              <ul className="list-disc pl-6 text-foreground space-y-1">
                <li>User content, such as your prompts to the T3 Chat product and other content you upload to the product, including PDF files, images and text files.</li>
                <li>Information you provide to us, such as feedback on the product.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Personal Information From Users Of UploadThing:</h3>
              <p className="text-foreground leading-relaxed mb-2">When you use our UploadThing product, we collect the following personal information from you:</p>
              <ul className="list-disc pl-6 text-foreground space-y-1">
                <li>User content, such as files that you upload to the UploadThing product.</li>
                <li>User information, such as usernames and passwords of users of your account.</li>
                <li>Information you provide to us, such as feedback on the product.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Personal Information From Users Of Our Websites Generally:</h3>
              <p className="text-foreground leading-relaxed mb-2">When you use our Services, including our website, T3 Chat and UploadThing, we collect personal information that you provide to us, which may include the following categories of personal information depending on how you use our Services and communicate with us:</p>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li><strong>General identifiers:</strong> such as your full name, email address and Google Account ID.</li>
                <li><strong>Online identifiers:</strong> such as your username and passwords for any of our Sites, or information we automatically collect through cookies and similar technologies used on our websites.</li>
                <li><strong>Protected classification characteristics:</strong> that you choose to provide to us in communications with us or the Services.</li>
                <li><strong>Commercial information:</strong> such as the billing details we use to bill you for our Services.</li>
                <li><strong>Audio, electronic, and visual information:</strong> that we collect in connection with providing our Services to you.</li>
                <li><strong>Professional or employment-related information:</strong> that we collect in connection with providing our Services to you.</li>
                <li><strong>Other information you provide to us.</strong></li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Personal Information We Get From Others:</h3>
              <p className="text-foreground leading-relaxed">We may collect personal information about you from other sources. We may add this to information we collect from this Site and through our Services.</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Information We Collect Automatically:</h3>
              <p className="text-foreground leading-relaxed">We automatically log information about you and your computer, phone, tablet, or other devices you use to access the Site and Services. For example, when visiting our Site or the Services, we may log your computer or device identification, operating system type, browser type, browser language, the website you visited before browsing to our Site or the Services, pages you viewed, how long you spent on a page, access times and information about your use of and actions on our Site or the Services.</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Cookies:</h3>
              <p className="text-foreground leading-relaxed">We may log information using "cookies." Cookies are small data files stored on your hard drive by a website. We may use both session Cookies (which expire once you close your web browser) and persistent Cookies (which stay on your computer until you delete them) to provide you with a more personal and interactive experience on our Site.</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Analytics Information:</h3>
              <p className="text-foreground leading-relaxed">We may use analytics tools to help analyze how users use the Site and the Services. These analytics services use Cookies to collect information such as how often users visit the Site or use the Services, what pages they visit, file types uploaded, storage utilization, volume of messages and what other sites they used prior to coming to the Site.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. How We Use Your Personal Information</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Subject to this Privacy Policy, our terms of use, and applicable terms and conditions of third-party applications, all data transmitted through the Site and the Services is owned by T3 Chat. Generally, we may use information in the following ways and as otherwise described in this Privacy Policy:
            </p>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">To Provide the Services and Personalize Your Experience:</h3>
              <p className="text-foreground leading-relaxed mb-2">We use personal information about you to provide the Services to you, including:</p>
              <ul className="list-disc pl-6 text-foreground space-y-1">
                <li>To help establish and verify your identity;</li>
                <li>For the purposes for which you specifically provided it to us;</li>
                <li>To provide you with effective customer service;</li>
                <li>To provide you with a personalized experience when you use the Site;</li>
                <li>To send you information about your relationship or transactions with us;</li>
                <li>To otherwise contact you with information that we believe will be of interest to you;</li>
                <li>To enhance or develop features, products or services.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Research and Development:</h3>
              <p className="text-foreground leading-relaxed">We may use your general identifiers, online identifiers, internet activity information and commercial information for research and development purposes, including to analyze and improve the Services, our Sites and our business.</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Training of AI Models:</h3>
              <p className="text-foreground leading-relaxed font-semibold">We do not use your personal information to train AI models.</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Marketing:</h3>
              <p className="text-foreground leading-relaxed">We may use your general identifiers, online identifiers, internet activity information and commercial information in connection with sending you marketing communications as permitted by law, including by mail and email. You may opt-out of marketing communications by following the unsubscribe instructions in marketing emails, or by emailing us at support@t3.chat.</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Compliance and Protection:</h3>
              <p className="text-foreground leading-relaxed mb-2">We may use any of the categories of personal information described above to:</p>
              <ul className="list-disc pl-6 text-foreground space-y-1">
                <li>Comply with applicable laws, lawful requests, and legal process;</li>
                <li>Protect our, your and others' rights, privacy, safety and property;</li>
                <li>Audit our internal processes for compliance with legal and contractual requirements;</li>
                <li>Enforce the terms and conditions that govern the Site and our Services;</li>
                <li>Prevent, identify, investigate and deter fraudulent, harmful, unauthorized, unethical or illegal activity.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. How We Share Your Personal Information</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We may disclose all categories of personal information described above with the following categories of third parties:
            </p>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Third Party Service Providers:</h3>
              <p className="text-foreground leading-relaxed mb-3">We may provide your personal information to third-party service providers that help us provide you with the Services that we offer through the Site or otherwise, and to operate our business. Our third-party service providers include:</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground">Microsoft Azure</h4>
                  <p className="text-foreground text-sm">We use Microsoft Azure to help us with web hosting.</p>
                  <p className="text-foreground text-sm">Privacy statement: <a href="https://www.microsoft.com/en-us/privacy/privacystatement" className="text-primary hover:text-primary/80">https://www.microsoft.com/en-us/privacy/privacystatement</a></p>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground">Amazon Web Services</h4>
                  <p className="text-foreground text-sm">We use Amazon Web Services ("AWS") to help us with web hosting.</p>
                  <p className="text-foreground text-sm">Privacy notice: <a href="https://aws.amazon.com/privacy/" className="text-primary hover:text-primary/80">https://aws.amazon.com/privacy/</a></p>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground">Vercel</h4>
                  <p className="text-foreground text-sm">We use Vercel to help us with web hosting, deployment, and content delivery network (CDN) services.</p>
                  <p className="text-foreground text-sm">Privacy policy: <a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:text-primary/80">https://vercel.com/legal/privacy-policy</a></p>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground">OpenAI</h4>
                  <p className="text-foreground text-sm">We use OpenAI to provide AI and chatbot technology and functionality.</p>
                  <p className="text-foreground text-sm">Privacy policy: <a href="https://openai.com/policies/privacy-policy/" className="text-primary hover:text-primary/80">https://openai.com/policies/privacy-policy/</a></p>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground">Google Gemini</h4>
                  <p className="text-foreground text-sm">We use Google Gemini to provide AI and chatbot technology and functionality.</p>
                  <p className="text-foreground text-sm">Privacy policy: <a href="https://policies.google.com/privacy" className="text-primary hover:text-primary/80">https://policies.google.com/privacy</a></p>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground">Anthropic Claude</h4>
                  <p className="text-foreground text-sm">We use Anthropic Claude to provide AI and chatbot technology and functionality.</p>
                  <p className="text-foreground text-sm">Privacy policy: <a href="https://www.anthropic.com/legal/privacy" className="text-primary hover:text-primary/80">https://www.anthropic.com/legal/privacy</a></p>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground">OpenRouter</h4>
                  <p className="text-foreground text-sm">We use OpenRouter to provide AI and chatbot technology and functionality.</p>
                  <p className="text-foreground text-sm">Privacy policy: <a href="https://openrouter.ai/privacy" className="text-primary hover:text-primary/80">https://openrouter.ai/privacy</a></p>
                </div>
              </div>
            </div>

            <p className="text-foreground leading-relaxed font-semibold mb-4">We do not sell your personal information.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Your Choices Regarding Your Personal Information</h2>
            <p className="text-foreground leading-relaxed mb-4">You have several choices regarding the use of your personal information on the Site and our Services:</p>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Email Communications:</h3>
              <p className="text-foreground leading-relaxed">We may periodically send you free newsletters and e-mails that directly promote the use of our Site or Services. When you receive newsletters or promotional communications from us, you may indicate a preference to stop receiving further communications from us and you will have the opportunity to "opt-out" by following the unsubscribe instructions provided in the e-mail you receive or by contacting us directly.</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-3">Cookies:</h3>
              <p className="text-foreground leading-relaxed">If you decide at any time that you no longer wish to accept cookies from our Site for any of the purposes described above, then you can instruct your browser, by changing its settings, to stop accepting cookies or to prompt you before accepting a cookie from the websites you visit.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Security Of Your Personal Information</h2>
            <p className="text-foreground leading-relaxed">
              T3 Tools is committed to protecting the security of your personal information. We use a variety of security technologies and procedures to help protect your personal information from unauthorized access, use, or disclosure. No method of transmission over the internet, or method of electronic storage, is 100% secure, however. Therefore, while we use reasonable efforts to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Children</h2>
            <p className="text-foreground leading-relaxed">
              Our Site and the Services are not intended for children under 13 years of age, and you must be at least 13 years old to have our permission to use the Site or the Services. We do not knowingly collect, use, or disclose personally identifiable information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Contact Us</h2>
            <p className="text-foreground leading-relaxed mb-4">Our contact information is as follows:</p>
            <div className="text-foreground leading-relaxed">
              <p>T3 Tools, Inc.</p>
              <p>2261 Market Street #5309</p>
              <p>San Francisco, CA 94114</p>
              <p className="mt-2">Email: privacy@t3.chat</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 