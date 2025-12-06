import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppData } from "../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare, Send, Plus, Users, Megaphone, Search,
  CheckCheck, AlertTriangle, Check, ArrowLeft, Phone, VideoIcon, MoreVertical,
  Trash2, Forward, Copy, Filter, X, UserSearch
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Conversation, Message, Student } from "@/api/entities";
import { sendChatMessage } from "@/api/functions";
import { getChatMessages } from "@/api/functions";
import { createConversation } from "@/api/functions";
import { sendBroadcastMessage } from "@/api/functions";

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    let isoString = timestamp;
    if (!timestamp.endsWith('Z') && !timestamp.includes('+')) {
      isoString = timestamp + 'Z';
    }
    
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

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

// WhatsApp-style message status with Sending... indicator
const getMessageStatusDisplay = (message) => {
  if (message.sender_type === 'parent') return null;
  
  // Check if message is still sending (temp ID)
  if (message.id && message.id.startsWith('temp-')) {
    return <span className="text-[10px] text-blue-200 italic">Sending...</span>;
  }
  
  if (message.failed) {
    return (
      <span className="flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5 text-yellow-300" />
        <span className="text-[10px] text-yellow-300">Failed</span>
      </span>
    );
  }
  
  if (message.is_read_by_parent) {
    return <CheckCheck className="w-4 h-4 text-green-400" />; // Blue/Green double tick - Seen
  } else if (message.delivered_to_parent) {
    return <CheckCheck className="w-4 h-4 text-blue-200" />; // Gray double tick - Delivered
  } else {
    return <Check className="w-4 h-4 text-blue-200 opacity-70" />; // Single tick - Sent
  }
};

