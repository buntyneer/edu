import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Sparkles, Zap, Settings } from "lucide-react";
import CustomPlanDialog from "../components/pricing/CustomPlanDialog";
import { User, School } from "@/api/entities";

export default function PricingPage() {
  const navigate = useNavigate();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await User.me();
        if (user) {
          const schools = await School.filter({ created_by: user.email });
          setIsLoggedIn(schools.length > 0);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    checkUser();
  }, []);

  const handleTrialClick = () => {
    if (isLoggedIn) {
      navigate(createPageUrl("LicenseActivation"));
    } else {
      // Unauthenticated users should start from homepage and use Google login
      navigate(createPageUrl("Homepage"));
    }
  };

  const handlePayNow = (planType) => {
    navigate(createPageUrl(`Payment?plan=${planType}`));
  };

  const features = [
    "✅ Up to 200 Students",
    "✅ Student Management",
    "✅ QR Code Attendance",
    "✅ WhatsApp Notifications",
    "✅ Parent-Teacher Chat",
    "✅ ID Card Generation",
    "✅ Monthly Reports",
    "✅ Gatekeeper Management",
    "✅ Dashboard Analytics",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Homepage"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            💎 Simple & Affordable Pricing
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose the plan that works best for your institute. Up to 200 students included!
          </p>
          <Badge className="mt-4 bg-green-100 text-green-800 text-lg px-4 py-2">
            🎉 14 Days Free Trial - No Credit Card Required
          </Badge>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* 6 Months Plan */}
          <Card className="border-2 border-slate-300 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white pb-8">
              <div className="flex items-center justify-center mb-4">
                <Zap className="w-12 h-12" />
              </div>
              <CardTitle className="text-3xl text-center">6 Months Plan</CardTitle>
              <p className="text-blue-100 text-center mt-2">Perfect for getting started</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <p className="text-5xl font-extrabold text-blue-600 mb-2">₹3,499</p>
                <p className="text-slate-600 font-medium">for 6 months</p>
                <Badge className="mt-3 bg-blue-100 text-blue-800">1-200 Students Included</Badge>
              </div>

              <div className="space-y-3 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => handlePayNow("6months")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
              >
                💳 Pay Now
              </Button>
            </CardContent>
          </Card>

          {/* 12 Months Plan - MOST POPULAR */}
          <Card className="border-4 border-purple-500 shadow-2xl hover:shadow-3xl transition-all duration-300 relative transform md:scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-6 py-2">
                🔥 BEST VALUE
              </Badge>
            </div>
            <CardHeader className="bg-gradient-to-br from-purple-600 to-pink-600 text-white pb-8">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="w-12 h-12" />
              </div>
              <CardTitle className="text-3xl text-center">12 Months Plan</CardTitle>
              <p className="text-purple-100 text-center mt-2">Save more with annual billing</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="relative">
                  <p className="text-2xl text-slate-400 line-through">₹6,998</p>
                  <p className="text-5xl font-extrabold text-purple-600 mb-2">₹5,999</p>
                </div>
                <p className="text-slate-600 font-medium">for 12 months</p>
                <p className="text-sm text-green-600 font-bold mt-2">Save ₹999!</p>
                <Badge className="mt-3 bg-purple-100 text-purple-800">1-200 Students Included</Badge>
              </div>

              <div className="space-y-3 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => handlePayNow("12months")}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
              >
                💳 Pay Now
              </Button>
            </CardContent>
          </Card>

          {/* Custom Plan */}
          <Card className="border-2 border-orange-300 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-br from-orange-500 to-orange-600 text-white pb-8">
              <div className="flex items-center justify-center mb-4">
                <Settings className="w-12 h-12" />
              </div>
              <CardTitle className="text-3xl text-center">Custom Plan</CardTitle>
              <p className="text-orange-100 text-center mt-2">Tailored for your needs</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <p className="text-4xl font-extrabold text-orange-600 mb-1">Let's Talk</p>
                <p className="text-slate-600">Contact us for pricing</p>
                <Badge className="mt-3 bg-orange-100 text-orange-800">200+ Students? Custom Features?</Badge>
              </div>

              <div className="space-y-3 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-semibold text-orange-600 mb-2">+ Additional Benefits:</p>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">Unlimited Students</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">Custom Features</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">Priority Support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">Flexible Payment Terms</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setShowCustomForm(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6"
              >
                Request Custom Quote
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <Card className="mt-12 max-w-4xl mx-auto border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">📊 Quick Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-center py-3 px-4">6 Months</th>
                    <th className="text-center py-3 px-4">12 Months</th>
                    <th className="text-center py-3 px-4">Custom</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">Student Limit</td>
                    <td className="text-center py-3 px-4">1-200</td>
                    <td className="text-center py-3 px-4">1-200</td>
                    <td className="text-center py-3 px-4 text-orange-600 font-bold">Unlimited</td>
                  </tr>
                  <tr className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">Total Cost</td>
                    <td className="text-center py-3 px-4">₹3,499</td>
                    <td className="text-center py-3 px-4 text-green-600 font-bold">₹5,999 <span className="text-xs">(Save ₹999)</span></td>
                    <td className="text-center py-3 px-4">Custom Quote</td>
                  </tr>
                  <tr className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">Free Trial</td>
                    <td className="text-center py-3 px-4">✅ 14 Days</td>
                    <td className="text-center py-3 px-4">✅ 14 Days</td>
                    <td className="text-center py-3 px-4">✅ 14 Days</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">Support</td>
                    <td className="text-center py-3 px-4">Email + WhatsApp</td>
                    <td className="text-center py-3 px-4">Email + WhatsApp</td>
                    <td className="text-center py-3 px-4 text-orange-600 font-bold">Priority Phone</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mt-12 max-w-3xl mx-auto border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">❓ Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">What happens after the 14-day trial?</h4>
              <p className="text-slate-600">You'll be asked to choose a plan. Your data remains safe for 30 days if you don't subscribe immediately.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Can I upgrade from 6 months to 12 months later?</h4>
              <p className="text-slate-600">Yes! We'll calculate the difference and adjust your billing accordingly.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">What if I have more than 200 students?</h4>
              <p className="text-slate-600">Choose the Custom Plan! We'll create a package that fits your exact needs with flexible pricing.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">How do I pay?</h4>
              <p className="text-slate-600">After trial, submit your requirements. We'll contact you with payment details (Google Pay, PhonePe, Bank Transfer accepted).</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
              <h4 className="font-bold text-lg mb-2 text-red-900 flex items-center gap-2">
                ❌ No Refund Policy
              </h4>
              <p className="text-slate-700 font-semibold mb-2">All sales are FINAL. We do NOT offer refunds or cancellations.</p>
              <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                <li>All payments are non-refundable once made</li>
                <li>Subscriptions cannot be cancelled mid-term</li>
                <li>We offer a FREE 3-day trial to test before buying</li>
                <li>All plan features are clearly listed above</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button 
            onClick={handleTrialClick}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-12 py-6 text-xl"
          >
            🚀 Start Your Free 14-Day Trial Now
          </Button>
          <p className="text-slate-600 mt-4">
            Join 100+ institutes already using Edumanege ❤️
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Questions? Email us at <a href="mailto:edumanege1@gmail.com" className="text-blue-600 hover:underline">edumanege1@gmail.com</a>
          </p>
        </div>
      </div>

      {/* Custom Plan Dialog */}
      {showCustomForm && (
        <CustomPlanDialog 
          open={showCustomForm} 
          onOpenChange={setShowCustomForm}
        />
      )}
    </div>
  );
}