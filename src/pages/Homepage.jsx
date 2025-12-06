import React, { useState, useEffect, lazy, Suspense, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogIn,
  BarChart3,
  Users,
  UserCheck,
  MessageSquare,
  QrCode,
  Shield,
  Zap,
  LogOut
} from "lucide-react";
import { User } from "@/api/entities";
import { School as SchoolEntity } from "@/api/entities";
import { toast } from "sonner";

const features = [
  {
    icon: Users,
    title: "Easy Student Management",
    description: "Keep all your students' info in one place - photos, contacts, classes, everything! It's like a digital yearbook that actually helps you work."
  },
  {
    icon: QrCode,
    title: "Magic QR Attendance",
    description: "Students just scan their ID cards and boom - attendance marked! No more roll calls or paper registers. Your gatekeepers will love this."
  },
  {
    icon: MessageSquare,
    title: "Auto WhatsApp Updates",
    description: "Parents get instant messages when their kids enter or leave school. No more worried phone calls - they'll know exactly when their child is safe!"
  },
  {
    icon: UserCheck,
    title: "Happy Gatekeepers",
    description: "Give your security team a simple app to scan student IDs. They'll feel like tech ninjas, and you'll get perfect attendance records."
  },
  {
    icon: BarChart3,
    title: "Smart Reports & Analytics",
    description: "Beautiful charts and reports that actually make sense. See attendance patterns, track improvements, and impress parents at meetings!"
  },
  {
    icon: Shield,
    title: "Safe & Secure Always",
    description: "Your data is protected better than a school principal's coffee stash. We take security seriously so you can focus on education."
  }
];

const comingSoonFeatures = [
  {
    icon: "🚌",
    title: "Smart Bus Tracking",
    description: "Real-time GPS tracking of school buses with live updates to parents about pickup/drop timings and route changes.",
    status: "Coming Soon"
  },
  {
    icon: "📊",
    title: "Advanced Analytics Dashboard",
    description: "AI-powered insights and predictive analytics for student performance, attendance patterns, and institutional growth.",
    status: "Coming Soon"
  },
  {
    icon: "💳",
    title: "Digital Fee Management",
    description: "Automated fee collection, payment reminders, and complete financial management with online payment gateway integration.",
    status: "Coming Soon"
  },
  {
    icon: "📚",
    title: "Online Learning Portal",
    description: "Integrated e-learning platform with assignments, quizzes, video lectures, and digital classroom management.",
    status: "Coming Soon"
  },
  {
    icon: "🎯",
    title: "Exam Management System",
    description: "Complete examination workflow from scheduling to result publishing with automated report card generation.",
    status: "Coming Soon"
  },
  {
    icon: "🏆",
    title: "Student Achievement Tracker",
    description: "Digital certificates, awards management, and comprehensive student portfolio with achievement history.",
    status: "Coming Soon"
  }
];

