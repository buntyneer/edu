import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { User, School } from "@/api/entities";

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [loadingRazorpay, setLoadingRazorpay] = useState(true);
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');

  // Get plan details from URL params
  const searchParams = new URLSearchParams(location.search);
  const planType = searchParams.get("plan") || "6months";
  const amount = planType === "12months" ? 5999 : 3499;
  const duration = planType === "12months" ? "12 Months" : "6 Months";

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        if (currentUser.school_id) {
          const schools = await School.filter({ id: currentUser.school_id });
          if (schools.length > 0) {
            setSchool(schools[0]);
          }
        } else {
          const schools = await School.filter({ created_by: currentUser.email });
          if (schools.length > 0) {
            setSchool(schools[0]);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Please login first');
        navigate(createPageUrl('Homepage'));
      }
    };

    loadUserData();
  }, [navigate]);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setLoadingRazorpay(false);
      console.log('Razorpay loaded successfully');
    };
    script.onerror = () => {
      setLoadingRazorpay(false);
      toast.error('Failed to load payment gateway');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!user || !school) {
      toast.error('User or school data not loaded');
      return;
    }

    setLoading(true);

    try {
      // Create Razorpay order
      const { createRazorpayOrder } = await import('@/api/functions');
      const orderResponse = await createRazorpayOrder({
        amount: amount,
        plan_type: planType,
        school_id: school.id
      });

      if (!orderResponse.data || !orderResponse.data.order_id) {
        throw new Error('Failed to create payment order');
      }

      const { order_id, key_id } = orderResponse.data;

      // Razorpay checkout options
      const options = {
        key: key_id,
        amount: amount * 100,
        currency: 'INR',
        name: 'Edumanege',
        description: `${duration} Subscription Plan`,
        image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c112913d9da1e2ebed8be6/a23e5cb66_Gemini_Generated_Image_p6574bp6574bp657.png',
        order_id: order_id,
        handler: async function (response) {
          console.log('Payment successful:', response);
          
          try {
            // Verify payment
            const { verifyRazorpayPayment } = await import('@/api/functions');
            const verifyResponse = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: planType,
              school_id: school.id
            });

            if (verifyResponse.data && verifyResponse.data.success) {
              setLicenseKey(verifyResponse.data.license_key);
              setPaymentSuccess(true);
              toast.success('🎉 Payment successful! Your subscription is now active.');
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.full_name || '',
          email: user.email || '',
          contact: school.principal_phone || ''
        },
        notes: {
          school_name: school.school_name,
          plan_type: planType
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error('Payment failed: ' + response.error.description);
        setLoading(false);
      });

      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <p className="text-lg text-slate-700 mb-6">
              Your {duration} subscription has been activated successfully!
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-slate-600 mb-2">Your License Key:</p>
              <p className="text-lg font-mono font-bold text-blue-600">{licenseKey}</p>
            </div>

            <Button
              onClick={() => navigate(createPageUrl('AdminDashboard'))}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Pricing"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pricing
        </Button>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl text-center">Complete Your Payment</CardTitle>
            <p className="text-blue-100 text-center mt-2">Secure Payment via Razorpay</p>
          </CardHeader>

          <CardContent className="p-8">
            {/* Plan Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl mb-8 border-2 border-purple-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{duration} Plan</h3>
                  <p className="text-sm text-slate-600 mt-1">Up to 200 Students</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-purple-600">₹{amount}</p>
                  <Badge className="mt-2 bg-green-100 text-green-800">
                    14-Day Free Trial Included
                  </Badge>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-800">Secure Payment</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Pay using Credit Card, Debit Card, UPI, Net Banking, or Wallet
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={loading || loadingRazorpay || !user || !school}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : loadingRazorpay ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading Payment Gateway...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay ₹{amount} Now
                  </>
                )}
              </Button>

              {/* Security Features */}
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-xs text-slate-600">100% Secure</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs text-slate-600">Instant Activation</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-xs text-slate-600">Trusted Gateway</p>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded mt-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">Important:</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Your subscription will be activated immediately after successful payment. No manual verification needed!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            🔒 Powered by Razorpay - India's Most Trusted Payment Gateway
          </p>
          <p className="text-xs text-slate-500 mt-2">
            All transactions are encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}