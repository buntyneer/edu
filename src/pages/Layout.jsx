
import React, { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { User, School } from "@/api/entities";
import {
  School as SchoolIcon,
  Users, UserCheck, ClipboardList, BarChart3, Settings, LogOut, Menu, MessageSquare, AlertTriangle, Briefcase, CalendarDays, Crown
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// --- Context and Constants ---
const AppContext = createContext(null);
export const useAppData = () => useContext(AppContext);

const navigationItems = [
  { title: "🏠 Back to Homepage", url: createPageUrl("Homepage"), icon: SchoolIcon, isSpecial: true },
  { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: BarChart3 },
  { title: "Students", url: createPageUrl("Students"), icon: Users },
  { title: "Messages", url: createPageUrl("Messages"), icon: MessageSquare, showUnreadBadge: true },
];

const academicsNavigation = [
    { title: "Attendance", url: createPageUrl("AttendanceReports"), icon: ClipboardList },
    { title: "Monthly Reports", url: createPageUrl("MonthlyReports"), icon: BarChart3 },
    { title: "Batches", url: createPageUrl("Batches"), icon: Briefcase, instituteType: ['ielts_center', 'computer_center', 'tuition_center', 'coaching_center'] },
    { title: "Holidays", url: createPageUrl("Holidays"), icon: CalendarDays },
];

const managementNavigation = [
    { title: "Gatekeepers / Incharge", url: createPageUrl("Gatekeepers"), icon: UserCheck },
    { title: "Activate License", url: createPageUrl("LicenseActivation"), icon: Crown },
    { title: "Settings", url: createPageUrl("SchoolSettings"), icon: Settings },
]

const superAdminNavigation = [
    { title: "🔐 Super Admin Panel", url: createPageUrl("AdminPanel"), icon: Settings, adminOnly: true },
]

const publicPages = ["Homepage", "GatekeeperAccess", "AttendanceInterface", "StudentRegistrationForm", "Update", "ParentChat", "PrivacyPolicy", "TermsOfService", "SchoolRegistration", "ParentAppLauncher", "Pricing", "LicenseActivation"];

// --- Helper for retrying promises ---
const retryPromise = async (promiseFn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await promiseFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delay * (i + 1))); // Incremental delay
    }
  }
};

// Footer Component for Public Pages
function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          <div>
            <h3 className="font-bold text-lg mb-3">Edumanege</h3>
            <p className="text-slate-400 text-sm">
              Complete school management solution for modern institutes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to={createPageUrl("Homepage")} className="text-slate-400 hover:text-white">Home</Link></li>
              <li><Link to={createPageUrl("Pricing")} className="text-slate-400 hover:text-white">💎 See Pricing</Link></li>
              <li><Link to={createPageUrl("SchoolRegistration")} className="text-slate-400 hover:text-white">Start Free Trial</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to={createPageUrl("PrivacyPolicy")} className="text-slate-400 hover:text-white">Privacy Policy</Link></li>
              <li><Link to={createPageUrl("TermsOfService")} className="text-slate-400 hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 text-center">
          <p className="text-slate-400 text-sm">
            © 2025 Edumanege. All rights reserved. | Contact: <a href="mailto:edumanege1@gmail.com" className="text-blue-400 hover:underline">edumanege1@gmail.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