export default function Messages() {
  const { user, school } = useAppData() || {};

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedConversationType, setSelectedConversationType] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all_parents');
  const [targetClass, setTargetClass] = useState('');

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  
  const [selectedConvForDelete, setSelectedConvForDelete] = useState(null);
  const [showDeleteConvDialog, setShowDeleteConvDialog] = useState(false);
  const [conversationLongPressTimer, setConversationLongPressTimer] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastUnreadCountRef = useRef(0);

  // Handle Android/Mobile back button - go to chat list instead of closing PWA
  useEffect(() => {
    const handleBackButton = (e) => {
      if (!showChatList && selectedConversation) {
        e.preventDefault();
        handleBackToList();
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Push initial state
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [showChatList, selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Request notification permission on mount (no service worker needed for receiving)
  useEffect(() => {
    const setupNotifications = async () => {
      if (!('Notification' in window)) return;

      // Request permission if not granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast.success('🔔 Notifications enabled!');
        }
      } else if (Notification.permission === 'granted') {
        console.log('[Notifications] Permission already granted for admin');
      }
    };

    if (user) {
      setupNotifications();
    }
  }, [user]);

  // Show notification for new messages
  const showNewMessageNotification = useCallback((studentName, message) => {
    // Play sound
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.4);
    } catch (e) {
      console.log('Could not play sound');
    }

    // Show toast notification
    toast.success(`📩 New message from ${studentName}'s parent`, {
      description: message.length > 50 ? message.substring(0, 50) + '...' : message,
      duration: 5000,
    });

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`New Message - ${studentName}`, {
        body: message.length > 100 ? message.substring(0, 100) + '...' : message,
        icon: '/favicon.ico',
        tag: 'new-message-' + Date.now(),
      });
      setTimeout(() => notification.close(), 6000);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    if (!school) return;

    try {
      const conversationsData = await Conversation.filter({ school_id: school.id }, '-last_message_time', 100);
      const studentsData = await Student.filter({ school_id: school.id });

      setConversations(conversationsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [school]);

  useEffect(() => {
    loadConversations();
    
    // Poll for new messages every 15 seconds for faster updates
    pollingIntervalRef.current = setInterval(async () => {
      if (!school) return;
      
      try {
        const conversationsData = await Conversation.filter({ school_id: school.id }, '-last_message_time', 50);
        
        // Calculate total unread count
        const totalUnread = conversationsData.reduce((sum, conv) => sum + (conv.teacher_unread_count || 0), 0);
        
        // Check for new messages (unread count increased)
        if (totalUnread > lastUnreadCountRef.current && lastUnreadCountRef.current > 0) {
          // Find conversation with new message
          const newMsgConv = conversationsData.find(conv => {
            const oldConv = conversations.find(c => c.id === conv.id);
            return oldConv && (conv.teacher_unread_count || 0) > (oldConv.teacher_unread_count || 0);
          });
          
          if (newMsgConv) {
            const student = students.find(s => s.id === newMsgConv.student_id);
            showNewMessageNotification(
              student?.full_name || 'Student',
              newMsgConv.last_message || 'New message received'
            );
          }
        }
        
        lastUnreadCountRef.current = totalUnread;
        setConversations(conversationsData);
      } catch (error) {
        console.error('Error polling conversations:', error);
      }
    }, 15000); // 15 seconds for faster message updates
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [school]); // Removed unnecessary dependencies to prevent re-creating interval

  const loadMessages = useCallback(async (conversationId) => {
    try {
      const response = await getChatMessages({
        conversation_id: conversationId,
        user_type: 'principal'
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  }, []);

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    setShowChatList(false);
    loadMessages(conversation.id);
    
    // Mark as read - reset teacher_unread_count to 0
    if (conversation.teacher_unread_count > 0) {
      try {
        await Conversation.update(conversation.id, { teacher_unread_count: 0 });
        // Update local state immediately
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversation.id 
              ? { ...conv, teacher_unread_count: 0 } 
              : conv
          )
        );
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setShowChatList(true);
    setMessages([]);
    setSelectedMessage(null);
    setShowMessageActions(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const messageToSend = newMessage;
    const tempMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_user_id: user.id,
      sender_type: 'principal',
      message_text: messageToSend,
      created_date: new Date().toISOString(),
      delivered_to_parent: false,
      is_read_by_parent: false,
      failed: false,
    };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    messageInputRef.current?.focus();

    try {
      const response = await sendChatMessage({
        conversation_id: selectedConversation.id,
        message_text: messageToSend,
        sender_type: 'principal'
      });

      if (response.data.success) {
        setMessages(prev => prev.map(msg => msg.id === tempMessage.id ? response.data.message : msg));
        setConversations(prev =>
          prev.map(conv =>
            conv.id === selectedConversation.id
              ? { ...conv, last_message: messageToSend, last_message_time: new Date().toISOString() }
              : conv
          )
        );
        
        // ✅ Push notifications are already sent by backend (sendChatMessage function)
        // No need to send from frontend
      } else {
         setMessages(prev => prev.map(msg => msg.id === tempMessage.id ? { ...msg, failed: true } : msg));
         toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => msg.id === tempMessage.id ? { ...msg, failed: true } : msg));
      toast.error('Failed to send message');
    }
  };

  const handleCreateConversation = async (studentId) => {
    if (!studentId) {
      toast.error('Please select a student');
      return;
    }

    try {
      const student = students.find(s => s.id === studentId);
      if (!student) {
        toast.error('Student not found');
        return;
      }

      const existingConversation = conversations.find(conv => conv.student_id === studentId);

      if (existingConversation) {
        setSelectedConversation(existingConversation);
        setShowNewChatDialog(false);
        setShowChatList(false);
        loadMessages(existingConversation.id);
        toast.success('Opened existing conversation');
        return;
      }

      const parentIdentifier = student.parent_email || student.parent_whatsapp || `parent_${student.id}`;

      const response = await createConversation({
        student_id: studentId,
        parent_user_id: parentIdentifier,
        conversation_type: 'parent_principal'
      });

      if (response.data && response.data.conversation) {
        const newConv = response.data.conversation;
        setConversations(prev => [...prev, newConv]);
        setSelectedConversation(newConv);
        setShowNewChatDialog(false);
        setShowChatList(false);
        loadMessages(newConv.id);
        toast.success('New conversation created!');
      } else {
        toast.error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation: ' + error.message);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    if (broadcastTarget === 'specific_class' && !targetClass) {
      toast.error('Please select a class for specific class broadcast');
      return;
    }

    try {
      const response = await sendBroadcastMessage({
        message_title: broadcastTitle,
        message_text: broadcastMessage,
        target_audience: broadcastTarget,
        target_class: broadcastTarget === 'specific_class' ? targetClass : null,
        priority: 'normal'
      });

      if (response.data.success) {
        toast.success(`Broadcast sent to ${response.data.sent_count} parents`);
        setBroadcastTitle('');
        setBroadcastMessage('');
        setTargetClass('');
        setShowBroadcastDialog(false);
        loadConversations();
      } else {
        toast.error('Failed to send broadcast');
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('Failed to send broadcast: ' + error.message);
    }
  };

  const getStudentInfo = (studentId) => {
    return students.find(s => s.id === studentId);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) {
      setShowMessageActions(false);
      setSelectedMessage(null);
      return;
    }

    try {
      await Message.delete(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setShowMessageActions(false);
      setSelectedMessage(null);
    }
  };

  const handleForwardMessage = (message) => {
    setMessageToForward(message);
    setShowForwardDialog(true);
    setShowMessageActions(false);
    setSelectedMessage(null);
  };

  const handleForwardToConversation = async (targetConversationId) => {
    if (!messageToForward || !targetConversationId) return;

    try {
      await sendChatMessage({
        conversation_id: targetConversationId,
        message_text: `📄 Forwarded: ${messageToForward.message_text}`,
        sender_type: 'principal'
      });

      toast.success('Message forwarded successfully');
      setShowForwardDialog(false);
      setMessageToForward(null);
      loadConversations();
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message');
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

  const handleDeleteConversation = async (conversationId) => {
    try {
      setIsLoading(true);
      
      const convMessages = await Message.filter({ conversation_id: conversationId });

      if (convMessages.length > 0) {
        for (const msg of convMessages) {
          try {
            await Message.delete(msg.id);
          } catch (msgError) {
            console.error(`Failed to delete message ${msg.id}:`, msgError);
          }
        }
      }

      await Conversation.delete(conversationId);

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setShowDeleteConvDialog(false);
      setSelectedConvForDelete(null);
      toast.success('Conversation deleted successfully!');

    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation: ' + error.message);
    } finally {
      setIsLoading(false);
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null); 
        setShowChatList(true); 
        setMessages([]);
      }
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const student = getStudentInfo(conv.student_id);

    const searchMatch = searchTerm === '' ||
      (student?.full_name && student.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student?.class && student.class.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (conv.last_message && conv.last_message.toLowerCase().includes(searchTerm.toLowerCase()));

    const classMatch = selectedClass === 'all' || student?.class === selectedClass;
    const typeMatch = selectedConversationType === 'all' || conv.conversation_type === selectedConversationType;
    const unreadMatch = !showUnreadOnly || (conv.teacher_unread_count && conv.teacher_unread_count > 0);

    return searchMatch && classMatch && typeMatch && unreadMatch;
  });

  const uniqueClasses = [...new Set(students.map(s => s.class).filter(Boolean))];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedClass('all');
    setSelectedConversationType('all');
    setShowUnreadOnly(false);
  };

  const getContactName = (conversation) => {
    const student = getStudentInfo(conversation.student_id);
    return student?.full_name || 'Unknown Student';
  };

  if (!school) {
    return <div className="p-6 text-center">Loading messaging system...</div>;
  }

  if (showChatList) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowBroadcastDialog(true)} size="sm" className="bg-orange-500 hover:bg-orange-600">
                <Megaphone className="w-4 h-4 mr-2" />
                Broadcast
              </Button>
              <Button onClick={() => setShowNewChatDialog(true)} size="sm" className="bg-green-500 hover:bg-green-600">
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 bg-blue-700 border-blue-500 text-white placeholder-blue-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-24 h-8 text-xs bg-blue-700 border-blue-500 text-white">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map((cls) => (
                  <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedConversationType} onValueChange={setSelectedConversationType}>
              <SelectTrigger className="w-20 h-8 text-xs bg-blue-700 border-blue-500 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="parent_principal">Principal</SelectItem>
                <SelectItem value="parent_teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showUnreadOnly ? "secondary" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              <Filter className="w-3 h-3 mr-1" />
              Unread
            </Button>

            {(searchTerm || selectedClass !== 'all' || selectedConversationType !== 'all' || showUnreadOnly) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-white">
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">No Conversations</p>
              <p className="text-sm mt-2">Start a new chat with parents or send a broadcast</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const student = getStudentInfo(conversation.student_id);
              let isLongPressEvent = false;

              return (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 ${
                    selectedConvForDelete?.id === conversation.id ? 'bg-red-50 ring-2 ring-red-500' : ''
                  }`}
                  onTouchStart={(e) => {
                    e.persist();
                    isLongPressEvent = false;
                    const timer = setTimeout(() => {
                      e.preventDefault();
                      setSelectedConvForDelete(conversation);
                      setShowDeleteConvDialog(true);
                      if ('vibrate' in navigator) {
                        navigator.vibrate(100);
                      }
                      toast('Hold to delete conversation', { icon: '🗑️' });
                      isLongPressEvent = true;
                    }, 700);
                    setConversationLongPressTimer(timer);
                  }}
                  onTouchEnd={() => {
                    if (conversationLongPressTimer) {
                      clearTimeout(conversationLongPressTimer);
                      setConversationLongPressTimer(null);
                    }
                    if (!isLongPressEvent) {
                      handleConversationSelect(conversation);
                    }
                    isLongPressEvent = false;
                  }}
                  onTouchCancel={() => {
                    if (conversationLongPressTimer) {
                      clearTimeout(conversationLongPressTimer);
                      setConversationLongPressTimer(null);
                    }
                    isLongPressEvent = false;
                  }}
                  onMouseDown={(e) => {
                    e.persist();
                    isLongPressEvent = false;
                    const timer = setTimeout(() => {
                      e.preventDefault();
                      setSelectedConvForDelete(conversation);
                      setShowDeleteConvDialog(true);
                      toast('Conversation selected', { icon: '✅' });
                      isLongPressEvent = true;
                    }, 700);
                    setConversationLongPressTimer(timer);
                  }}
                  onMouseUp={() => {
                    if (conversationLongPressTimer) {
                      clearTimeout(conversationLongPressTimer);
                      setConversationLongPressTimer(null);
                    }
                    if (!isLongPressEvent) {
                      handleConversationSelect(conversation);
                    }
                    isLongPressEvent = false;
                  }}
                  onMouseLeave={() => {
                    if (conversationLongPressTimer) {
                      clearTimeout(conversationLongPressTimer);
                      setConversationLongPressTimer(null);
                    }
                    isLongPressEvent = false;
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={student?.student_photo} loading="lazy" />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {student?.full_name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className={`truncate ${conversation.teacher_unread_count > 0 ? 'font-black text-slate-900' : 'font-medium text-slate-800'}`}>
                          {student?.full_name || 'Unknown Student'}
                        </h3>
                        <span className={`text-xs whitespace-nowrap ${conversation.teacher_unread_count > 0 ? 'font-extrabold text-blue-700' : 'text-slate-400'}`}>
                          {conversation.last_message_time ? formatMessageTime(conversation.last_message_time) : ''}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <p className={`text-sm truncate ${conversation.teacher_unread_count > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                          {conversation.last_message || 'No messages yet'}
                        </p>
                        {conversation.teacher_unread_count > 0 && (
                          <Badge className="bg-blue-600 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center font-bold">
                            {conversation.teacher_unread_count > 99 ? '99+' : conversation.teacher_unread_count}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          Class: {student?.class || 'N/A'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {conversation.conversation_type === 'parent_principal' ? 'Principal' : 'Teacher'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserSearch className="w-5 h-5" />
                Start New Conversation
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Select Student - {students.length} available</Label>
                {students.length === 0 ? (
                  <div className="p-4 text-center border rounded-lg bg-gray-50 mt-2">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">No Students Found</p>
                    <p className="text-sm">Please add students first</p>
                  </div>
                ) : (
                  <Select onValueChange={handleCreateConversation}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose a student to start conversation..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => {
                        const hasChat = conversations.some(conv => conv.student_id === student.id);
                        return (
                          <SelectItem key={student.id} value={student.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{student.full_name} - Class: {student.class || 'N/A'}</span>
                              {hasChat && (
                                <Badge variant="secondary" className="ml-2">
                                  Existing
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Broadcast Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Message Title</Label>
                <Input
                  placeholder="e.g., Important Announcement"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Message</Label>
                <Textarea
                  placeholder="Type your broadcast message here..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Send To</Label>
                <Select value={broadcastTarget} onValueChange={setBroadcastTarget}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_parents">All Parents</SelectItem>
                    <SelectItem value="specific_class">Specific Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {broadcastTarget === 'specific_class' && (
                <div>
                  <Label className="text-sm font-medium text-slate-700">Select Class</Label>
                  <Select value={targetClass} onValueChange={setTargetClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose class" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueClasses.map((className) => (
                        <SelectItem key={className} value={className}>
                          Class {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setShowBroadcastDialog(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleSendBroadcast}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
                >
                  Send Broadcast
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConvDialog} onOpenChange={setShowDeleteConvDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to delete the entire conversation with <strong>{getStudentInfo(selectedConvForDelete?.student_id)?.full_name}</strong>?
              </p>
              <p className="text-sm text-red-600 font-semibold">
                ⚠️ This will permanently delete all messages in this conversation. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteConvDialog(false);
                    setSelectedConvForDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteConversation(selectedConvForDelete?.id)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Chat Header - Always visible and sticky like WhatsApp */}
      <div className="bg-blue-600 text-white p-3 sm:p-4 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToList}
            className="text-white hover:bg-blue-700 h-9 w-9"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Avatar className="w-9 h-9 sm:w-10 sm:h-10">
            <AvatarImage src={getStudentInfo(selectedConversation?.student_id)?.student_photo} loading="lazy" />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {getStudentInfo(selectedConversation?.student_id)?.full_name?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm sm:text-base truncate">
              {selectedConversation ? getContactName(selectedConversation) : 'Chat'}
            </h3>
            <p className="text-xs sm:text-sm text-blue-200 truncate">
              Class: {getStudentInfo(selectedConversation?.student_id)?.class || 'N/A'}
            </p>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700 h-8 w-8 sm:h-9 sm:w-9">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700 h-8 w-8 sm:h-9 sm:w-9">
              <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700 h-8 w-8 sm:h-9 sm:w-9">
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  const studentInfo = getStudentInfo(selectedConversation?.student_id);
                  toast.info(`Student: ${studentInfo?.full_name}, Class: ${studentInfo?.class}`);
                }}>
                  View Student Info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  toast.info('Search feature coming soon!');
                }}>
                  Search in Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBackToList} className="text-red-600">
                  Close Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50">
        <div className="space-y-3 sm:space-y-4">
          <AnimatePresence>
            {groupMessagesByDate(messages).map((item, index) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${index}`} className="flex justify-center my-4">
                    <span className="bg-white/90 text-gray-600 text-xs px-4 py-1.5 rounded-full shadow-sm border">
                      {item.date}
                    </span>
                  </div>
                );
              }
              
              const message = item.data;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender_type === 'parent' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-lg select-none transition-all duration-200 ${
                      selectedMessage?.id === message.id ? 'ring-2 ring-blue-500 scale-105 shadow-lg' : ''
                    } ${
                      message.sender_type === 'parent'
                        ? 'bg-white text-gray-900 shadow-sm border rounded-bl-none'
                        : 'bg-blue-600 text-white rounded-br-none'
                    }`}
                    onTouchStart={(e) => {
                      const timer = setTimeout(() => {
                        setSelectedMessage(message);
                        setShowMessageActions(true);
                        if ('vibrate' in navigator) {
                          navigator.vibrate(100);
                        }
                        toast('Hold to see options', { icon: '👆' });
                      }, 500);
                      setLongPressTimer(timer);
                    }}
                    onTouchEnd={() => {
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        setLongPressTimer(null);
                      }
                    }}
                    onTouchCancel={() => {
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        setLongPressTimer(null);
                      }
                    }}
                    onMouseDown={() => {
                      const timer = setTimeout(() => {
                        setSelectedMessage(message);
                        setShowMessageActions(true);
                        toast('Message selected', { icon: '✅' });
                      }, 500);
                      setLongPressTimer(timer);
                    }}
                    onMouseUp={() => {
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        setLongPressTimer(null);
                      }
                    }}
                    onMouseLeave={() => {
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        setLongPressTimer(null);
                      }
                    }}
                  >
                    <p className="text-sm">{message.message_text}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className={`text-xs opacity-75 ${message.sender_type === 'parent' ? 'text-gray-500' : 'text-blue-200'}`}>
                        {formatMessageTime(message.created_date)}
                      </span>
                      {getMessageStatusDisplay(message)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="p-2 sm:p-4 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-2 items-center">
          <Input
            ref={messageInputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            className="flex-1 rounded-full h-10 sm:h-11 text-base"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      <Dialog open={showMessageActions} onOpenChange={(open) => {
        setShowMessageActions(open);
        if (!open) setSelectedMessage(null);
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Message Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-left"
              onClick={() => handleCopyMessage(selectedMessage)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Message
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-left"
              onClick={() => handleForwardMessage(selectedMessage)}
            >
              <Forward className="w-4 h-4 mr-2" />
              Forward Message
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start text-left"
              onClick={() => {
                if (selectedMessage?.id) {
                  handleDeleteMessage(selectedMessage.id);
                } else {
                  toast.error('Cannot delete message');
                  setShowMessageActions(false);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                📄 Forwarding: {messageToForward?.message_text && `"${messageToForward.message_text}"`}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Select Conversation</label>
              <Select onValueChange={handleForwardToConversation}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a conversation..." />
                </SelectTrigger>
                <SelectContent>
                  {conversations.filter(conv => conv.id !== selectedConversation?.id).map((conversation) => {
                    const student = getStudentInfo(conversation.student_id);
                    return (
                      <SelectItem key={conversation.id} value={conversation.id}>
                        <div className="flex items-center gap-2">
                          <span>{student?.full_name || 'Unknown Student'}</span>
                          <span className="text-xs text-slate-500">({student?.class})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}