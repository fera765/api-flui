/**
 * E2E Test Setup - Axios Instance, Helpers & Utilities
 * Real API calls (NO MOCKS)
 */

require('dotenv').config();
const axios = require('axios');

// ===========================
// CONFIGURATION
// ===========================
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_TOKEN = process.env.API_TOKEN || ''; // Optional if no auth
const TEST_PREFIX = process.env.TEST_PREFIX || `e2e-${Date.now()}`;
const DEFAULT_TIMEOUT = 30000; // 30s
const POLLING_TIMEOUT = 180000; // 3 minutes
const POLLING_INTERVAL = 2000; // 2s

// ===========================
// AXIOS INSTANCE
// ===========================
function createAxiosInstance() {
  const config = {
    baseURL: BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add Authorization header if API_TOKEN exists
  if (API_TOKEN) {
    config.headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  const instance = axios.create(config);

  // Request interceptor for logging
  instance.interceptors.request.use(
    (config) => {
      console.log(`➡️  ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error.message);
      return Promise.reject(error);
    }
  );

  // Response interceptor for logging
  instance.interceptors.response.use(
    (response) => {
      console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      return response;
    },
    (error) => {
      if (error.response) {
        console.error(
          `❌ ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
          error.response.data
        );
      } else {
        console.error('❌ Network Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Generate unique test resource name
 * @param {string} suffix - Resource type suffix
 * @returns {string} Prefixed name
 */
function generateName(suffix = 'resource') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${TEST_PREFIX}-${suffix}-${timestamp}-${random}`;
}

/**
 * Wait for a condition to be met via polling
 * @param {string} resourcePath - API endpoint to poll
 * @param {Function} checkFn - Function to check response: (response) => boolean
 * @param {Object} options - { timeout, interval, axiosInstance }
 * @returns {Promise<Response>} Last response when condition is met
 */
async function waitFor(resourcePath, checkFn, options = {}) {
  const {
    timeout = POLLING_TIMEOUT,
    interval = POLLING_INTERVAL,
    axiosInstance = createAxiosInstance(),
  } = options;

  const startTime = Date.now();
  let lastResponse = null;
  let lastError = null;

  console.log(`⏳ Polling ${resourcePath} (timeout: ${timeout}ms, interval: ${interval}ms)`);

  while (Date.now() - startTime < timeout) {
    try {
      const response = await axiosInstance.get(resourcePath);
      lastResponse = response;

      if (checkFn(response)) {
        console.log(`✅ Condition met for ${resourcePath}`);
        return response;
      }

      console.log(`⏳ Waiting... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
    } catch (error) {
      lastError = error;
      console.log(`⚠️  Polling error (continuing): ${error.message}`);
    }

    await sleep(interval);
  }

  const errorMsg = `Timeout waiting for condition on ${resourcePath} after ${timeout}ms`;
  console.error(`❌ ${errorMsg}`);
  if (lastResponse) {
    console.error('Last response:', JSON.stringify(lastResponse.data, null, 2));
  }
  if (lastError) {
    console.error('Last error:', lastError.message);
  }
  throw new Error(errorMsg);
}

/**
 * Sleep helper
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert response schema has required fields
 * @param {Object} data - Response data
 * @param {Array<string>} fields - Required field names
 */
function assertSchema(data, fields) {
  fields.forEach((field) => {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  });
}

/**
 * Cleanup helper - deletes resource and ignores 404
 * @param {string} endpoint - DELETE endpoint
 * @param {Object} axiosInstance - Axios instance
 */
async function cleanup(endpoint, axiosInstance) {
  try {
    await axiosInstance.delete(endpoint);
    console.log(`🧹 Cleaned up: ${endpoint}`);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`🧹 Already deleted: ${endpoint}`);
    } else {
      console.warn(`⚠️  Cleanup failed for ${endpoint}:`, error.message);
    }
  }
}

// ===========================
// EXPORTS
// ===========================
module.exports = {
  // Config
  BASE_URL,
  API_TOKEN,
  TEST_PREFIX,
  DEFAULT_TIMEOUT,
  POLLING_TIMEOUT,
  POLLING_INTERVAL,

  // Axios
  createAxiosInstance,
  axiosInstance: createAxiosInstance,

  // Helpers
  generateName,
  waitFor,
  sleep,
  assertSchema,
  cleanup,
};