// --- Private Pages Layout ---
// This component handles all authenticated pages with a sidebar.
function PrivateLayout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [appData, setAppData] = useState({ user: null, school: null, loading: true });
  const [unreadCount, setUnreadCount] = useState(0); // New state for unread messages

  // Function to load unread message count - ALWAYS load for sidebar badge
  const loadUnreadCount = async (schoolId) => {
    if (!schoolId) return;

    try {
      // Import Conversation entity safely
      const { Conversation } = await import('@/api/entities');

      // Increase timeout to 15 seconds for slower connections
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );

      // Only fetch minimal data needed - limit to 50 conversations
      const conversationsPromise = Conversation.filter({ school_id: schoolId }, '-last_message_time', 50);

      const conversations = await Promise.race([conversationsPromise, timeoutPromise]);

      const totalUnread = conversations.reduce((sum, conv) => {
        return sum + (conv.teacher_unread_count || 0);
      }, 0);

      setUnreadCount(totalUnread);
    } catch (error) {
      // Silently fail - don't show error to user, just log
      console.warn('Could not load unread count:', error.message);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const loadCoreData = async () => {
      try {
        const currentUser = await retryPromise(() => User.me());
        let currentSchool = null;

        if (currentUser.school_id) {
           const schools = await retryPromise(() => School.filter({ id: currentUser.school_id }));
           currentSchool = schools.length > 0 ? schools[0] : null;
        } else if (currentUser.email) {
           const schools = await retryPromise(() => School.filter({ created_by: currentUser.email }));
           currentSchool = schools.length > 0 ? schools[0] : null;
        }

        // CRITICAL: Auto-update expired status BEFORE setting app data
        if (currentSchool) {
          const now = new Date();
          let shouldExpire = false;
          
          // Check if trial has expired (>= to include exact expiry date)
          if (currentSchool.subscription_status === 'trial' && currentSchool.trial_ends_at) {
            const trialExpiry = new Date(currentSchool.trial_ends_at);
            if (now >= trialExpiry) {
              shouldExpire = true;
              console.log('[AUTO-UPDATE] Trial expired for:', currentSchool.school_name, 'Expiry:', trialExpiry, 'Now:', now);
            }
          } 
          // Check if active subscription has expired (>= to include exact expiry date)
          else if (currentSchool.subscription_status === 'active' && currentSchool.subscription_expires_at) {
            const subExpiry = new Date(currentSchool.subscription_expires_at);
            if (now >= subExpiry) {
              shouldExpire = true;
              console.log('[AUTO-UPDATE] Subscription expired for:', currentSchool.school_name, 'Expiry:', subExpiry, 'Now:', now);
            }
          }
          
          // Update status to expired if needed - FORCE UPDATE EVEN IF IT FAILS
          if (shouldExpire && currentSchool.subscription_status !== 'expired') {
            console.log('[AUTO-UPDATE] Updating status to expired...');
            try {
              await School.update(currentSchool.id, { subscription_status: 'expired' });
              currentSchool = { ...currentSchool, subscription_status: 'expired' };
              console.log('[AUTO-UPDATE] Successfully updated to expired');
            } catch (updateError) {
              console.error('[AUTO-UPDATE] Failed to update in DB, setting locally:', updateError);
              // Even if update fails, set status locally for immediate blocking
              currentSchool = { ...currentSchool, subscription_status: 'expired' };
            }
          }
        }

        setAppData({ user: currentUser, school: currentSchool, loading: false });

        // Load unread count for sidebar badge - delayed to not block initial load
        if (currentSchool) {
          setTimeout(() => loadUnreadCount(currentSchool.id), 3000);
        }

        // Super admin bypass - edumanege1@gmail.com doesn't need a school
        const isSuperAdmin = currentUser?.email === 'edumanege1@gmail.com';

        if (currentUser && !currentSchool && !isSuperAdmin && currentPageName !== 'SchoolRegistration' && currentPageName !== 'LicenseActivation') {
           toast.info("Please register your school to continue.");
           navigate(createPageUrl("SchoolRegistration"));
        }
      } catch (error) {
        console.error("Authentication failed after multiple retries:", error);
        // FIXED: Don't show error toast for normal logged out state
        if (!error.message?.includes('User not authenticated') && !error.message?.includes('401')) {
          toast.error("Connection failed. Please check your network and try again.");
        }

        setTimeout(() => {
          if (currentPageName !== 'Homepage') {
            navigate(createPageUrl("Homepage"));
          }
        }, 3000);
        setAppData({ user: null, school: null, loading: false });
      }
    };

    loadCoreData();
  }, [currentPageName, navigate]);

  // Auto-refresh unread count every 60 seconds - on ALL pages for sidebar badge
  useEffect(() => {
    if (appData.school && appData.school.id) {
      const interval = setInterval(() => {
        loadUnreadCount(appData.school.id);
      }, 60000); // 60 seconds to reduce server load

      return () => clearInterval(interval);
    }
  }, [appData.school?.id]);

  const handleLogout = async () => {
    try {
        await User.logout();
        toast.success("You have been logged out.");
        window.location.href = createPageUrl("Homepage");
    } catch (error) {
        console.error("Logout failed:", error);
        toast.error("Failed to log out.");
        window.location.href = createPageUrl("Homepage");
    }
  };

  const handleNavigation = (url) => {
    navigate(url);
  };

  // STRICT EXPIRY CHECK - Blocks access if ANY condition matches
  const isSubscriptionExpired = () => {
    if (!appData.school) {
      console.log('[EXPIRY CHECK] No school data found');
      return false;
    }

    const now = new Date();
    console.log('[EXPIRY CHECK] Starting check for:', appData.school.school_name);
    console.log('[EXPIRY CHECK] Status:', appData.school.subscription_status);
    console.log('[EXPIRY CHECK] Trial ends at:', appData.school.trial_ends_at);
    console.log('[EXPIRY CHECK] Subscription expires at:', appData.school.subscription_expires_at);

    // PRIORITY 1: Status is explicitly 'expired' - BLOCK IMMEDIATELY
    if (appData.school.subscription_status === 'expired') {
      console.log('[BLOCK] ✋ Status is EXPIRED - Blocking access');
      return true;
    }

    // PRIORITY 2: Check trial expiry - REGARDLESS of status
    if (appData.school.trial_ends_at) {
      const trialExpiry = new Date(appData.school.trial_ends_at);
      console.log('[EXPIRY CHECK] Trial expiry date:', trialExpiry, 'Current:', now);
      // Block ONLY if datetime has actually passed
      if (now >= trialExpiry && appData.school.subscription_status === 'trial') {
        console.log('[BLOCK] ✋ Trial EXPIRED - Blocking access');
        return true;
      }
    }

    // PRIORITY 3: Check subscription expiry - REGARDLESS of status
    if (appData.school.subscription_expires_at) {
      const subExpiry = new Date(appData.school.subscription_expires_at);
      console.log('[EXPIRY CHECK] Subscription expiry date:', subExpiry, 'Current:', now);
      // Block ONLY if datetime has actually passed (works for hours, days, months)
      if (now >= subExpiry && appData.school.subscription_status === 'active') {
        console.log('[BLOCK] ✋ Subscription EXPIRED - Blocking access');
        return true;
      }
    }

    // PRIORITY 4: No valid subscription found at all - BLOCK
    if (!appData.school.trial_ends_at && !appData.school.subscription_expires_at && appData.school.subscription_status !== 'active') {
      console.log('[BLOCK] ✋ No valid subscription found - Blocking access');
      return true;
    }

    // PRIORITY 5: Status is neither trial nor active - suspicious, BLOCK
    if (appData.school.subscription_status !== 'trial' && appData.school.subscription_status !== 'active') {
      console.log('[BLOCK] ✋ Invalid subscription status - Blocking access');
      return true;
    }

    console.log('[EXPIRY CHECK] ✅ Access granted - subscription is valid');
    return false;
  };

  if (appData.loading) {
    return null;
  }

  // Block access if subscription expired (except for super admin, LicenseActivation and Pricing pages)
  const isSuperAdmin = appData.user?.email === 'edumanege1@gmail.com';

  if (!isSuperAdmin && isSubscriptionExpired() && currentPageName !== 'LicenseActivation' && currentPageName !== 'Pricing' && currentPageName !== 'Payment') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-2xl">
          <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-red-900 mb-3">
            {appData.school?.subscription_status === 'trial' ? 'Trial Period Ended' : 'Subscription Expired'}
          </h1>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Your {appData.school?.subscription_status === 'trial' ? 'free trial' : 'subscription'} has ended. 
            Please activate a license to continue using all features of Edumanege.
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate(createPageUrl("LicenseActivation"))} 
              className="bg-red-600 hover:bg-red-700 text-lg py-6"
            >
              Activate License Now
            </Button>
            <Button 
              onClick={() => navigate(createPageUrl("Pricing"))} 
              variant="outline"
              className="text-lg py-6"
            >
              View Pricing Plans
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-6">
            Need help? Contact us at edumanege1@gmail.com
          </p>
        </div>
      </div>
    );
  }

  // If no user and not loading, show a gentle redirect message
  if (!appData.user && !appData.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-700 mb-2">Authentication Required</h1>
          <p className="text-slate-500 mb-6">You need to be logged in to access this page.</p>
          <Button onClick={() => handleNavigation(createPageUrl("Homepage"))} className="bg-blue-600 hover:bg-blue-700">
            Go to Login Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ ...appData, unreadCount, loadUnreadCount }}> {/* Pass loadUnreadCount for manual refresh if needed */}
      <ErrorBoundary>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Sidebar */}
            <Sidebar className="border-r border-slate-200/60 bg-white/80 backdrop-blur-sm">
                <SidebarHeader className="border-b border-slate-200/60 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-md border-2 border-blue-100">
                            {appData.school?.logo_url ? ( 
                              <img src={appData.school.logo_url} alt="School Logo" className="w-full h-full object-contain p-1" loading="lazy" /> 
                            ) : ( 
                              <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c112913d9da1e2ebed8be6/a23e5cb66_Gemini_Generated_Image_p6574bp6574bp657.png" 
                                alt="Edumanege Logo" 
                                className="w-full h-full object-contain" 
                                loading="lazy"
                              />
                            )}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 text-lg">{appData.school?.school_name || "Edumanege"}</h2>
                            <p className="text-xs text-blue-600 font-semibold">
                              {appData.school?.sidebar_header_subtitle?.replace('.com', '') || "Management System"}
                            </p>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarContent className="p-4">
                    <SidebarGroup>
                        <SidebarGroupLabel>Main</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {navigationItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                                            <Link
                                              to={item.url}
                                              className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors relative ${item.isSpecial ? 'bg-green-50 hover:bg-green-100 text-green-800 border border-green-200' : ''}`}
                                            >
                                                <item.icon className={`w-5 h-5 ${item.isSpecial ? 'text-green-600' : ''}`} />
                                                <span className={`font-medium ${item.isSpecial ? 'text-green-800' : ''}`}>{item.title}</span>

                                                {/* Unread Badge for Messages - Show on all pages */}
                                                {item.showUnreadBadge && unreadCount > 0 && (
                                                  <div className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center font-bold animate-pulse">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                  </div>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                    <SidebarGroup>
                        <SidebarGroupLabel>Academics</SidebarGroupLabel>
                        <SidebarGroupContent>
                             <SidebarMenu>
                                {academicsNavigation
                                .filter(item => !item.instituteType || (appData.school?.institute_type && item.instituteType.includes(appData.school.institute_type)))
                                .map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                                            <Link to={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"><item.icon className="w-5 h-5" /><span>{item.title}</span></Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                     <SidebarGroup>
                        <SidebarGroupLabel>Management</SidebarGroupLabel>
                        <SidebarGroupContent>
                             <SidebarMenu>
                                {managementNavigation.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                                            <Link to={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                                              <item.icon className="w-5 h-5" />
                                              <span>{item.title.replace('Gatekeepers / Incharge', appData.school?.institute_type === 'school' ? 'Gatekeepers' : 'Incharges')}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                    {appData.user?.email === 'edumanege1@gmail.com' && (
                        <SidebarGroup>
                            <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {superAdminNavigation.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                                                <Link to={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors bg-red-50 border border-red-200">
                                                    <item.icon className="w-5 h-5 text-red-600" />
                                                    <span className="text-red-800 font-semibold">{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )}
                    </SidebarContent>
                <SidebarFooter className="border-t border-slate-200/60 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden"></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">{appData.user?.full_name || "Admin"}</p>
                            <p className="text-xs text-slate-500">{appData.user?.role === 'admin' ? 'Administrator' : 'User'}</p>
                        </div>
                        <Button onClick={handleLogout} variant="ghost" size="icon" className="text-slate-500 hover:text-red-500">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </SidebarFooter>
            </Sidebar>
            {/* Main Content */}
            <main className="flex-1 flex flex-col">
              <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 md:hidden">
                <div className="flex items-center justify-between">
                  <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                </div>
              </header>
              <div className="flex-1 overflow-auto">{children}</div>
            </main>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    </AppContext.Provider>
  );
}

// --- Main Layout Component ---
// This is the single entry point. It decides whether to show a public or private layout.
export default function Layout({ children, currentPageName }) {
  const isPublicPage = publicPages.includes(currentPageName);

  if (isPublicPage) {
    // Public pages are rendered with a minimal wrapper.
    // Homepage has its own footer.
    return (
        <ErrorBoundary>
            <div className="min-h-screen flex flex-col">
                <div className="flex-1">
                    {children}
                </div>
                {/* Show footer only on Homepage */}
                {currentPageName === 'Homepage' && <PublicFooter />}
            </div>
        </ErrorBoundary>
    );
  } else {
    // Private pages get the full layout with sidebar and authentication.
    return <PrivateLayout currentPageName={currentPageName}>{children}</PrivateLayout>;
  }
}
