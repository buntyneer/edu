import React, { useEffect, useRef } from 'react';

/**
 * A dedicated, isolated component to handle camera initialization.
 * Its only job is to get the camera stream and report back.
 * This avoids conflicts with other state updates on the parent page.
 */
export default function CameraScanner({ onReady, onError }) {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const initializeCamera = async () => {
      console.log('[CameraScanner] Attempting to initialize camera...');

      // 1. Check for HTTPS and basic support
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        onError(new Error("Insecure Connection: Camera requires a secure (HTTPS) connection."));
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        onError(new Error("Camera access is not supported by your browser."));
        return;
      }

      // 2. Promise with a timeout (7 seconds)
      try {
        const streamPromise = navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Camera start timed out after 7 seconds.')), 7000)
        );

        const stream = await Promise.race([streamPromise, timeoutPromise]);

        if (isMounted.current) {
          console.log('[CameraScanner] Camera stream acquired successfully.');
          onReady(stream);
        } else {
          // If component unmounted while starting, stop the stream
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        console.error('[CameraScanner] Camera initialization failed:', error);
        if (isMounted.current) {
          onError(error);
        }
      }
    };

    initializeCamera();

    // Cleanup function
    return () => {
      isMounted.current = false;
      console.log('[CameraScanner] Unmounting. Resources will be cleaned up by parent.');
    };
  }, [onReady, onError]);

  // This component does not render anything visible to the user
  return null;
}