import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function TermsOfService() {
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
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Terms of Service</h1>
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
                These Terms of Service ("Terms") govern your use of Ember, a film rental and streaming platform operated by Regent Media Group, LLC.
              </p>
              <p className="text-gray-300 leading-relaxed mt-4">
                By creating an account or using Ember, you agree to these Terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. Eligibility</h2>
              <p className="text-gray-300 leading-relaxed">
                You must be 18 years or older to create an account or use Ember.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Account Responsibilities</h2>
              <p className="text-gray-300 mb-2">You agree to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Provide accurate information</li>
                <li>Keep your login credentials secure</li>
                <li>Notify us of any unauthorized access</li>
                <li>Not allow others to use your account</li>
              </ul>
              <p className="text-gray-300 mt-4">
                You are responsible for all activity conducted under your account.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Rentals & Access Window</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Films on Ember are available for rental only, not purchase.</li>
                <li>Each rental provides 48-hour access from the time of successful payment.</li>
                <li>After 48 hours, access expires automatically.</li>
                <li>To watch again, you must rent the film again.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Payment & Billing</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>All payments are processed securely through Stripe.</li>
                <li>We do not store any payment card information.</li>
                <li>Prices are displayed before checkout.</li>
                <li>Taxes may apply depending on your location.</li>
                <li>All rental transactions are final unless otherwise required by law.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Video Playback</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Films are streamed through third-party media players (such as Vimeo or a custom hosting provider).</li>
                <li>Playback quality may vary depending on your internet connection.</li>
                <li>You may not download, copy, screen-record, or redistribute any film content.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. User Conduct</h2>
              <p className="text-gray-300 mb-2">You may not:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Bypass rental restrictions or access expired rentals</li>
                <li>Share films publicly or redistribute content</li>
                <li>Attempt to reverse-engineer, scrape, or manipulate the platform</li>
                <li>Interfere with platform security</li>
                <li>Upload harmful code</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Violation may result in account termination.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                All films, artwork, text, images, software, and branding on Ember are protected by copyrights, trademarks, and other intellectual property laws.
              </p>
              <p className="text-gray-300 leading-relaxed">
                You receive a limited, non-exclusive, non-transferable license to stream rented films for personal use only.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">8. Data & Privacy</h2>
              <p className="text-gray-300">
                Your use of Ember is governed by our <Link to={createPageUrl("PrivacyPolicy")} className="text-[#EF6418] hover:text-[#D55514] transition-colors">Privacy Policy</Link>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">9. Availability & Downtime</h2>
              <p className="text-gray-300 leading-relaxed mb-2">
                We strive for uninterrupted service, but we do not guarantee:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Continuous availability</li>
                <li>Error-free performance</li>
                <li>Perfect video playback</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Scheduled maintenance or unexpected outages may occur.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
              <p className="text-gray-300 mb-2">We may suspend or terminate your account if:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>You violate these Terms</li>
                <li>You engage in fraudulent or harmful activity</li>
                <li>You misuse the platform or rental system</li>
              </ul>
              <p className="text-gray-300 mt-4">
                You may delete your account at any time.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">11. Disclaimer of Warranties</h2>
              <p className="text-gray-300 leading-relaxed mb-2">
                Ember is provided "as is" and "as available."
              </p>
              <p className="text-gray-300 mb-2">We make no warranties regarding:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Accuracy</li>
                <li>Reliability</li>
                <li>Availability</li>
                <li>Fitness for a particular purpose</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">12. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed mb-2">
                To the fullest extent permitted by law, Regent Media Group is not liable for:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Lost profits</li>
                <li>Data loss</li>
                <li>Business interruption</li>
                <li>Indirect or consequential damages</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Our total liability shall not exceed the amount you paid for rentals in the previous 12 months.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">13. Governing Law</h2>
              <p className="text-gray-300 leading-relaxed">
                These Terms are governed by the laws of the State of Florida, without regard to conflict of law principles.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">14. Changes to Terms</h2>
              <p className="text-gray-300 leading-relaxed mb-2">
                We may update these Terms.
              </p>
              <p className="text-gray-300">
                Continued use of Ember constitutes acceptance of updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">15. Contact</h2>
              <div className="text-gray-300 space-y-1">
                <p><a href="mailto:support@regentmediagroup.com" className="text-[#EF6418] hover:text-[#D55514] transition-colors">support@regentmediagroup.com</a></p>
                <p>5578 Blue Pacific Drive</p>
                <p>Jacksonville, FL 32257</p>
              </div>
            </div>

            <div className="pt-8 border-t border-[#333333] text-center">
              <p className="text-gray-500 text-sm font-semibold">END OF TERMS OF SERVICE</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}