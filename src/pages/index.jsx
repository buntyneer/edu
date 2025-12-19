import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// Aapke components (Imports ko apne folder structure ke hisab se check kar lein)
import Layout from "./Layout.jsx";
import Homepage from "./Homepage";
import SchoolRegistration from "./SchoolRegistration";
import AdminDashboard from "./AdminDashboard";
import Students from "./Students";
import Gatekeepers from "./Gatekeepers";
import GatekeeperAccess from "./GatekeeperAccess";
import AttendanceInterface from "./AttendanceInterface";
import StudentRegistrationForm from "./StudentRegistrationForm";
import AttendanceReports from "./AttendanceReports";
import SchoolSettings from "./SchoolSettings";
import Update from "./Update";
import TestDashboard from "./TestDashboard";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import Messages from "./Messages";
import ParentChat from "./ParentChat";
import ParentAppLauncher from "./ParentAppLauncher";
import Batches from "./Batches";
import Holidays from "./Holidays";
import MonthlyReports from "./MonthlyReports";
import Pricing from "./Pricing";
import LicenseActivation from "./LicenseActivation";
import AdminPanel from "./AdminPanel";
import Payment from "./Payment";
import LoginSuccess from "./LoginSuccess";

// Helper component jo check karega ki Sidebar dikhana hai ya nahi
const AppContent = () => {
  const location = useLocation();

  // Wo pages jinme SIDEBAR NAHI chahiye
  const publicPaths = [
    "/",
    "/schoolregistration",
    "/studentregistrationform",
    "/privacy-policy",
    "/terms",
    "/pricing",
    "/parentapplauncher",
    "/login/success",
    "/gatekeeperaccess",
    "/attendanceinterface"
  ];

  const isPublicPage = publicPaths.includes(location.pathname.toLowerCase());

  return (
    <>
      {isPublicPage ? (
        // Bina Sidebar wale pages
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/schoolregistration" element={<SchoolRegistration />} />
          <Route path="/studentregistrationform" element={<StudentRegistrationForm />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/parentapplauncher" element={<ParentAppLauncher />} />
          <Route path="/login/success" element={<LoginSuccess />} />
          <Route path="/gatekeeperaccess" element={<GatekeeperAccess />} />
          <Route path="/attendanceinterface" element={<AttendanceInterface />} />
        </Routes>
      ) : (
        // Sidebar (Layout) wale pages
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/gatekeepers" element={<Gatekeepers />} />
            <Route path="/attendancereports" element={<AttendanceReports />} />
            <Route path="/schoolsettings" element={<SchoolSettings />} />
            <Route path="/update" element={<Update />} />
            <Route path="/testdashboard" element={<TestDashboard />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/parentchat" element={<ParentChat />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/holidays" element={<Holidays />} />
            <Route path="/monthlyreports" element={<MonthlyReports />} />
            <Route path="/licenseactivation" element={<LicenseActivation />} />
            <Route path="/adminpanel" element={<AdminPanel />} />
            <Route path="/payment" element={<Payment />} />
          </Routes>
        </Layout>
      )}
    </>
  );
};

// Main Index Component
export default function Index() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