export default function Homepage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [school, setSchool] = useState(null); // Added state for school information
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // --- FINAL PWA LAUNCH FIX ---
    // This logic differentiates between a PWA launch by a parent and a regular website visit.
    
    // Check 1: Is the app running in standalone (PWA) mode?
    const isPwaMode = window.matchMedia('(display-mode: standalone)').matches;

    // Check 2: Is this device marked as a parent's device?
    const isParentDevice = localStorage.getItem('parentApp_mode') === 'true';
    const studentId = localStorage.getItem('parentApp_studentId');

    console.log(`[PWA Check] PWA Mode: ${isPwaMode}, Parent Device: ${isParentDevice}, Student ID: ${studentId}`);

    // ACTION: If it's a PWA AND it's a parent's device, redirect to chat immediately.
    if (isPwaMode && isParentDevice && studentId) {
      console.log('[PWA FIX] Parent PWA launch detected. Redirecting to chat...');
      navigate(createPageUrl(`ParentChat?student=${studentId}`), { replace: true });
      // Return early to prevent loading the homepage content. The loader will show during redirect.
      return; 
    }

    // If it's a regular browser visit or not a parent, load the normal homepage.
    console.log('[PWA Check] Normal website visit. Loading homepage content...');
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        // Load school data for header display name
        if (user?.school_id) {
          const schools = await SchoolEntity.filter({ id: user.school_id });
          if (schools.length > 0) {
            setSchool(schools[0]);
          } else {
            setSchool(null);
          }
        } else if (user?.email) {
          const schools = await SchoolEntity.filter({ created_by: user.email });
          if (schools.length > 0) {
            setSchool(schools[0]);
          } else {
            setSchool(null);
          }
        } else {
          setSchool(null);
        }
      } catch (error) {
        setCurrentUser(null);
        setSchool(null);
        // This is normal for logged-out users, no need for an error message.
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [navigate]);

  const handleLogin = async () => {
    try {
      const user = await User.login();
      setCurrentUser(user);
      // After successful login, attempt to fetch school info
      if (user?.school_id) {
        const schools = await SchoolEntity.filter({ id: user.school_id });
        if (schools.length > 0) {
          setSchool(schools[0]);
        }
      } else if (user?.email) {
        const schools = await SchoolEntity.filter({ created_by: user.email });
        if (schools.length > 0) {
          setSchool(schools[0]);
        }
      }
      toast.success("Logged in successfully!");
      navigate(createPageUrl("AdminDashboard"));
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  const handleGetStarted = () => {
    if (!currentUser) {
      navigate(createPageUrl("SchoolRegistration"));
    } else {
      navigate(createPageUrl("AdminDashboard"));
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      setCurrentUser(null);
      setSchool(null); // Clear school state on logout
      toast.info("Logged out successfully.");
      navigate(createPageUrl("Homepage"));
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleDashboardAccess = () => {
    if (currentUser) {
      navigate(createPageUrl("AdminDashboard"));
    } else {
      toast.info("Please log in first to access the dashboard.");
      handleLogin();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-slate-700">Loading...</p>
        </div>
      </div>
    );
  }

  // This JSX will only be rendered for normal website visitors, not for parent PWA launches.
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-lg border-2 border-blue-100">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c112913d9da1e2ebed8be6/a23e5cb66_Gemini_Generated_Image_p6574bp6574bp657.png" 
                  alt="Edumanege Logo" 
                  className="w-full h-full object-contain scale-110"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                {school?.display_name?.replace('.com', '') || "Edumanege"}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-slate-700">Welcome, {currentUser.full_name}</span>
                  <Button onClick={handleDashboardAccess} className="bg-blue-600 hover:bg-blue-700 shadow">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button onClick={handleLogout} variant="outline">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to={createPageUrl("PrivacyPolicy")} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                    Privacy
                  </Link>
                  <Link to={createPageUrl("TermsOfService")} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                    Terms
                  </Link>
                  <Button onClick={handleLogin} variant="outline">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50">
                    Start 3-Day Trial
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="text-center">
                {/* The center logo was removed from here as per the request */}

                <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl animate-fade-in">
                  <span className="block">The World's Most</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Advanced School Manager
                  </span>
                </h1>

                <p className="mt-6 text-base text-slate-600 sm:text-lg md:mt-8 md:text-xl max-w-3xl mx-auto animate-fade-in">
                  🚀 Revolutionary AI-powered school management system with real-time attendance tracking,
                  instant parent communication, and intelligent analytics. Trusted by top educational institutions worldwide.
                </p>

                <div className="mt-8 flex justify-center space-x-6 animate-fade-in">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 text-lg shadow-xl shadow-blue-500/30"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Start 3-Day Trial
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
          Why Schools Choose SmartSchool Manager ❤️
        </h2>
        <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
          We've packed everything you need to run your school smoothly, minus the stress and complexity!
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {features.map((feature, index) => (
            <Card key={index} className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white/80">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coming Soon Features Section */}
      <div className="mb-16 bg-gradient-to-r from-purple-50 to-pink-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-lg mb-4">
              🚀 Exciting Updates Ahead
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Coming Soon Features ✨
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We're constantly innovating! Here's what's coming to make your school management even more powerful.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {comingSoonFeatures.map((feature, index) => (
              <Card key={index} className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white/90 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-pink-600 text-white text-xs px-3 py-1 rounded-bl-lg font-semibold">
                  {feature.status}
                </div>
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  <div className="mt-4 h-2 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-3/5"></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Development in progress...</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-600 mb-4">
              Want to be notified when these features launch?
            </p>
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3"
            >
              Get Early Access
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
            <Link 
              to={createPageUrl("PrivacyPolicy")} 
              className="text-sm text-slate-300 hover:text-white transition-colors underline"
            >
              🔒 Privacy Policy
            </Link>
            <span className="text-slate-600">•</span>
            <Link 
              to={createPageUrl("TermsOfService")} 
              className="text-sm text-slate-300 hover:text-white transition-colors underline"
            >
              📜 Terms of Service
            </Link>

            <span className="text-slate-600">•</span>
            <Link 
              to={createPageUrl("Pricing")} 
              className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 transition-colors underline"
            >
              💎 See Pricing
            </Link>
            <span className="text-slate-600">•</span>
            <a 
              href="mailto:edumanege1@gmail.com" 
              className="text-sm text-slate-300 hover:text-white transition-colors underline"
            >
              ✉️ Contact Us
            </a>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-slate-300">
              📧 Support: <a href="mailto:edumanege1@gmail.com" className="text-blue-400 hover:text-blue-300 underline">edumanege1@gmail.com</a>
            </p>
            <p className="text-sm text-slate-300">
              🛡️ System Status: <span className="text-green-400 font-semibold">Fully Operational</span>
            </p>
            <p className="text-xs text-slate-400">
              🛡️ Patent Pending | Copyright © 2024 | All Rights Reserved | Piracy Protected
            </p>
          </div>

          <p className="text-sm text-slate-500 border-t border-slate-700 pt-4 mt-4 text-center">
            © 2024 SmartSchool Manager.
          </p>
        </div>
      </footer>
    </div>
  );
}