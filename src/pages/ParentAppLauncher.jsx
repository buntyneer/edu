import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageSquare } from 'lucide-react';

export default function ParentAppLauncher() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Checking parent session...');

  useEffect(() => {
    // This is the dedicated entry point for the Parent PWA.
    // Its ONLY job is to check for parent mode and redirect.
    const parentMode = localStorage.getItem('parentApp_mode');
    const studentId = localStorage.getItem('parentApp_studentId');

    if (parentMode === 'true' && studentId) {
      // If parent info is found, go straight to chat.
      setStatus(`Welcome back! Loading chat for student ${studentId}...`);
      navigate(createPageUrl(`ParentChat?student=${studentId}`), { replace: true });
    } else {
      // If no parent info, this isn't a parent PWA. Go to the main homepage.
      setStatus('No parent session found. Redirecting to homepage...');
      navigate(createPageUrl('Homepage'), { replace: true });
    }
  }, [navigate]);

  // A simple loader screen while the redirect happens.
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-slate-700">{status}</p>
      </div>
    </div>
  );
}