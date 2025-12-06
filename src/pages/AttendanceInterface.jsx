import React, { useState, useEffect, useCallback, useRef } from "react";
import { Student, Attendance, School, Batch } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { LogOut, School as SchoolIcon, CheckCircle, X, AlertTriangle, CameraOff, Camera, RefreshCw, ScanLine, UserSearch, Clock, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, isBefore, parse, parseISO, isToday, isYesterday } from 'date-fns';

// ✅ CONSISTENT: Use same timezone logic everywhere
const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    let isoString = timestamp;
    // Ensure timestamp is treated as UTC if no timezone info is present,
    // so Date object correctly converts it to local time for display.
    if (!timestamp.endsWith('Z') && !timestamp.includes('+')) {
      isoString = timestamp + 'Z';
    }
    
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const isToday = 
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      
      return `${hours}:${minutesStr} ${ampm}`;
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
};

// --- Reusable Components ---
const LoadingScreen = ({ text }) => (
  <div className="flex items-center justify-center h-screen bg-black">
    <div className="text-center">
      <div role="status" className="flex justify-center items-center">
        <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
      <p className="text-white mt-4">{text}</p>
    </div>
  </div>
);

const ErrorScreen = ({ onLogout, message }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
    <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
    <h1 className="text-2xl font-bold text-center mb-2">Loading Error</h1>
    <p className="text-gray-400 text-center mb-6">{message}</p>
    <Button onClick={onLogout} variant="destructive">
      <LogOut className="w-4 h-4 mr-2" />
      Return to Login
    </Button>
  </div>
);

// Helper function to check if gatekeeper is on duty NOW
const isOnDutyNow = (shiftStart, shiftEnd) => {
  if (!shiftStart || !shiftEnd) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = shiftStart.split(':').map(Number);
  const [endHour, endMin] = shiftEnd.split(':').map(Number);
  
  const shiftStartMinutes = startHour * 60 + startMin;
  let shiftEndMinutes = endHour * 60 + endMin;

  // Handle shifts that cross midnight
  if (shiftEndMinutes < shiftStartMinutes) {
    if (currentTime < shiftStartMinutes) { // If current time is before shift start, assume it's for next day's end
      shiftEndMinutes += 24 * 60; // Add 24 hours to end time
    } else { // If current time is after shift start, assume it's for today's end
      // No change needed, current time already past midnight in this context
    }
  }
  
  return currentTime >= shiftStartMinutes && currentTime <= shiftEndMinutes;
};

