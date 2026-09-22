import React from 'react'

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: September 21, 2026
          </p>
          <div className="h-1 w-16 bg-primary rounded-full mt-4"></div>
        </div>

        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-8 text-foreground/90">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using CampusBridge ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Platform. We may modify these Terms at any time, and your continued use of the Platform after such modifications constitutes your acceptance of the updated Terms.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use certain features of the Platform, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3 ml-2">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain and promptly update your account information to keep it accurate.</li>
              <li>Maintain the security and confidentiality of your login credentials.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or harmful activity.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. User Roles</h2>
            <p className="text-muted-foreground leading-relaxed">
              CampusBridge supports multiple user roles including Students, Mentors, Alumni, and Administrators. Each role has specific privileges and responsibilities:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3 ml-2">
              <li><strong className="text-foreground">Students</strong> may browse content, connect with mentors, apply for jobs, and participate in events.</li>
              <li><strong className="text-foreground">Mentors</strong> may offer guidance, post content, manage mentees, and create sessions.</li>
              <li><strong className="text-foreground">Alumni</strong> may share experiences, post job opportunities, and network with current students.</li>
              <li><strong className="text-foreground">Administrators</strong> have elevated privileges to manage users, content, and platform settings.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Content Guidelines</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for any content you post, upload, or share on the Platform. You agree not to post content that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3 ml-2">
              <li>Is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.</li>
              <li>Infringes upon any intellectual property rights of any party.</li>
              <li>Contains software viruses or any other code designed to disrupt functionality.</li>
              <li>Is spam, unsolicited promotional materials, or commercial solicitation.</li>
              <li>Impersonates any person or entity, or falsely represents your affiliation.</li>
              <li>Contains personal or confidential information of others without their consent.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We reserve the right to remove any content that violates these guidelines without prior notice.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform and its original content (excluding user-generated content), features, and functionality are owned by CampusBridge and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of any content you create and post, but grant CampusBridge a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute such content on the Platform.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Mentorship Sessions</h2>
            <p className="text-muted-foreground leading-relaxed">
              CampusBridge facilitates connections between students and mentors but does not guarantee the quality, availability, or outcomes of mentorship sessions. Mentors are independent individuals and not employees of CampusBridge. Any advice or guidance provided through the Platform is the sole responsibility of the mentor providing it.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Job Listings & Events</h2>
            <p className="text-muted-foreground leading-relaxed">
              Job listings and events posted on CampusBridge are provided by third-party companies and users. CampusBridge does not guarantee the accuracy, legitimacy, or safety of any job listing or event. Users are advised to exercise due diligence before applying to jobs or attending events listed on the Platform.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by applicable law, CampusBridge and its affiliates, officers, employees, agents, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, or goodwill, arising out of or related to your use of the Platform.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and access to the Platform immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. Upon termination, your right to use the Platform will cease immediately. All provisions of these Terms which by their nature should survive termination shall survive.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in India.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use the Platform after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 p-4 bg-muted/30 border border-border/50 rounded-xl">
              <p className="text-sm font-semibold text-foreground">CampusBridge Support</p>
              <p className="text-sm text-muted-foreground mt-1">Email: support@campusbridge.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
