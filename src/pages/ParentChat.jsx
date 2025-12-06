import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Send, School, ArrowLeft, Bell,
  CheckCheck, User, RefreshCw, Search, Check, AlertTriangle,
  Copy, Trash2
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Conversation, Message, Student, School as SchoolEntity } from "@/api/entities";
import { sendChatMessage } from "@/api/functions";
import { getChatMessages } from "@/api/functions";

// Helper function to register the service worker for push notifications
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported in this browser');
    return null;
  }

  try {
    const swUrl = '/api/functions/getServiceWorker';
    
    // Register service worker
    const registration = await navigator.serviceWorker.register(swUrl, { 
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('[SW] Service Worker registered with scope:', registration.scope);
    
    // Force update to get latest version
    await registration.update();
    
    // Wait for service worker to be ready
    const ready = await navigator.serviceWorker.ready;
    console.log('[SW] Service Worker is ready and active');
    
    return ready;
  } catch (error) {
    console.warn('[SW] Service Worker registration failed:', error.message);
    return null;
  }
}

// ✅ FINAL FIX: Clean timezone conversion - UTC to Local
const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    // Ensure timestamp is treated as UTC
    let isoString = timestamp;
    if (!timestamp.endsWith('Z') && !timestamp.includes('+')) {
      // No timezone info - assume UTC
      isoString = timestamp + 'Z';
    }
    
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    // Always show time in 12-hour format with AM/PM
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
};

// WhatsApp-style date separator formatter
const getDateSeparator = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    let isoString = timestamp;
    if (!timestamp.endsWith('Z') && !timestamp.includes('+')) {
      isoString = timestamp + 'Z';
    }
    
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      // Format: 2 November 2025
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  } catch (e) {
    return '';
  }
};

// Group messages by date for WhatsApp-style display
const groupMessagesByDate = (messages) => {
  const groups = [];
  let currentDate = null;
  
  messages.forEach((message) => {
    const messageDate = getDateSeparator(message.created_date);
    
    if (messageDate !== currentDate) {
      groups.push({ type: 'date', date: messageDate });
      currentDate = messageDate;
    }
    
    groups.push({ type: 'message', data: message });
  });
  
  return groups;
};

