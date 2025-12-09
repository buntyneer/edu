import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap, Crown } from "lucide-react";
import { useAppData } from "@/pages/Layout.jsx";

export default function SubscriptionBanner() {
  const { school } = useAppData() || {};
  const navigate = useNavigate();
  const [daysLeft, setDaysLeft] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!school) return;

    const now = new Date();
    let expiryDate = null;

    if (school.subscription_status === 'trial' && school.trial_ends_at) {
      expiryDate = new Date(school.trial_ends_at);
    } else if (school.subscription_status === 'active' && school.subscription_expires_at) {
      expiryDate = new Date(school.subscription_expires_at);
    }

    if (expiryDate) {
      const diffTime = expiryDate - now;
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24))); // Match admin panel calculation
      setDaysLeft(diffDays);

      // Show banner if less than 7 days left OR if status is expired
      if (diffDays <= 7 || school.subscription_status === 'expired') {
        setShowBanner(true);
      }
    } else if (school.subscription_status === 'expired') {
      setShowBanner(true);
      setDaysLeft(0);
    }
  }, [school]);

  if (!showBanner || !school) return null;

  // FIXED: Check actual expiry, not just days left
  const now = new Date();
  let expiryDate = null;
  if (school.subscription_status === 'trial' && school.trial_ends_at) {
    expiryDate = new Date(school.trial_ends_at);
  } else if (school.subscription_status === 'active' && school.subscription_expires_at) {
    expiryDate = new Date(school.subscription_expires_at);
  }
  
  const isExpired = school.subscription_status === 'expired' || (expiryDate && now >= expiryDate);
  const isTrial = school.subscription_status === 'trial';
  const isActive = school.subscription_status === 'active';

  return (
    <div className={`mx-6 mt-6 rounded-lg shadow-lg p-4 ${
      isExpired 
        ? 'bg-red-50 border-2 border-red-500' 
        : 'bg-yellow-50 border-2 border-yellow-500'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isExpired ? (
            <AlertTriangle className="w-6 h-6 text-red-600" />
          ) : isTrial ? (
            <Zap className="w-6 h-6 text-yellow-600" />
          ) : (
            <Crown className="w-6 h-6 text-yellow-600" />
          )}
          
          <div>
            <h3 className={`font-bold ${isExpired ? 'text-red-900' : 'text-yellow-900'}`}>
              {isExpired 
                ? isTrial 
                  ? '⚠️ Trial Period Expired!' 
                  : '⚠️ Subscription Expired!'
                : isTrial 
                  ? `🔔 Trial Ending in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` 
                  : `⏰ Subscription Expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
              }
            </h3>
            <p className={`text-sm ${isExpired ? 'text-red-700' : 'text-yellow-700'}`}>
              {isExpired 
                ? 'Please activate your license to continue using all features' 
                : 'Activate your license now to avoid service interruption'
              }
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => navigate(createPageUrl("LicenseActivation"))}
            className={isExpired 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-yellow-600 hover:bg-yellow-700'
            }
          >
            Activate License
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Pricing"))}
          >
            View Plans
          </Button>
        </div>
      </div>
    </div>
  );
}