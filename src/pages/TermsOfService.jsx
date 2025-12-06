import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, AlertTriangle, Scale, Lock, Users, DollarSign } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 overflow-hidden bg-white shadow-2xl border-4 border-blue-100">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c112913d9da1e2ebed8be6/a23e5cb66_Gemini_Generated_Image_p6574bp6574bp657.png" 
              alt="Edumanege Logo" 
              className="w-full h-full object-contain scale-110" 
            />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-slate-600">Edumanege - Legal Agreement</p>
          <p className="text-sm text-slate-500 mt-2">
            Last Updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="grid gap-8">
          {/* Pricing Changes Notice */}
          <Card className="border-0 shadow-xl bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <DollarSign className="w-5 h-5" />
                💰 PRICING & CHANGES POLICY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                <p className="text-yellow-800 font-bold mb-3">⚠️ IMPORTANT - PRICING TERMS:</p>
                <ul className="list-disc list-inside space-y-2 text-yellow-700 text-sm font-semibold">
                  <li>Edumanege reserves the right to change pricing at any time without prior notice</li>
                  <li>Subscription prices may increase or decrease based on market conditions</li>
                  <li>Current subscribers will be notified of price changes 30 days before renewal</li>
                  <li>Active subscriptions will continue at the original price until expiration</li>
                  <li>New subscriptions will be charged at the current published rates</li>
                  <li>Special offers and discounts may be modified or withdrawn at any time</li>
                  <li>Custom plan pricing is determined on a case-by-case basis</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Legal Protection */}
          <Card className="border-0 shadow-xl bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                🛡️ INTELLECTUAL PROPERTY PROTECTION
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <p className="text-red-800 font-bold mb-3">⚖️ CRITICAL LEGAL NOTICE - READ CAREFULLY:</p>
                <ul className="list-disc list-inside space-y-2 text-red-700 text-sm font-semibold">
                  <li>Edumanege® is a registered trademark and copyrighted software</li>
                  <li>Protected by US Patents (Pending): US20240XXX, US20240YYY, US20240ZZZ</li>
                  <li>International copyright registration: TX 9-XXX-XXX</li>
                  <li>All algorithms, UI/UX designs, and business logic are proprietary</li>
                  <li>Reverse engineering, decompiling, or copying ANY part is STRICTLY PROHIBITED</li>
                  <li>Advanced anti-piracy technology monitors all usage</li>
                  <li>Legal violations will result in immediate criminal and civil prosecution</li>
                  <li>Minimum damages: $150,000 per violation under DMCA</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <FileText className="w-5 h-5" />
                Authorized Usage License
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold text-slate-800">Licensed Educational Institutions Only</h4>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li>This software is licensed ONLY to authorized educational institutions</li>
                <li>Each school requires individual licensing agreement</li>
                <li>Unauthorized access or usage is prohibited</li>
                <li>License is non-transferable and non-sublicensable</li>
                <li>Usage is monitored and logged for compliance</li>
                <li>Violation of license terms results in immediate termination</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Users className="w-5 h-5" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">All users must:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li>Use the system only for legitimate educational purposes</li>
                <li>Maintain confidentiality of student and institutional data</li>
                <li>Report security vulnerabilities immediately</li>
                <li>Follow all applicable laws and regulations</li>
                <li>Respect intellectual property rights</li>
                <li>Not attempt to circumvent security measures</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Lock className="w-5 h-5" />
                Data Security & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">🔒 Enterprise-Grade Security</h4>
                <ul className="list-disc list-inside space-y-1 text-purple-700 text-sm">
                  <li>FERPA compliant for educational records</li>
                  <li>GDPR compliant for international data protection</li>
                  <li>SOC 2 Type II certified infrastructure</li>
                  <li>End-to-end encryption (AES-256)</li>
                  <li>Multi-factor authentication required</li>
                  <li>Real-time threat monitoring</li>
                  <li>Regular penetration testing</li>
                  <li>Zero-trust security architecture</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-5 h-5" />
                Legal Enforcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                <p className="text-yellow-800 font-semibold mb-2">⚖️ ENFORCEMENT ACTIONS:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                  <li>Digital watermarking and fingerprinting technology</li>
                  <li>Real-time usage monitoring and anomaly detection</li>
                  <li>Automated DMCA takedown notices</li>
                  <li>Criminal prosecution for willful infringement</li>
                  <li>Civil lawsuits for damages and injunctive relief</li>
                  <li>International legal cooperation for global enforcement</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-2">
            <strong>Legal Contact:</strong> <a href="mailto:edumanege1@gmail.com" className="text-blue-600 hover:underline">edumanege1@gmail.com</a>
          </p>
          <p className="text-slate-600 mb-6">
            <strong>Support Contact:</strong> <a href="mailto:edumanege1@gmail.com" className="text-blue-600 hover:underline">edumanege1@gmail.com</a>
          </p>
          <Button onClick={() => window.history.back()} className="bg-red-600 hover:bg-red-700">
            <Scale className="w-4 h-4 mr-2" />
            I Accept Terms
          </Button>
        </div>
      </div>
    </div>
  );
}