// FIXED: Enhanced PWA Detection - This component should ONLY be used for Parent Chat
export default function ParentChat() {
  const navigate = useNavigate();
  const [currentParent, setCurrentParent] = useState(null);
  const [school, setSchool] = useState(null);
  const [student, setStudent] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showChatList, setShowChatList] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState('default');
  
  // States for long press message actions
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const isActiveTabRef = useRef(true);

  // Handle Android/Mobile back button - go to chat list instead of closing PWA
  useEffect(() => {
    const handleBackButton = (e) => {
      if (!showChatList && selectedConversation) {
        e.preventDefault();
        handleBackToList();
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Push initial state to prevent immediate back
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [showChatList, selectedConversation]);

  // --- FIREBASE FCM INITIALIZATION ---
  useEffect(() => {
    const initFCM = async () => {
      // Skip FCM if student not loaded yet
      if (!student || !student.id) {
        return;
      }
      
      try {
        // Dynamically import Firebase helpers (only in browser)
        const { requestFCMToken, onForegroundMessage } = await import('@/components/firebase/fcm-helper');
        
        console.log('[FCM] Initializing Firebase Cloud Messaging...');
        
        // Request FCM token
        const fcmToken = await requestFCMToken();
        
        if (fcmToken) {
          console.log('[FCM] ✅ Token received, saving to student record...');
          
          // Save FCM token to student record
          try {
            await Student.update(student.id, { 
              fcm_token: fcmToken,
              fcm_token_updated_at: new Date().toISOString()
            });
            console.log('[FCM] ✅ Token saved successfully!');
          } catch (error) {
            console.error('[FCM] Failed to save token:', error);
          }
        }
        
        // Listen for foreground messages
        onForegroundMessage((payload) => {
          console.log('[FCM] Foreground notification:', payload);
          showNotification(
            payload.notification?.title || 'New Message',
            payload.notification?.body || 'You have a new message'
          );
        });
        
      } catch (err) {
        console.warn('[FCM] Could not initialize Firebase (this is OK):', err.message);
        
        // Fallback to existing web-push service worker - silently fail if not available
        try {
          const registration = await registerServiceWorker();
          if (registration) {
            console.log('[PWA] Using fallback web-push service worker');
          }
        } catch (swErr) {
          console.warn('[PWA] No push notifications available (this is OK)');
        }
      }
    };
    
    // Only initialize when student data is loaded
    if (student && student.id) {
      initFCM().catch(err => {
        console.warn('[FCM] Init failed silently:', err.message);
      });
    }
  }, [student]);

  // --- ENHANCED PWA DETECTION ---
  useEffect(() => {
    // This is the ONLY place where parent mode is set.
    // When a parent opens the chat link, we "tag" their browser.
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('student');
    
    if (studentId) {
      console.log(`[PWA] ParentChat opened. Setting parent mode for student: ${studentId}`);
      localStorage.setItem('parentApp_studentId', studentId);
      localStorage.setItem('parentApp_mode', 'true');
    }
    // Don't set error here - let loadInitialData handle it
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // FIXED: Enhanced notification function with local time
  const showNotification = useCallback((title, body) => {
    console.log('[Notification] Attempting to show notification...');
    
    // 1. Vibrate
    if ('vibrate' in navigator) {
      console.log('[Notification] Triggering vibration...');
      navigator.vibrate([300, 150, 300, 150, 300]);
    }

    // 2. Play Sound
    try {
      console.log('[Notification] Attempting to play sound...');
      const beep = () => {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
      };
      beep();
    } catch (error) {
      console.error('[Notification] Could not play sound:', error);
    }

    // 3. Show Visual Toast
    toast(title, { 
      description: body,
      duration: 5000,
      style: {
        backgroundColor: '#22c55e',
        color: 'white',
        border: '1px solid #16a34a'
      }
    });

    // 4. Show Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('[Notification] Creating browser notification...');
      
      try {
        const notification = new Notification(title, {
          body: body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'school-chat-' + Date.now(),
          requireInteraction: false,
          silent: false
        });
        
        setTimeout(() => {
          notification.close();
        }, 8000);
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

      } catch (error) {
        console.error('[Notification] Failed to create notification:', error);
      }
    }
    
  }, []);

  // --- Push Notification Subscription ---
  const subscribeUserToPush = useCallback(async () => {
    if (!('PushManager' in window)) {
      console.warn('[Push] Push messaging is not supported');
      toast.error('Push notifications not supported in this browser');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service workers not supported');
      toast.error('Service workers not supported');
      return false;
    }

    try {
      console.log('[Push] Waiting for service worker...');
      
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push] Service worker ready, checking subscription...');
      
      let subscription = await registration.pushManager.getSubscription();

      // If no subscription exists, create one
      if (!subscription) {
        console.log('[Push] No existing subscription, creating new one...');
        
        const vapidPublicKey = 'BMeh6rgrAzu8nIsWvyf3ORB3j97fmMp3H0bXz7p5TqqdshBqA_u4mBv3-rS4sXWz-v-hIq1y-a8iZp6-wA8iJ_E';
        
        // Convert VAPID key to Uint8Array
        const urlBase64ToUint8Array = (base64String) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        
        console.log('[Push] ✅ New subscription created:', subscription.endpoint);
        toast.success('🔔 Push notifications enabled!');
      } else {
        console.log('[Push] Existing subscription found:', subscription.endpoint);
      }
      
      // Save subscription to student record for backend push notifications
      if (student && student.id) {
        try {
          const subscriptionData = subscription.toJSON();
          console.log('[Push] Saving subscription to student:', student.id);
          console.log('[Push] Full subscription:', JSON.stringify(subscriptionData));
          
          // Verify subscription has required fields
          if (!subscriptionData.endpoint || !subscriptionData.keys) {
            console.error('[Push] Invalid subscription data - missing endpoint or keys');
            toast.error('Invalid notification subscription');
            return false;
          }
          
          await Student.update(student.id, { 
            push_subscription: subscriptionData
          });
          
          // Verify it was saved
          const [updatedStudent] = await Student.filter({ id: student.id });
          if (updatedStudent?.push_subscription?.endpoint) {
            console.log('[Push] ✅ Subscription VERIFIED and saved!');
            toast.success('🔔 Notifications enabled! You will receive alerts even when app is closed.');
          } else {
            console.error('[Push] ❌ Subscription NOT saved properly');
            toast.error('Failed to save notification settings');
          }
        } catch (error) {
          console.error('[Push] ❌ Failed to save subscription:', error);
          toast.error('Failed to save notification settings: ' + error.message);
        }
      } else {
        console.warn('[Push] No student ID available to save subscription');
      }
      
      return true;
    } catch (error) {
      console.error('[Push] Failed to subscribe:', error);
      toast.error('Failed to enable notifications: ' + error.message);
      return false;
    }
  }, [student]); 
  
  // Request and monitor notification permission - Auto setup push subscription
  useEffect(() => {
    if (!('Notification' in window)) {
      console.warn('[Notification] Not supported in this browser');
      return;
    }
    
    setNotificationPermissionStatus(Notification.permission);
    
    const setupPushNotifications = async () => {
      if (Notification.permission === 'granted') {
        console.log('[Notification] Permission already granted, setting up push...');
        await subscribeUserToPush();
      } else if (Notification.permission === 'default') {
        // Auto-request after 2 seconds
        setTimeout(async () => {
          const permission = await Notification.requestPermission();
          setNotificationPermissionStatus(permission);
          
          if (permission === 'granted') {
            console.log('[Notification] Permission granted, setting up push...');
            await subscribeUserToPush();
          }
        }, 2000);
      }
    };
    
    // Only setup when student data is loaded
    if (student && student.id) {
      setupPushNotifications();
    }
  }, [student, subscribeUserToPush]); 

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support desktop notification');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermissionStatus(permission);
      
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
        const subscribed = await subscribeUserToPush();
        
        if (subscribed) {
          // Test notification
          showNotification('School Chat', 'You will now receive new message alerts.');
        }
      } else {
        toast.error('Notifications not enabled. You might miss important messages.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications.');
    }
  };
  
  // ENHANCED: Real-time message refresh with faster polling
  const refreshMessages = useCallback(async () => {
    if (!selectedConversation || !currentParent || !isOnline) return;

    try {
      const response = await getChatMessages({
        conversation_id: selectedConversation.id,
        user_type: 'parent',
        parent_user_id: currentParent.id
      });

      if (response.data && response.data.messages) {
        const newMessages = response.data.messages;
        const newMessageCount = newMessages.length;
        
        console.log(`Messages check: current=${lastMessageCountRef.current}, new=${newMessageCount}`);

        // Check for new messages and show notification
        if (newMessageCount > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
          console.log('🚨 NEW MESSAGE DETECTED!');
          const latestMessage = newMessages[newMessages.length - 1];
          
          // Show notification if message is from teacher/principal
          if (latestMessage.sender_type !== 'parent' && notificationPermissionStatus === 'granted') {
            const now = Date.now();
            if (now - lastNotificationTime > 2000) { // Reduced to 2 seconds
              console.log('[Refresh] Triggering notification for new message from:', latestMessage.sender_type);
              
              const contactName = getContactName(selectedConversation);
              const messagePreview = latestMessage.message_text.length > 50 
                ? latestMessage.message_text.substring(0, 50) + '...' 
                : latestMessage.message_text;
              
              showNotification(
                `${contactName} - ${school?.school_name || 'School'}`,
                messagePreview
              );
              
              setLastNotificationTime(now);
            }
          }
        }

        setMessages(newMessages);
        lastMessageCountRef.current = newMessageCount;
        setHasError(false);
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
      setHasError(true);
    }
  }, [selectedConversation, currentParent, isOnline, lastNotificationTime, showNotification, notificationPermissionStatus, school]);

  // Track if tab is active - ENHANCED FOR BACKGROUND NOTIFICATIONS
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveTabRef.current = !document.hidden;
      console.log(`[Visibility] Tab is now ${isActiveTabRef.current ? 'active' : 'hidden'}`);
      
      if (isActiveTabRef.current && selectedConversation) {
        refreshMessages();
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [selectedConversation, refreshMessages]);

  // Main data loading effect - FIXED
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        // First check URL, then localStorage
        let studentId = new URLSearchParams(window.location.search).get('student');
        
        if (!studentId) {
          // Try to get from localStorage (for PWA mode / app reopen)
          studentId = localStorage.getItem('parentApp_studentId');
        }
        
        // If still no studentId, show error
        if (!studentId) {
          console.log('[PWA] No student ID found in URL or localStorage');
          setHasError(true);
          setIsLoading(false);
          return;
        }
        
        // Save to localStorage for future opens
        localStorage.setItem('parentApp_studentId', studentId);
        localStorage.setItem('parentApp_mode', 'true');

        console.log(`[PWA] Loading data for student: ${studentId}`);
        
        const studentsData = await Student.filter({ student_id: studentId });
        if (studentsData.length === 0) {
          console.log('[PWA] Student not found with student_id, trying id...');
          // Also try with 'id' field
          const studentsById = await Student.filter({ id: studentId });
          if (studentsById.length === 0) {
            console.log('[PWA] Student not found');
            setHasError(true);
            setIsLoading(false);
            return;
          }
          studentsData.push(studentsById[0]);
        }

        const studentInfo = studentsData[0];
        setStudent(studentInfo);

        // ✅ SPEED FIX: Load school data in parallel
        if (studentInfo.school_id) {
            const schoolsData = await SchoolEntity.filter({ id: studentInfo.school_id });
            if (schoolsData.length > 0) {
              setSchool(schoolsData[0]);
            }
        }

        const parentInfo = {
          id: studentInfo.parent_email || studentInfo.parent_whatsapp || `parent_${studentInfo.id}`,
          name: studentInfo.father_name || studentInfo.guardian_name || 'Parent',
          email: studentInfo.parent_email,
          whatsapp: studentInfo.parent_whatsapp,
          student_id: studentInfo.id
        };
        setCurrentParent(parentInfo);

        console.log('[PWA] Parent chat initialized successfully');

      } catch (error) {
        console.error('Error loading parent chat data:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Enhanced conversation loading with faster refresh
  useEffect(() => {
    const loadConversations = async () => {
      if (!school || !student || !currentParent) return;
      
      try {
        const parentConversations = await Conversation.filter({
          student_id: student.id,
          parent_user_id: currentParent.id
        });
        
        const sortedConversations = parentConversations.sort((a, b) => 
          new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime()
        );
        
        setConversations(sortedConversations);
        
      } catch (error) {
        console.error('Error loading conversations:', error);
        setHasError(true);
      }
    };

    loadConversations();
    
    const conversationInterval = setInterval(loadConversations, 10000); // 10 seconds for faster updates
    
    return () => clearInterval(conversationInterval);
  }, [school, student, currentParent]);

  // ✅ OPTIMIZED: Slower polling to reduce server load
  useEffect(() => {
    if (selectedConversation && currentParent && isOnline) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // ✅ SPEED OPTIMIZATION: Faster polling when active
      const getPollingInterval = () => isActiveTabRef.current ? 3000 : 10000; // 3s when active, 10s when hidden

      const startPolling = () => {
        pollingIntervalRef.current = setInterval(() => {
          refreshMessages();
        }, getPollingInterval());
      };

      startPolling();
      setTimeout(() => refreshMessages(), 200); // Immediate first load

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [selectedConversation, currentParent, isOnline, refreshMessages]);

  // Enhanced conversation select handler
  const handleConversationSelect = async (conversation) => {
    if (!currentParent) return;
    
    setSelectedConversation(conversation);
    setShowChatList(false);
    setMessages([]);

    try {
      const response = await getChatMessages({
        conversation_id: conversation.id,
        user_type: 'parent',
        parent_user_id: currentParent.id
      });
      if (response.data && response.data.messages) {
        setMessages(response.data.messages);
        lastMessageCountRef.current = response.data.messages.length;
        console.log(`Loaded ${response.data.messages.length} messages for conversation`);
        setHasError(false);
        
        setConversations(prevConversations =>
          prevConversations.map(conv =>
            conv.id === conversation.id
              ? { ...conv, parent_unread_count: 0 }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error selecting conversation:', error);
      setHasError(true);
    }
  };

  // ENHANCED: Optimistic UI with immediate message display
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentParent) return;

    // Optimistically add the message to the UI
    const tempMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      conversation_id: selectedConversation.id,
      sender_user_id: currentParent.id,
      sender_type: 'parent',
      message_text: newMessage,
      created_date: new Date().toISOString(),
      delivered_to_teacher: false, // Not yet delivered
      is_read_by_teacher: false,
      failed: false, // New property to track failure status
    };
    
    // Store message text before clearing input
    const messageToSend = newMessage;
    setNewMessage('');
    messageInputRef.current?.focus();

    setMessages(prev => [...prev, tempMessage]); // Add temporary message to UI

    try {
      const response = await sendChatMessage({
        conversation_id: selectedConversation.id,
        message_text: messageToSend, // Use the stored message text
        sender_type: 'parent',
        parent_user_id: currentParent.id
      });

      if (response.data && response.data.success) {
        // Replace temp message with real message from server
        setMessages(prev => prev.map(msg => msg.id === tempMessage.id ? response.data.message : msg));
        lastMessageCountRef.current += 1;
        
        setConversations(prev =>
          prev.map(conv =>
            conv.id === selectedConversation.id
              ? { ...conv, last_message: messageToSend, last_message_time: new Date().toISOString(), parent_unread_count: 0 }
              : conv
          )
        );
        setHasError(false);
        
        // IMMEDIATE REFRESH: Trigger immediate refresh to get updated status
        setTimeout(() => refreshMessages(), 500);
      } else {
        // If sending failed (but no network error), mark the message as failed
        setMessages(prev => prev.map(msg => msg.id === tempMessage.id ? { ...msg, failed: true } : msg));
        toast.error('Failed to send message.');
        setHasError(true); // Indicate an error state
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // If network error, mark the message as failed
      setMessages(prev => prev.map(msg => msg.id === tempMessage.id ? { ...msg, failed: true } : msg));
      toast.error('Failed to send message. Please check your internet connection.');
      setHasError(true); // Indicate an error state
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setShowChatList(true);
    setMessages([]);
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Long press handlers for message deletion
  const handleMessageLongPressStart = useCallback((message, e) => {
    // Only allow long press for messages sent by the parent
    if (message.sender_type !== 'parent') return;

    e.preventDefault();
    console.log('[ParentChat] Long press started for message:', message.id);
    
    const timer = setTimeout(() => {
      console.log('[ParentChat] Long press triggered for message:', message.id);
      setSelectedMessage(message);
      setShowMessageActions(true);
      
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      toast.info('Message selected - Tap to delete or copy'); // Updated toast message
    }, 700);
    
    setLongPressTimer(timer);
  }, []);

  const handleMessageLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      setShowMessageActions(false);
      setSelectedMessage(null);
      return;
    }

    try {
      await Message.delete(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Message deleted');
      // Decrement lastMessageCountRef if a message was successfully deleted
      lastMessageCountRef.current = Math.max(0, lastMessageCountRef.current - 1);
    } catch (error) {
      console.error('[ParentChat] Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setShowMessageActions(false);
      setSelectedMessage(null);
    }
  };

  const handleCopyMessage = (message) => {
    if (navigator.clipboard && message?.message_text) {
      navigator.clipboard.writeText(message.message_text);
      toast.success('Message copied to clipboard');
    } else {
      toast.error('Failed to copy message');
    }
    setShowMessageActions(false);
    setSelectedMessage(null);
  };

  const getContactName = (conversation) => {
    return conversation.conversation_type === 'parent_principal' ? 'Principal' : 'Teacher';
  };

  const getContactSubtitle = (conversation) => {
    return `${school?.school_name || 'School'}`;
  };

  // ENHANCED: WhatsApp-style message status icons
  const getMessageStatusIcon = (message) => {
    if (message.sender_type === 'parent') {
      // Check if message is still sending (temp ID)
      if (message.id && message.id.startsWith('temp-')) {
        return (
          <span className="text-[10px] text-gray-400 italic">Sending...</span>
        );
      }
      
      if (message.failed) {
        return (
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] text-red-500">Failed</span>
          </span>
        );
      }
      
      // For parent messages, show delivery and read status
      if (message.is_read_by_teacher) {
        return <CheckCheck className="w-4 h-4 text-blue-500" />; // Blue double tick - Seen
      } else if (message.delivered_to_teacher) {
        return <CheckCheck className="w-4 h-4 text-gray-400" />; // Gray double tick - Delivered
      } else {
        return <Check className="w-4 h-4 text-gray-400" />; // Single gray tick - Sent
      }
    }
    return null;
  };

  const filteredConversations = conversations.filter(conv => {
    const contactName = getContactName(conv);
    return contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (conv.last_message && conv.last_message.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading parent chat...</p>
        </div>
      </div>
    );
  }

  if (hasError || !student || !currentParent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <MessageSquare className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-700 mb-2">Parent Chat Unavailable</h1>
          <p className="text-slate-500 mb-6">
            This link is not valid or has expired. Please contact your school for a new parent app link.
          </p>
          <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show conversation list first
  if (showChatList) {
    return (
      <div className="min-h-screen max-h-screen h-[100dvh] bg-white overflow-hidden flex flex-col">
        {/* Header - Mobile Optimized */}
        <div className="bg-green-600 text-white p-3 sm:p-4 relative flex-shrink-0 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                {school?.logo_url ? (
                  <img src={school.logo_url} alt="School Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">School Chat</h1>
                <p className="text-xs sm:text-sm text-green-200 truncate max-w-[150px] sm:max-w-none">{school?.school_name || 'Loading...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-red-300'}`}></div>
              <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="text-white h-8 w-8 sm:h-10 sm:w-10">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-200" />
            <Input
              placeholder="Search conversations..."
              className="pl-9 bg-green-700 border-green-500 text-white placeholder-green-200 h-9 sm:h-10 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mt-2 text-center">
            <p className="text-[10px] sm:text-xs text-green-200">
              📱 Parent Communication App
            </p>
          </div>
        </div>

        {/* Notification Permission Banner */}
        {notificationPermissionStatus === 'default' && (
          <div className="bg-yellow-100 p-3 text-center text-sm text-yellow-800 border-b border-yellow-200">
            <button onClick={handleRequestPermission} className="font-bold flex items-center justify-center w-full">
              <Bell className="w-4 h-4 mr-2 animate-pulse" />
              Enable notifications to never miss messages
            </button>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No conversations yet</p>
              <p className="text-sm mt-2">School will start conversations when needed</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className={`p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 ${
                  conversation.parent_unread_count > 0 ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {conversation.conversation_type === 'parent_principal' ? (
                        <School className="w-6 h-6" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`truncate text-base ${conversation.parent_unread_count > 0 ? 'font-black text-slate-900' : 'font-medium text-slate-800'}`}>
                        {getContactName(conversation)}
                      </h3>
                      <span className={`text-xs whitespace-nowrap ml-2 ${conversation.parent_unread_count > 0 ? 'font-black text-green-700' : 'text-slate-400'}`}>
                        {conversation.last_message_time ? formatMessageTime(conversation.last_message_time) : ''}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${conversation.parent_unread_count > 0 ? 'font-bold text-slate-800' : 'text-slate-500'} pr-2`}>
                        {conversation.last_message || 'No messages yet'}
                      </p>
                      {conversation.parent_unread_count > 0 && (
                        <Badge className="bg-green-600 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          {conversation.parent_unread_count > 99 ? '99+' : conversation.parent_unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-1">
                      {getContactSubtitle(conversation)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Mobile Optimized */}
        <div className="bg-slate-100 p-2 sm:p-3 text-center border-t flex-shrink-0 safe-area-bottom">
          <p className="text-[10px] sm:text-xs text-slate-600 truncate px-2">
            {student?.full_name && `Connected as parent of ${student.full_name}`}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate px-2">
            🔒 Secure communication with {school?.school_name}
          </p>
        </div>
      </div>
    );
  }

  // Show individual chat when conversation is selected
  return (
    <div className="min-h-screen max-h-screen h-[100dvh] bg-white flex flex-col overflow-hidden">
      {/* Chat Header - Mobile Optimized */}
      <div className="bg-green-600 text-white p-3 sm:p-4 flex-shrink-0 safe-area-top">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToList}
            className="text-white hover:bg-green-700 h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
            {school?.logo_url ? (
              <img src={school.logo_url} alt="School Logo" className="w-full h-full object-contain p-1" />
            ) : (
              selectedConversation?.conversation_type === 'parent_principal' ? (
                <School className="w-5 h-5 text-green-600" />
              ) : (
                <User className="w-5 h-5 text-green-600" />
              )
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm sm:text-base truncate">
              {selectedConversation ? getContactName(selectedConversation) : 'Chat'}
            </h3>
            <p className="text-xs sm:text-sm text-green-200 truncate">{school?.school_name}</p>
          </div>
          
          <div className="text-[10px] sm:text-xs text-green-200 flex-shrink-0">
            {isOnline ? '🟢' : '🔴'}
          </div>
        </div>
      </div>

      {/* Messages with WhatsApp-style date separators */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50">
        <div className="space-y-3">
          {groupMessagesByDate(messages).map((item, index) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${index}`} className="flex justify-center my-4">
                  <span className="bg-white/80 text-gray-600 text-xs px-4 py-1.5 rounded-full shadow-sm border">
                    {item.date}
                  </span>
                </div>
              );
            }
            
            const message = item.data;
            return (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'parent' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl cursor-pointer select-none transition-all ${
                    selectedMessage?.id === message.id && message.sender_type === 'parent' ? 'ring-2 ring-green-500 scale-[1.02] shadow-lg' : ''
                  } ${
                    message.sender_type === 'parent'
                      ? 'bg-white text-gray-900 shadow-sm border rounded-bl-md'
                      : 'bg-green-600 text-white rounded-br-md'
                  }`}
                  onMouseDown={(e) => handleMessageLongPressStart(message, e)}
                  onMouseUp={handleMessageLongPressEnd}
                  onMouseLeave={handleMessageLongPressEnd}
                  onTouchStart={(e) => handleMessageLongPressStart(message, e)}
                  onTouchEnd={handleMessageLongPressEnd}
                  onTouchCancel={handleMessageLongPressEnd}
                >
                  <p className="text-sm leading-relaxed break-words">{message.message_text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${message.sender_type === 'parent' ? 'justify-end' : ''}`}>
                    <span className={`text-[10px] sm:text-xs opacity-75 ${message.sender_type === 'parent' ? 'text-gray-500' : 'text-gray-200'}`}>
                      {formatMessageTime(message.created_date)}
                    </span>
                    {getMessageStatusIcon(message)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Mobile Optimized */}
      <div className="p-2 sm:p-4 bg-white border-t border-gray-200 flex-shrink-0 safe-area-bottom">
        <div className="flex gap-2 items-center">
          <Input
            ref={messageInputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            className="flex-1 rounded-full border-gray-300 h-10 sm:h-11 text-base"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Message Actions Dialog */}
      <Dialog open={showMessageActions} onOpenChange={(open) => {
        setShowMessageActions(open);
        if (!open) setSelectedMessage(null); // Clear selected message when dialog closes
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Message Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCopyMessage(selectedMessage)}
              disabled={!selectedMessage?.message_text}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Message
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => handleDeleteMessage(selectedMessage?.id)}
              disabled={!selectedMessage}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}