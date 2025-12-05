import React from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#000000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#EF6418] to-[#D55514] rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-gray-400">Effective Date: November 19, 2025</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="prose prose-invert prose-lg max-w-none"
        >
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8 space-y-8">
            <div>
              <p className="text-gray-300 leading-relaxed">
                Regent Media Group, LLC ("Regent Media Group," "we," "our," or "us") operates Ember, a film rental and streaming platform. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use Ember.
              </p>
              <p className="text-gray-300 leading-relaxed mt-4">
                By creating an account on Ember or using the platform, you agree to the practices described in this Privacy Policy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. Company Information</h2>
              <div className="text-gray-300 space-y-1">
                <p className="font-semibold text-white">Regent Media Group, LLC</p>
                <p>5578 Blue Pacific Drive</p>
                <p>Jacksonville, FL 32257</p>
                <p>United States</p>
                <p className="pt-2">Email: <a href="mailto:support@regentmediagroup.com" className="text-[#EF6418] hover:text-[#D55514] transition-colors">support@regentmediagroup.com</a></p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We collect only the minimum necessary information to operate Ember.
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">2.1 Information You Provide</h3>
                  <p className="text-gray-300 mb-2">When you create an account, we collect:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Password (securely hashed and never stored in plain text)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">2.2 Payment Information</h3>
                  <p className="text-gray-300 mb-2">
                    We do not collect or store your payment card details. All payment information is processed and stored securely by Stripe, a PCI-compliant third-party service.
                  </p>
                  <p className="text-gray-300 mb-2">We may store non-sensitive Stripe identifiers such as:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Stripe customer ID</li>
                    <li>Payment intent or transaction ID</li>
                    <li>Rental metadata (e.g., amount paid, net revenue from Stripe)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">2.3 Rental Activity</h3>
                  <p className="text-gray-300 mb-2">We track information related to your rental activity, such as:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Rental timestamps (purchase date and expiration)</li>
                    <li>Rental counts</li>
                    <li>Transaction metadata from Stripe (gross and net amounts)</li>
                  </ul>
                  <p className="text-gray-300 mt-2">
                    This information is used to provide access to rented films and to display administrative analytics.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">2.4 Video Playback</h3>
                  <p className="text-gray-300 mb-2">
                    We use third-party media players (such as Vimeo, Bunny.net, or another hosting provider). These providers may collect limited playback analytics, device information, and viewing data in accordance with their own privacy policies.
                  </p>
                  <p className="text-gray-300">
                    We do not collect detailed playback analytics beyond what the media player provides.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">2.5 Automatically Collected Data</h3>
                  <p className="text-gray-300 mb-2">Ember does not use:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Session cookies</li>
                    <li>Tracking cookies</li>
                    <li>Behavioral tracking or advertising cookies</li>
                    <li>Third-party analytics tools</li>
                  </ul>
                  <p className="text-gray-300 mt-2 mb-2">Standard server logs may capture:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>IP address</li>
                    <li>Browser type</li>
                    <li>Timestamp of requests</li>
                  </ul>
                  <p className="text-gray-300 mt-2">
                    This is used solely for security and site integrity.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-300 mb-2">We use your information for the following purposes:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>To create and maintain your Ember account</li>
                <li>To process rental payments through Stripe</li>
                <li>To provide you access to purchased film rentals</li>
                <li>To send transactional emails (receipts, confirmations, password resets, rental expiration notifications)</li>
                <li>To send marketing or promotional emails (you may opt out at any time)</li>
                <li>To generate rental performance analytics for film producers (aggregate rental counts and revenue only)</li>
                <li>To comply with legal obligations</li>
                <li>To maintain the security and function of our platform</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. How We Share Your Information</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We value your privacy. We do not sell or rent your personal information.
              </p>
              <p className="text-gray-300 mb-4">We only share limited information with:</p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">4.1 Film Producers</h3>
                  <p className="text-gray-300 mb-2">Producers receive:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Total rental counts</li>
                    <li>Total revenue generated</li>
                  </ul>
                  <p className="text-gray-300 mt-2 mb-2">They do not receive:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>User names</li>
                    <li>Email addresses</li>
                    <li>Rental histories</li>
                    <li>Any personal information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">4.2 Service Providers</h3>
                  <p className="text-gray-300 mb-2">We share information with trusted third parties who help us operate Ember, including:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Stripe (payment processing)</li>
                    <li>Vimeo / Bunny.net / hosting providers (video playback)</li>
                    <li>Email service providers (for transactional messaging)</li>
                    <li>Infrastructure providers (hosting, database, security)</li>
                  </ul>
                  <p className="text-gray-300 mt-2">
                    These third parties only receive the information necessary to perform their services.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">4.3 Legal Requirements</h3>
                  <p className="text-gray-300 mb-2">We may disclose information if required to:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Comply with a law or legal process</li>
                    <li>Protect our rights or property</li>
                    <li>Prevent fraud or security threats</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Age Requirement</h2>
              <p className="text-gray-300 leading-relaxed">
                Ember is intended for users 18 years of age or older. We do not knowingly collect information from individuals under 18. If we discover such information, we will delete it immediately.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
              <p className="text-gray-300 mb-2">We retain your information only as long as it is necessary to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Maintain your account</li>
                <li>Provide access to your rentals</li>
                <li>Fulfill legal or accounting obligations</li>
              </ul>
              <p className="text-gray-300 mt-4 mb-2">If you delete your account:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Your account and all associated personal data are deleted immediately</li>
                <li>We retain minimal system logs for security purposes</li>
                <li>Rental metadata may be anonymized for revenue reporting without identifying you</li>
              </ul>
              <p className="text-gray-300 mt-4">
                We do not provide data exports because we collect only basic account info and rental history. This limited data does not require replication outside your dashboard.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights</h2>
              <p className="text-gray-300 mb-2">You may:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Access your account information</li>
                <li>Update your information at any time</li>
                <li>Delete your account and associated personal data</li>
                <li>Request manual deletion by emailing support@regentmediagroup.com</li>
                <li>Opt out of marketing emails</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">8. Security Measures</h2>
              <p className="text-gray-300 leading-relaxed mb-2">
                We take security seriously.
              </p>
              <p className="text-gray-300 mb-2">We use:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Encrypted databases</li>
                <li>Secure password hashing (e.g., bcrypt)</li>
                <li>HTTPS across the entire site</li>
                <li>PCI-compliant payment processing through Stripe</li>
                <li>Regular monitoring for suspicious activity</li>
              </ul>
              <p className="text-gray-300 mt-4">
                No system is 100% secure, but we implement industry-standard safeguards to protect your data.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">9. Data Storage & International Access</h2>
              <p className="text-gray-300 leading-relaxed mb-2">
                Ember is currently intended for users in the United States only.
              </p>
              <p className="text-gray-300">
                Your data is stored on servers located within the United States.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-300 leading-relaxed mb-2">
                We may update this Privacy Policy periodically.
              </p>
              <p className="text-gray-300">
                If changes are material, we will notify users via email or an in-app notice.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
              <p className="text-gray-300">
                For questions, concerns, or deletion requests: <a href="mailto:support@regentmediagroup.com" className="text-[#EF6418] hover:text-[#D55514] transition-colors">support@regentmediagroup.com</a>
              </p>
            </div>

            <div className="pt-8 border-t border-[#333333] text-center">
              <p className="text-gray-500 text-sm font-semibold">END OF PRIVACY POLICY</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}