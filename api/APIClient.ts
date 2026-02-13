import ky from 'ky';
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
  storeAccessToken,
  storeRefreshToken,
} from '../hooks/Storage';
import { REFRESH_TOKEN_URL, BACKEND_URL } from './types';
import { RefreshTokenResponse } from './types/auth';
// Backend configurations
// const BACKEND_URL = 'api.utrack.irfanemreutkan.com';

const apiClient = ky.create({
  prefixUrl: BACKEND_URL,
  hooks: {
    beforeRequest: [
      async (request) => {
        const token = await getAccessToken();

        request.headers.set('Content-Type', 'application/json');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        console.log('[API] afterResponse - Status:', response.status, 'URL:', request.url);

        // Only handle 401s, let other responses through
        if (response.status !== 401) {
          return response;
        }

        console.log('[API] 401 Unauthorized - Attempting token refresh');

        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          console.error('[API] No refresh token found, clearing tokens');
          await clearTokens();
          throw new Error('Refresh token not found');
        }

        try {
          console.log('[API] Calling refresh endpoint');
          const res = await ky.post(REFRESH_TOKEN_URL, {
            json: { refresh: refreshToken },
            // Important: don't use the same apiClient to avoid circular hooks
            prefixUrl: undefined, // Use absolute URL
          });

          const data: RefreshTokenResponse = await res.json();
          console.log('[API] Token refresh successful');

          await storeAccessToken(data.access);
          await storeRefreshToken(data.refresh);

          // Update the original request with new token
          request.headers.set('Authorization', `Bearer ${data.access}`);

          // Retry the original request
          console.log('[API] Retrying original request with new token');
          return ky(request);
        } catch (error) {
          console.error('[API] Token refresh failed:', error);
          await clearTokens();
          throw new Error('Token refresh failed');
        }
      },
    ],
  },
  retry: {
    limit: 0, // Disable ky's automatic retry - we handle 401 retries manually
    methods: [],
  },
  timeout: 30000, // Add timeout to prevent hanging requests
});

export default apiClient;
