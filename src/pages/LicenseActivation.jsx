import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { School, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Key, AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";
import CustomPlanDialog from "../components/pricing/CustomPlanDialog";

export default function LicenseActivation() {
  const navigate = useNavigate();
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [school, setSchool] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser.school_id) {
        const schools = await School.filter({ id: currentUser.school_id });
        if (schools.length > 0) {
          setSchool(schools[0]);
        }
      } else if (currentUser.email) {
        const schools = await School.filter({ created_by: currentUser.email });
        if (schools.length > 0) {
          setSchool(schools[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load school:", error);
      toast.error("Failed to load school data");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    
    if (!licenseKey.trim()) {
      toast.error("Please enter a license key");
      return;
    }

    if (!school) {
      toast.error("No school found. Please register first.");
      return;
    }

    setIsActivating(true);

    try {
      // Format: EDU-6M-XXXXX or EDU-12M-XXXXX or EDU-5H-XXXXX or EDU-10D-XXXXX
      const keyParts = licenseKey.toUpperCase().split('-');

      if (keyParts[0] !== 'EDU' || keyParts.length < 3) {
        toast.error("Invalid license key format");
        setIsActivating(false);
        return;
      }

      let plan = 'regular';
      const planCode = keyParts[1];

      // Check for custom duration formats (e.g., 5H, 10D, 6M)
      const durationMatch = planCode.match(/^(\d+)([HMD])$/);

      if (!durationMatch) {
        toast.error("Invalid license plan type");
        setIsActivating(false);
        return;
      }

      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2];

      const subscriptionExpiresAt = new Date();

      if (unit === 'H') {
        // Add hours directly
        subscriptionExpiresAt.setHours(subscriptionExpiresAt.getHours() + value);
        plan = 'custom';
        console.log(`[LICENSE] Adding ${value} hours. Expiry:`, subscriptionExpiresAt);
      } else if (unit === 'D') {
        // Add days directly
        subscriptionExpiresAt.setDate(subscriptionExpiresAt.getDate() + value);
        plan = 'custom';
        console.log(`[LICENSE] Adding ${value} days. Expiry:`, subscriptionExpiresAt);
      } else if (unit === 'M') {
        // Add months
        subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + value);
        plan = value > 12 ? 'custom' : 'regular';
        console.log(`[LICENSE] Adding ${value} months. Expiry:`, subscriptionExpiresAt);
      } else {
        toast.error("Invalid license duration unit");
        setIsActivating(false);
        return;
      }

      const updateData = {
        license_key: licenseKey.toUpperCase(),
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_expires_at: subscriptionExpiresAt.toISOString(),
        student_limit: 999999, // Always unlimited for any activated license
      };

      console.log('[LICENSE] Updating school with data:', updateData);

      await School.update(school.id, updateData);

      toast.success("🎉 License activated successfully! Redirecting...");

      // Redirect to dashboard with full page reload to refresh school data
      setTimeout(() => {
        window.location.href = createPageUrl("AdminDashboard");
      }, 1500);

    } catch (error) {
      console.error("License activation failed:", error);
      toast.error("Failed to activate license. Please contact support.");
    } finally {
      setIsActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isAlreadyActivated = school?.subscription_status === 'active' && school?.license_key;
  const isTrialActive = school?.subscription_status === 'trial';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Key className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Activate Your License</h1>
          <p className="text-slate-600">Enter the license key we provided to activate your subscription</p>
        </div>

        {/* Current Status */}
        {school && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Current Subscription Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Institute:</span>
                  <span className="font-semibold">{school.school_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Status:</span>
                  {isAlreadyActivated ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : isTrialActive && school?.trial_ends_at && new Date() < new Date(school.trial_ends_at) ? (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Zap className="w-3 h-3 mr-1" />
                      Trial Period
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Expired
                    </Badge>
                  )}
                </div>
                {school.subscription_expires_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Expires On:</span>
                    <span className="font-semibold">
                      {new Date(school.subscription_expires_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {school.license_key && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">License Key:</span>
                    <code className="font-mono text-sm bg-slate-100 px-3 py-1 rounded">{school.license_key}</code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activation Form */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle>
              {isAlreadyActivated ? "Update License Key" : "Enter License Key"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleActivate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="license_key">License Key *</Label>
                <Input
                  id="license_key"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="EDU-6M-XXXXX or EDU-12M-XXXXX or EDU-10D-XXXXX"
                  className="font-mono text-lg"
                  required
                />
                <p className="text-xs text-slate-500">
                  Format: EDU-6M-XXXXX (months) or EDU-10D-XXXXX (days) or EDU-5H-XXXXX (hours)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Important Information
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• License key is case-sensitive</li>
                  <li>• Each key can only be used once</li>
                  <li>• Contact support if activation fails</li>
                  <li>• Your trial period will end when license is activated</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isActivating}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-lg"
              >
                {isActivating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Activating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Activate License
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">
                  Don't have a license key?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl("Pricing"))}
                  >
                    View Pricing Plans
                  </Button>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowRequestForm(true)}
                  >
                    Request License
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Contact */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-600">
            Need help? Contact us at{" "}
            <a href="mailto:edumanege1@gmail.com" className="text-blue-600 hover:underline font-semibold">
              edumanege1@gmail.com
            </a>
          </p>
        </div>
      </div>

      {/* Request License Dialog */}
      {showRequestForm && (
        <CustomPlanDialog 
          open={showRequestForm} 
          onOpenChange={setShowRequestForm}
        />
      )}
    </div>
  );
}