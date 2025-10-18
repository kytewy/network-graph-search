/**
 * Error Tracking Utilities
 * 
 * Helps track and debug "_a3.includes is not a function" errors
 */

// Global error handler to catch includes errors
export function setupErrorTracking() {
  // Override console.error to catch includes errors
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    
    if (errorMessage.includes('includes is not a function')) {
      console.log('🚨 [ERROR TRACKER] INCLUDES ERROR DETECTED!', {
        timestamp: new Date().toISOString(),
        errorMessage,
        stackTrace: new Error().stack,
        args
      });
      
      // Try to get more context about what triggered this
      console.log('🚨 [ERROR TRACKER] Current component stack:', {
        reactFiberNode: (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.getFiberRoots?.(1)?.[0]?.current?.child?.type?.name || 'Unknown'
      });
    }
    
    // Call original console.error
    originalError.apply(console, args);
  };

  // Also catch unhandled errors
  window.addEventListener('error', (event) => {
    if (event.message.includes('includes is not a function')) {
      console.log('🚨 [ERROR TRACKER] UNHANDLED INCLUDES ERROR!', {
        timestamp: new Date().toISOString(),
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stackTrace: event.error?.stack
      });
    }
  });

  console.log('✅ [ERROR TRACKER] Error tracking setup complete');
}

// Function to log array operations
export function logArrayOperation(operation: string, array: any, context: string) {
  console.log(`🔍 [ARRAY OP] ${operation} in ${context}:`, {
    array,
    type: typeof array,
    isArray: Array.isArray(array),
    length: Array.isArray(array) ? array.length : 'N/A',
    constructor: array?.constructor?.name,
    prototype: Object.getPrototypeOf(array)?.constructor?.name,
    hasIncludes: typeof array?.includes === 'function',
    timestamp: new Date().toISOString()
  });
}
