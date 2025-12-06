/**
 * 🚀 Performance Optimization Utilities
 * For achieving 90+ Lighthouse Score
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

/**
 * 🎯 Debounce hook for expensive operations
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 📊 Throttle hook for scroll/resize events
 */
export function useThrottle(callback, delay = 100) {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
}

/**
 * 🎨 Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [options]);

  return [targetRef, isIntersecting];
}

/**
 * ⚡ Virtual scrolling for large lists
 */
export function useVirtualScroll(items, itemHeight = 60, containerHeight = 600) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  const visibleItems = items.slice(
    Math.max(0, visibleStart - 5), // Buffer
    Math.min(items.length, visibleEnd + 5)
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
}

/**
 * 🔄 Request Animation Frame hook for smooth animations
 */
export function useAnimationFrame(callback) {
  const requestRef = useRef();
  const previousTimeRef = useRef();

  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [callback]);
}

/**
 * 💾 Memoized expensive calculations
 */
export function useMemoizedCalculation(calculate, dependencies) {
  return useMemo(() => calculate(), dependencies);
}

/**
 * 🎯 Performance monitoring
 */
export function measurePerformance(label, callback) {
  const start = performance.now();
  const result = callback();
  const end = performance.now();
  console.log(`⚡ ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

/**
 * 📱 Detect slow device and adjust performance
 */
export function useDevicePerformance() {
  const [isSlowDevice, setIsSlowDevice] = useState(false);

  useEffect(() => {
    // Check device memory
    const memory = navigator.deviceMemory;
    const cores = navigator.hardwareConcurrency;

    // Slow device detection
    if (memory && memory < 4 || cores && cores < 4) {
      setIsSlowDevice(true);
    }

    // Check connection speed
    if ('connection' in navigator) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        setIsSlowDevice(true);
      }
    }
  }, []);

  return isSlowDevice;
}