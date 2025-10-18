/**
 * Array Safety Utilities
 * 
 * Provides safe array operations to prevent "_a3.includes is not a function" errors
 * during SSR/hydration when arrays might be undefined or not properly initialized.
 */

/**
 * Safely checks if an array includes a value
 * @param array - The array to check (might be undefined)
 * @param value - The value to search for
 * @returns boolean - true if array contains value, false otherwise
 */
export function safeIncludes<T>(array: T[] | undefined | null, value: T): boolean {
  // Add detailed logging to track usage
  console.log('🔍 [safeIncludes] Called with:', {
    array: array,
    arrayType: typeof array,
    isArray: Array.isArray(array),
    arrayLength: Array.isArray(array) ? array.length : 'N/A',
    value: value,
    valueType: typeof value,
    stackTrace: new Error().stack?.split('\n').slice(1, 4) // First 3 stack frames
  });
  
  const isValidArray = Array.isArray(array);
  const result = isValidArray && array.includes(value);
  
  console.log('🔍 [safeIncludes] Result:', {
    isValidArray,
    result,
    arrayContent: isValidArray ? array.slice(0, 5) : 'Invalid array' // First 5 items for debugging
  });
  
  return result;
}

/**
 * Safely filters an array
 * @param array - The array to filter (might be undefined)
 * @param predicate - The filter function
 * @returns T[] - filtered array or empty array if input is invalid
 */
export function safeFilter<T>(
  array: T[] | undefined | null, 
  predicate: (value: T, index: number, array: T[]) => boolean
): T[] {
  const safeArray = Array.isArray(array) ? array : [];
  return safeArray.filter(predicate);
}

/**
 * Safely maps an array
 * @param array - The array to map (might be undefined)
 * @param mapper - The mapping function
 * @returns U[] - mapped array or empty array if input is invalid
 */
export function safeMap<T, U>(
  array: T[] | undefined | null,
  mapper: (value: T, index: number, array: T[]) => U
): U[] {
  const safeArray = Array.isArray(array) ? array : [];
  return safeArray.map(mapper);
}

/**
 * Safely gets array length
 * @param array - The array to check (might be undefined)
 * @returns number - array length or 0 if invalid
 */
export function safeLength<T>(array: T[] | undefined | null): number {
  return Array.isArray(array) ? array.length : 0;
}

/**
 * Safely ensures a value is an array
 * @param value - The value that should be an array
 * @returns T[] - the array or empty array if invalid
 */
export function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Safely finds an item in an array
 * @param array - The array to search (might be undefined)
 * @param predicate - The search function
 * @returns T | undefined - found item or undefined
 */
export function safeFind<T>(
  array: T[] | undefined | null,
  predicate: (value: T, index: number, array: T[]) => boolean
): T | undefined {
  const safeArray = Array.isArray(array) ? array : [];
  return safeArray.find(predicate);
}

/**
 * Safely checks if some items in array match predicate
 * @param array - The array to check (might be undefined)
 * @param predicate - The test function
 * @returns boolean - true if any item matches, false otherwise
 */
export function safeSome<T>(
  array: T[] | undefined | null,
  predicate: (value: T, index: number, array: T[]) => boolean
): boolean {
  const safeArray = Array.isArray(array) ? array : [];
  return safeArray.some(predicate);
}
