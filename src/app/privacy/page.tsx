export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-gray max-w-none">
            <h2>1. Information We Collect</h2>
            <p>
              When you sign up for access to our application, we collect the
              following information:
            </p>
            <ul>
              <li>Your name</li>
              <li>Your Gmail email address</li>
              <li>Information from your Google account (when you sign in)</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and maintain our service</li>
              <li>Authenticate your access to the application</li>
              <li>Communicate with you about your account</li>
              <li>Improve our application and user experience</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal
              information to third parties. This does not include trusted third
              parties who assist us in operating our application, conducting our
              business, or servicing you, so long as those parties agree to keep
              this information confidential.
            </p>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your
              personal information against unauthorized access, alteration,
              disclosure, or destruction. However, no method of transmission
              over the Internet or electronic storage is 100% secure.
            </p>

            <h2>5. Google OAuth</h2>
            <p>
              This application uses Google OAuth for authentication. By signing
              in with Google, you agree to Google&apos;s Privacy Policy and
              Terms of Service. We only access the basic profile information
              necessary for authentication.
            </p>

            <h2>6. Cookies and Tracking</h2>
            <p>
              Our application may use cookies and similar tracking technologies
              to enhance your experience. You can choose to disable cookies
              through your browser settings.
            </p>

            <h2>7. Data Retention</h2>
            <p>
              We retain your personal information only for as long as necessary
              to provide our services and fulfill the purposes outlined in this
              privacy policy.
            </p>

            <h2>8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Withdraw consent to processing your information</li>
            </ul>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at hikerbikerwriter@gmail.com.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: August 12, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