export default function AttendanceInterface() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scannerIntervalRef = useRef(null);
  const isMounted = useRef(true);
  const barcodeDetectorRef = useRef(null);

  // State Management
  const [loadingState, setLoadingState] = useState('loading');
  const [gatekeeper, setGatekeeper] = useState(null);
  const [school, setSchool] = useState(null);
  const [verifyingStudent, setVerifyingStudent] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('off');
  const [cameraError, setCameraError] = useState(null);
  const [manualStudentId, setManualStudentId] = useState("");
  const [todayScans, setTodayScans] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [scanStatus, setScanStatus] = useState('Initializing...');
  const [isApiVerifying, setIsApiVerifying] = useState(false); // To lock verification button
  const [scannedId, setScannedId] = useState(""); // To hold scanned ID before verification
  const [batches, setBatches] = useState([]); // Store batches for reference

  const MAX_RETRIES = 2;

  // Get role name based on institute type
  const getRoleName = useCallback(() => {
    if (!school) return "Gatekeeper";
    return school.institute_type === 'school' ? 'Gatekeeper' : 'Incharge';
  }, [school]);

  // --- Camera & Data Loading ---
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      console.log("[AttendanceInterface] Stopping camera stream.");
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!isMounted.current) return;
    setCameraStatus('initializing');
    setCameraError(null);

    try {
        console.log(`[AttendanceInterface] Camera start attempt #${retryCount + 1}`);

        const streamPromise = navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }
        });
        
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("camera-timeout")), 5000)
        );

        const stream = await Promise.race([streamPromise, timeoutPromise]);

        if (isMounted.current && videoRef.current) {
            console.log("[AttendanceInterface] Camera stream acquired successfully!");
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            await videoRef.current.play();
            setCameraStatus('active');
            toast.success("Camera ready!");
            setRetryCount(0);
        } else {
            if (stream) stream.getTracks().forEach(track => track.stop());
        }
    } catch (error) {
        console.error(`[AttendanceInterface] Camera failed on attempt ${retryCount + 1}:`, error);
        if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
        } else {
            let message = "Unable to access camera. Please check permissions.";
            if (error.message === 'camera-timeout') {
                message = "Camera took too long to start. Please try again.";
            } else if (error.name === 'NotAllowedError') {
                message = "Camera permission denied. Please enable it in browser settings.";
            } else if (error.name === 'NotFoundError') {
                message = "No camera found on your device.";
            }
            setCameraError(message);
            setCameraStatus('error');
        }
    }
  }, [retryCount]);

  useEffect(() => {
    isMounted.current = true;
    const loadData = async () => {
      setLoadingState('loading');
      try {
        const storedGatekeeper = localStorage.getItem("gatekeeper");
        if (!storedGatekeeper) {
          navigate(createPageUrl("GatekeeperAccess"));
          return;
        }
        const gatekeeperData = JSON.parse(storedGatekeeper);
        const schools = await School.filter({ id: gatekeeperData.school_id });
        if (schools.length === 0) throw new Error("School not found.");
        
        setGatekeeper(gatekeeperData);
        setSchool(schools[0]);
        
        // Load batches for checking late entry/early exit, regardless of institute type
        // as batches define entry/exit times for students.
        if (schools[0].id) {
          const fetchedBatches = await Batch.filter({ school_id: schools[0].id });
          setBatches(fetchedBatches);
          console.log('[AttendanceInterface] Loaded batches:', fetchedBatches.length);
        } else {
          setBatches([]); // Clear batches if no school_id
        }
        
        // Don't fetch today's scans to prevent rate limits
        setTodayScans(0);
        
        setLoadingState('loaded');
      } catch (error) {
        console.error("Failed to load initial data:", error);
        toast.error("Failed to load profile data.");
        setLoadingState('error');
      }
    };
    loadData();
    return () => { isMounted.current = false; stopCamera(); clearInterval(scannerIntervalRef.current); };
  }, [navigate, stopCamera]);

  useEffect(() => {
    if (loadingState === 'loaded' && cameraStatus !== 'active' && cameraStatus !== 'error') {
      startCamera();
    }
  }, [loadingState, retryCount, cameraStatus, startCamera]);

  const handleLogout = useCallback(() => {
    stopCamera();
    localStorage.removeItem("gatekeeper");
    navigate(createPageUrl("GatekeeperAccess"));
    toast.info("You have been logged out.");
  }, [navigate, stopCamera]);

  const retryCamera = () => {
    setRetryCount(0);
    setCameraStatus('off');
    setTimeout(() => {
        setCameraStatus('initializing');
    }, 100)
  };
  
  // Send message to parent with correct device time and institute name
  const sendParentMessage = useCallback(async (student, type, now) => {
    try {
      console.log(`Sending ${type} message to parent for:`, student.full_name);
      
      const { createConversation } = await import('@/api/functions');
      const { sendChatMessage } = await import('@/api/functions');
      
      const parentId = student.parent_email || student.parent_whatsapp || `parent_${student.id}`;
      
      const convResponse = await createConversation({
        student_id: student.id,
        parent_user_id: parentId,
        conversation_type: 'parent_principal'
      });

      if (convResponse.data && convResponse.data.conversation) {
        // Use date-fns for formatting
        const timeStr = format(now, 'p'); // 'p' is local time e.g., '1:00 PM'
        const dateStr = format(now, 'MMMM dd, yyyy');
        
        const message = `🏫 Attendance Update: *${school?.school_name || 'Institute'}*\n\nYour child *${student.full_name}* has ${type === 'entry' ? 'entered' : 'left'} the premises at *${timeStr}*.\n\nDate: ${dateStr}`;

        await sendChatMessage({
          conversation_id: convResponse.data.conversation.id,
          message_text: message,
          sender_type: 'principal'
        });

        console.log(`${type} message sent successfully to parent app.`);
        
        setTimeout(() => {
          toast.success(`📱 Parent notified of ${type}!`, {
            description: `${student.full_name}'s attendance sent to Parent App.`
          });
        }, 1500);
      } else {
        throw new Error("Failed to get conversation data.");
      }
    } catch (error) {
      console.error(`Failed to send ${type} message to parent:`, error);
      toast.error(`Failed to notify parent of ${student.full_name}'s ${type}.`);
    }
  }, [school]);
  
  // --- MODIFIED: VERIFICATION IS NOW MANUAL ---
  const handleVerification = useCallback(async (studentIdToFind) => {
    if (!gatekeeper || !studentIdToFind || isApiVerifying) {
      return;
    }
    
    setIsApiVerifying(true);
    setScanStatus('Verifying ID...');

    try {
      const students = await Student.filter({ 
        school_id: gatekeeper.school_id, 
        student_id: studentIdToFind 
      });
      
      if (students.length > 0) {
        const student = students[0];
        
        // Calculate if student is late for scanner display
        const now = new Date();
        let expectedEntryTimeStr = school?.school_start_time || '08:00';
        
        if (student.batch_ids && Array.isArray(student.batch_ids) && student.batch_ids.length > 0 && batches.length > 0) {
          const studentBatch = batches.find(b => student.batch_ids.includes(b.id));
          if (studentBatch && studentBatch.entry_time) {
            expectedEntryTimeStr = studentBatch.entry_time;
          }
          if (student.student_batch_timings && Array.isArray(student.student_batch_timings) && student.student_batch_timings.length > 0) {
            const customTiming = student.student_batch_timings[0];
            if (customTiming.custom_entry_time) {
              expectedEntryTimeStr = customTiming.custom_entry_time;
            }
          }
        } else if (student.batch_id && batches.length > 0) {
          const studentBatch = batches.find(b => b.id === student.batch_id);
          if (studentBatch && studentBatch.entry_time) {
            expectedEntryTimeStr = studentBatch.entry_time;
          }
        }
        
        const expectedEntryDate = parse(expectedEntryTimeStr, 'HH:mm', now);
        const isLateEntry = !isBefore(now, expectedEntryDate);
        
        // Attach late status to student object for display
        student._isLateEntry = isLateEntry;
        student._expectedEntryTime = expectedEntryTimeStr;
        
        setVerifyingStudent(student);
        if (navigator.vibrate) navigator.vibrate([200]);
        toast.success(`Student Found: ${student.full_name}`);
        setScanStatus('Student verified successfully!');
        setScannedId("");
      } else {
        toast.error("Student ID not found in records.");
        setScanStatus(`Invalid ID: ${studentIdToFind}`);
        if (navigator.vibrate) navigator.vibrate(500);
      }
    } catch (error) {
      console.error("Verification error:", error);
      if (String(error).includes('429')) {
        toast.error("Too many requests. Please wait 10 seconds before trying again.");
        setScanStatus('Rate limited - please wait');
      } else {
        toast.error("Verification failed. Please check connection and try again.");
        setScanStatus('Error during verification.');
      }
    } finally {
        setTimeout(() => {
            if(isMounted.current) {
                setIsApiVerifying(false);
                if(!verifyingStudent) setScanStatus('Ready to scan next ID.');
            }
        }, 1500);
    }
  }, [gatekeeper, isApiVerifying, verifyingStudent, school, batches]);

  useEffect(() => {
    if ('BarcodeDetector' in window && !barcodeDetectorRef.current) {
      try {
        barcodeDetectorRef.current = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'ean_13'],
        });
        console.log("[AttendanceInterface] BarcodeDetector initialized successfully.");
      } catch (e) {
        console.error("[AttendanceInterface] Failed to initialize BarcodeDetector:", e);
        setScanStatus('Barcode scanning not supported on this browser.');
      }
    }
  }, []);

  // --- MODIFIED: SCANNING ONLY DETECTS, DOES NOT VERIFY ---
  useEffect(() => {
    if (cameraStatus !== 'active' || verifyingStudent || isApiVerifying) {
      if (scannerIntervalRef.current) {
        clearInterval(scannerIntervalRef.current);
        scannerIntervalRef.current = null;
      }
      return;
    }
    
    if (!scannerIntervalRef.current) {
      if (!barcodeDetectorRef.current) {
        setScanStatus('Barcode scanner not supported.');
        return; 
      }

      scannerIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await barcodeDetectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0 && barcodes[0].rawValue !== scannedId) { // Only update if new ID and different
            const newScannedId = barcodes[0].rawValue;
            console.log('Barcode detected:', newScannedId);
            setScannedId(newScannedId);
            setScanStatus(`ID Scanned: ${newScannedId}`);
            if (navigator.vibrate) navigator.vibrate(100);
          }
        } catch (e) {
          console.error('[AttendanceInterface] Barcode detection failed:', e);
          setScanStatus('Error during scan.');
        }
      }, 1000); // Scan every 1 second
      setScanStatus('Point camera at Student ID Card');
    }

    return () => {
      if (scannerIntervalRef.current) {
        clearInterval(scannerIntervalRef.current);
        scannerIntervalRef.current = null;
      }
    };
  }, [cameraStatus, verifyingStudent, isApiVerifying, scannedId]);

  const handleAttendanceConfirm = useCallback(async (student, isExit = false) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = new Date();

    try {
      console.log(`\n🔍 Recording ${isExit ? 'EXIT' : 'ENTRY'} for: ${student.full_name}`);
      console.log(`⏰ Current Time: ${format(now, 'hh:mm:ss a')}`);
      
      if (isExit) {
        let expectedExitTimeStr = school?.school_end_time || '15:00';
        let timeSource = 'School Default';

        if (student.batch_ids && Array.isArray(student.batch_ids) && student.batch_ids.length > 0 && batches.length > 0) {
          const studentBatch = batches.find(b => student.batch_ids.includes(b.id));
          if (studentBatch && studentBatch.exit_time) {
            expectedExitTimeStr = studentBatch.exit_time;
            timeSource = `Batch: ${studentBatch.batch_name}`;
          }
          if (student.student_batch_timings && Array.isArray(student.student_batch_timings) && student.student_batch_timings.length > 0) {
            const customTiming = student.student_batch_timings[0];
            if (customTiming.custom_exit_time) {
              expectedExitTimeStr = customTiming.custom_exit_time;
              timeSource = 'Custom Student Timing';
            }
          }
        } else if (student.batch_id && batches.length > 0) {
          const studentBatch = batches.find(b => b.id === student.batch_id);
          if (studentBatch && studentBatch.exit_time) {
            expectedExitTimeStr = studentBatch.exit_time;
            timeSource = `Batch (old): ${studentBatch.batch_name}`;
          }
        }
        
        console.log(`\n📊 COMPARISON (EXIT):`);
        console.log(`   Expected Exit Time: ${expectedExitTimeStr} (Source: ${timeSource})`);
        console.log(`   Current Time: ${format(now, 'HH:mm:ss')}`);

        const expectedExitDate = parse(expectedExitTimeStr, 'HH:mm', now);
        console.log(`   Expected Exit Date Object: ${expectedExitDate}`);
        console.log(`   Current Date Object: ${now}`);

        const isEarlyDeparture = isBefore(now, expectedExitDate);
        console.log(`   Is Early Departure? ${isEarlyDeparture ? '⚠️ YES - EARLY' : '✅ NO - ON TIME/LATE'}`);
        
        // Find the latest entry for this student today that does NOT have an exit time
        const recentEntries = await Attendance.filter({
            student_id: student.id,
            attendance_date: today,
            exit_time: null // Find records where exit_time is not set
        }, "-created_date", 1); // Get the most recent open entry

        if (recentEntries.length > 0) {
            const entryToUpdate = recentEntries[0];
            
            await Attendance.update(entryToUpdate.id, {
                exit_time: now.toISOString(),
                // If it's an early departure, set status. Otherwise, keep existing status (e.g., 'late' from entry).
                status: isEarlyDeparture ? 'early_departure' : entryToUpdate.status, 
                notes: `${entryToUpdate.notes ? entryToUpdate.notes + ' | ' : ''}Exit recorded by ${getRoleName()} | Expected: ${expectedExitTimeStr} (${timeSource})`.trim()
            });
            toast.success("Exit Recorded!");
            await sendParentMessage(student, 'exit', now);
            
            // Send FCM push notification
            try {
              const { sendAttendanceNotification } = await import('@/api/functions');
              await sendAttendanceNotification({
                student_id: student.id,
                attendance_type: 'exit',
                school_id: gatekeeper.school_id
              });
            } catch (err) {
              console.log('[FCM] Failed to send exit notification:', err.message);
            }

        } else {
            toast.error("No open entry found for this student today.", {
                description: "Cannot record an exit without a corresponding entry."
            });
        }
      } else { // Entry - Always mark as PRESENT, no late checking
        // Always create a new record for an entry
        await Attendance.create({ 
          school_id: gatekeeper.school_id, 
          student_id: student.id, 
          gatekeeper_id: gatekeeper.id, 
          entry_time: now.toISOString(), 
          attendance_date: today, 
          status: 'present',
          is_late: student._isLateEntry, // Use the calculated late status
          notes: `Entry recorded by ${getRoleName()}`
        });
        
        toast.success("✅ Entry Recorded!");
        await sendParentMessage(student, 'entry', now);
        
        // Send FCM push notification
        try {
          const { sendAttendanceNotification } = await import('@/api/functions');
          await sendAttendanceNotification({
            student_id: student.id,
            attendance_type: 'entry',
            school_id: gatekeeper.school_id
          });
        } catch (err) {
          console.log('[FCM] Failed to send entry notification:', err.message);
        }
      }
      
      setTodayScans(prev => prev + 1);
    } catch (error) {
      console.error("❌ Attendance error:", error);
      if (error.message && error.message.includes('429')) {
        toast.error("Too many requests. Please wait before recording attendance again.");
      } else {
        toast.error("Failed to record attendance");
      }
    }
    
    setVerifyingStudent(null);
    setManualStudentId("");
    setScanStatus('Ready for next scan.');
  }, [gatekeeper, school, batches, sendParentMessage, getRoleName]);
  
  if (loadingState === 'loading') {
    return <LoadingScreen text="Loading Profile..." />;
  }

  if (loadingState === 'error') {
    return <ErrorScreen onLogout={handleLogout} message="Failed to load gatekeeper profile." />;
  }
  
  const showInitializing = cameraStatus === 'initializing' || cameraStatus === 'off';

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 z-20 bg-black/80 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c112913d9da1e2ebed8be6/a23e5cb66_Gemini_Generated_Image_p6574bp6574bp657.png" 
                alt="Logo" 
                className="w-full h-full object-contain p-1" 
              />
            </div>
            <div>
              <h1 className="font-bold">{school?.school_name} Scanner</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-300">{gatekeeper?.full_name} - {getRoleName()}</p>
                {gatekeeper && gatekeeper.shift_start && gatekeeper.shift_end && isOnDutyNow(gatekeeper.shift_start, gatekeeper.shift_end) ? (
                  <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/50 rounded-full text-xs text-green-400 font-medium">
                    🟢 On Duty
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-500/20 border border-slate-500/50 rounded-full text-xs text-slate-400 font-medium">
                    ⚪ Off Duty
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{todayScans}</div>
              <div className="text-xs text-gray-400">Today's Scans</div>
            </div>
            <Button onClick={handleLogout} variant="destructive" size="sm">
              <LogOut className="w-4 h-4 mr-1" /> Exit
            </Button>
          </div>
        </div>
        
        {/* Shift Info */}
        {gatekeeper && gatekeeper.shift_start && gatekeeper.shift_end && gatekeeper.gate_number && (
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400 bg-slate-800/50 rounded-lg p-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Shift: {gatekeeper.shift_start} - {gatekeeper.shift_end}</span>
            </div>
            <div className="w-px h-4 bg-gray-600"></div>
            <div className="flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>Gate: {gatekeeper.gate_number}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-grow relative flex items-center justify-center p-4">
        
        {showInitializing && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white text-lg">Initializing Camera...</p>
            <p className="text-gray-400 text-sm mt-2">{retryCount > 0 ? `Attempt ${retryCount + 1}` : 'Please wait'}</p>
          </div>
        )}
        
        {cameraStatus === 'error' && (
          <div className="text-center p-6 bg-gray-900/90 rounded-lg max-w-sm w-full mx-4">
            <CameraOff className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="font-semibold text-orange-400 mb-2">Camera Issue</h3>
            <p className="text-sm text-gray-300 mb-6">{cameraError}</p>
            <div className="space-y-4">
              <Button 
                onClick={retryCamera}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Camera Again
              </Button>
              
              <div className="border-t border-gray-700 pt-4">
                <Label htmlFor="manual-id" className="text-white text-sm">Manual Student ID Entry</Label>
                <Input 
                  id="manual-id"
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value.toUpperCase())}
                  className="bg-gray-800 border-gray-600 text-white text-center mt-2"
                  placeholder="Enter Student ID (e.g., S-12345)"
                />
                <Button 
                  onClick={() => handleVerification(manualStudentId)} 
                  disabled={!manualStudentId.trim() || isApiVerifying} 
                  className="w-full mt-2 bg-green-600 hover:bg-green-700"
                >
                  Verify Student ID
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className={`w-full h-full absolute inset-0 ${cameraStatus === 'active' ? 'visible' : 'invisible'}`}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40"></div>
            
            {/* Scanner Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                {/* Visual Finder */}
                <div className="w-full max-w-sm h-48 relative mb-4">
                    {/* Corner Markers */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                    
                    {/* Scanning Line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan-line"></div>
                </div>

                {/* Status & Action Area */}
                <div className="bg-black/70 backdrop-blur-sm p-4 rounded-xl w-full max-w-sm text-center">
                    <p className="text-white text-sm h-10 flex items-center justify-center">
                        <ScanLine className="w-4 h-4 mr-2 animate-pulse" />
                        {scanStatus}
                    </p>
                    <Button 
                        onClick={() => handleVerification(scannedId)}
                        disabled={!scannedId || isApiVerifying}
                        className="w-full mt-2 bg-green-600 hover:bg-green-700 font-bold text-lg h-12"
                    >
                        <UserSearch className="w-5 h-5 mr-2" />
                        {isApiVerifying ? 'Verifying...' : 'Verify Student'}
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {verifyingStudent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30"
          >
            <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full text-black">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Student Verified</h3>
                <p className="text-gray-500 text-sm">ID: {verifyingStudent.student_id}</p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{verifyingStudent.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Class:</span>
                  <span>{verifyingStudent.class} - {verifyingStudent.section}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Time:</span>
                  <span className={`font-bold text-lg ${verifyingStudent._isLateEntry ? 'text-red-600' : 'text-green-600'}`}>
                    {new Date().toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit', 
                      second: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleAttendanceConfirm(verifyingStudent, false)} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                >
                  ENTRY
                </Button>
                <Button 
                  onClick={() => handleAttendanceConfirm(verifyingStudent, true)} 
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3"
                >
                  EXIT
                </Button>
                <Button 
                  onClick={() => {
                    setVerifyingStudent(null);
                    setScanStatus('Ready for next scan.');
                  }} 
                  variant="outline" 
                  className="px-4"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS Styles */}
      <style>{`
        .animate-scan-line {
          animation: scan 2.5s infinite linear;
        }
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(192px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}