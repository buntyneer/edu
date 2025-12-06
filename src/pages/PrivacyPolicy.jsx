
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, UserCheck, FileText, AlertTriangle } from "lucide-react";

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-slate-600">SmartSchool Manager - Protecting Your Data</p>
          <p className="text-sm text-slate-500 mt-2">
            Last Updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="grid gap-8">
          {/* Pricing Policy */}
          <Card className="border-0 shadow-xl bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-5 h-5" />
                💰 PRICING POLICY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                <p className="text-yellow-800 font-bold mb-3">⚠️ IMPORTANT NOTICE:</p>
                <ul className="list-disc list-inside space-y-2 text-yellow-700 text-sm font-semibold">
                  <li>Pricing and subscription plans may change at any time</li>
                  <li>We reserve the right to modify, increase, or decrease prices without notice</li>
                  <li>Active subscriptions continue at original price until renewal</li>
                  <li>New customers will be charged at current market rates</li>
                  <li>Promotional offers may be modified or withdrawn anytime</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Lock className="w-5 h-5" />
                Data Collection & Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                SmartSchool Manager collects only necessary information to provide educational management services:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li><strong>Student Information:</strong> Names, photos, attendance records, academic data</li>
                <li><strong>Parent/Guardian Data:</strong> Contact information for communication purposes</li>
                <li><strong>School Staff Data:</strong> Professional contact and role information</li>
                <li><strong>Usage Analytics:</strong> System usage patterns for service improvement</li>
                <li><strong>Communications:</strong> Messages and interactions within the platform</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <UserCheck className="w-5 h-5" />
                Data Protection & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">🛡️ Military-Grade Security</h4>
                <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                  <li>End-to-end encryption for all data transmission</li>
                  <li>Advanced authentication and authorization systems</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>SOC 2 Type II compliant infrastructure</li>
                  <li>GDPR and FERPA compliance</li>
                  <li>24/7 monitoring and threat detection</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Eye className="w-5 h-5" />
                Your Rights & Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">You have complete control over your data:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li><strong>Access:</strong> View all data we have about you</li>
                <li><strong>Correction:</strong> Update or correct any information</li>
                <li><strong>Deletion:</strong> Request complete data removal</li>
                <li><strong>Portability:</strong> Export your data in standard formats</li>
                <li><strong>Consent Withdrawal:</strong> Revoke permissions at any time</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Legal Protection Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <p className="text-red-800 font-semibold mb-2">⚖️ IMPORTANT LEGAL NOTICE:</p>
                <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                  <li>This software is protected by copyright, trademark, and patent laws</li>
                  <li>Unauthorized copying, reverse engineering, or distribution is prohibited</li>
                  <li>All user activities are logged and monitored for security</li>
                  <li>Legal action will be taken against infringement</li>
                  <li>Only licensed educational institutions may use this software</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-6">
            Questions about our privacy policy? Contact us at <a href="mailto:edumanege1@gmail.com" className="text-blue-600 hover:underline font-semibold">edumanege1@gmail.com</a>
          </p>
          <Button onClick={() => window.history.back()} className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
