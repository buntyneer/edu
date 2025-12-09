// Base44 functions removed. Replace these with real implementations that
// call your backend services. Current stubs keep the app building.
const stub = async () => ({ success: false });

export const sendWhatsappMessage = stub;
export const sendChatMessage = stub;
export const getChatMessages = async () => ({ data: { messages: [] } });
export const createConversation = stub;
export const sendBroadcastMessage = stub;
export const getServiceWorker = stub;
export const sendPushNotification = stub;
export const parentApiLogin = stub;
export const parentApiGetAttendance = stub;
export const parentApiGetChat = stub;
export const parentApiSendMessage = stub;
export const checkAndWarnExpiry = stub;
export const sendFCMNotification = stub;
export const sendAttendanceNotification = stub;
export const createRazorpayOrder = stub;
export const verifyRazorpayPayment = stub;
