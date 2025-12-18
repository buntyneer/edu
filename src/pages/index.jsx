import Layout from "./Layout.jsx";
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
import Homepage from "./Homepage";
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

// New page for Google login success
import LoginSuccess from "./LoginSuccess";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    SchoolRegistration,
    AdminDashboard,
    Students,
    Gatekeepers,
    GatekeeperAccess,
    AttendanceInterface,
    StudentRegistrationForm,
    AttendanceReports,
    SchoolSettings,
    Update,
    TestDashboard,
    Homepage,
    PrivacyPolicy,
    TermsOfService,
    Messages,
    ParentChat,
    ParentAppLauncher,
    Batches,
    Holidays,
    MonthlyReports,
    Pricing,
    LicenseActivation,
    AdminPanel,
    Payment,
    LoginSuccess, // ← added here
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) url = url.slice(0, -1);
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) urlLastPart = urlLastPart.split('?')[0];
    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                {/* Root should show marketing homepage */}
                <Route path="/" element={<Homepage />} />
                {/* Registration routes */}
                <Route path="/SchoolRegistration" element={<SchoolRegistration />} />
                <Route path="/schoolregistration" element={<SchoolRegistration />} />
                {/* Dashboard routes */}
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/Students" element={<Students />} />
                <Route path="/Gatekeepers" element={<Gatekeepers />} />
                <Route path="/GatekeeperAccess" element={<GatekeeperAccess />} />
                <Route path="/AttendanceInterface" element={<AttendanceInterface />} />
                <Route path="/StudentRegistrationForm" element={<StudentRegistrationForm />} />
                <Route path="/AttendanceReports" element={<AttendanceReports />} />
                <Route path="/SchoolSettings" element={<SchoolSettings />} />
                <Route path="/Update" element={<Update />} />
                <Route path="/TestDashboard" element={<TestDashboard />} />
                <Route path="/Homepage" element={<Homepage />} />
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                <Route path="/TermsOfService" element={<TermsOfService />} />
                <Route path="/Messages" element={<Messages />} />
                <Route path="/ParentChat" element={<ParentChat />} />
                <Route path="/ParentAppLauncher" element={<ParentAppLauncher />} />
                <Route path="/Batches" element={<Batches />} />
                <Route path="/Holidays" element={<Holidays />} />
                <Route path="/MonthlyReports" element={<MonthlyReports />} />
                <Route path="/Pricing" element={<Pricing />} />
                <Route path="/LicenseActivation" element={<LicenseActivation />} />
                <Route path="/AdminPanel" element={<AdminPanel />} />
                <Route path="/Payment" element={<Payment />} />
                
                {/* New route for Google login success */}
                <Route path="/login/success" element={<LoginSuccess />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
