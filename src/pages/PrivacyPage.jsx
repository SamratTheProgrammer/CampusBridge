import React from 'react'

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: September 21, 2026
          </p>
          <div className="h-1 w-16 bg-primary rounded-full mt-4"></div>
        </div>

        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-8 text-foreground/90">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              CampusBridge ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Platform.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect information that you provide directly to us, as well as information that is automatically collected when you use the Platform:
            </p>

            <h3 className="text-base font-semibold text-foreground mb-2">2.1 Personal Information</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2 mb-4">
              <li>Name, email address, and profile picture (via Clerk authentication)</li>
              <li>Educational background, skills, and professional experience</li>
              <li>Bio, headline, and other profile details you choose to provide</li>
              <li>Messages and communication content within the Platform</li>
            </ul>

            <h3 className="text-base font-semibold text-foreground mb-2">2.2 Usage Data</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2 mb-4">
              <li>Device information (browser type, operating system, device type)</li>
              <li>IP address and approximate location</li>
              <li>Pages visited, features used, and actions taken on the Platform</li>
              <li>Date and time of your visits and interactions</li>
            </ul>

            <h3 className="text-base font-semibold text-foreground mb-2">2.3 Cookies & Tracking</h3>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to track activity on the Platform and store certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>To provide, maintain, and improve the Platform and its features.</li>
              <li>To manage your account and facilitate your user experience.</li>
              <li>To connect students with mentors, alumni, and job opportunities.</li>
              <li>To send notifications about posts, comments, connections, and events.</li>
              <li>To process mentorship session bookings and facilitate communications.</li>
              <li>To detect, prevent, and address technical issues and security threats.</li>
              <li>To analyze usage patterns and improve the Platform's performance.</li>
              <li>To comply with legal obligations and enforce our Terms of Service.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Data Sharing & Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell your personal information to third parties. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li><strong className="text-foreground">With Other Users:</strong> Your public profile information (name, profile picture, headline, bio) is visible to other users of the Platform as part of the networking and mentorship experience.</li>
              <li><strong className="text-foreground">Service Providers:</strong> We may share information with third-party service providers that perform services on our behalf (e.g., Clerk for authentication, Cloudinary for media storage, MongoDB for database).</li>
              <li><strong className="text-foreground">Legal Requirements:</strong> We may disclose your information if required by law, regulation, legal process, or governmental request.</li>
              <li><strong className="text-foreground">Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include encryption, access controls, and regular security assessments. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li><strong className="text-foreground">Access:</strong> You have the right to request a copy of the personal data we hold about you.</li>
              <li><strong className="text-foreground">Rectification:</strong> You can update or correct your profile information at any time through your account settings.</li>
              <li><strong className="text-foreground">Deletion:</strong> You may request the deletion of your personal data. Note that we may retain certain information as required by law.</li>
              <li><strong className="text-foreground">Data Portability:</strong> You may request to receive your data in a structured, commonly used, and machine-readable format.</li>
              <li><strong className="text-foreground">Objection:</strong> You may object to the processing of your personal data for certain purposes.</li>
              <li><strong className="text-foreground">Withdraw Consent:</strong> Where processing is based on consent, you may withdraw your consent at any time.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. We may also retain and use your information to comply with our legal obligations, resolve disputes, and enforce our agreements. When your account is deleted, we will delete or anonymize your personal data within 30 days, except where retention is required by law.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              The Platform may integrate with or contain links to third-party services. These services have their own privacy policies, and we encourage you to review them. Third-party services we use include:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="p-3 bg-muted/30 border border-border/50 rounded-xl">
                <p className="text-sm font-semibold text-foreground">Clerk</p>
                <p className="text-xs text-muted-foreground mt-1">Authentication & user management</p>
              </div>
              <div className="p-3 bg-muted/30 border border-border/50 rounded-xl">
                <p className="text-sm font-semibold text-foreground">Cloudinary</p>
                <p className="text-xs text-muted-foreground mt-1">Media file storage & optimization</p>
              </div>
              <div className="p-3 bg-muted/30 border border-border/50 rounded-xl">
                <p className="text-sm font-semibold text-foreground">MongoDB</p>
                <p className="text-xs text-muted-foreground mt-1">Database storage</p>
              </div>
              <div className="p-3 bg-muted/30 border border-border/50 rounded-xl">
                <p className="text-sm font-semibold text-foreground">Socket.io</p>
                <p className="text-xs text-muted-foreground mt-1">Real-time communication</p>
              </div>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes are effective when they are posted on this page.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or wish to exercise your rights regarding your personal data, please contact us at:
            </p>
            <div className="mt-3 p-4 bg-muted/30 border border-border/50 rounded-xl">
              <p className="text-sm font-semibold text-foreground">CampusBridge Privacy Team</p>
              <p className="text-sm text-muted-foreground mt-1">Email: privacy@campusbridge.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPage
