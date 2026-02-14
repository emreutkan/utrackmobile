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

const GET_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type GetCacheEntry = {
  body: string;
  etag?: string;
  lastModified?: string;
  timestamp: number;
};

const getCache = new Map<string, GetCacheEntry>();

function getCacheKey(request: Request): string {
  return request.url;
}

function isGetCacheFresh(entry: GetCacheEntry): boolean {
  return Date.now() - entry.timestamp < GET_CACHE_TTL_MS;
}

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
        // For GET: add conditional headers so server can return 304 when unchanged
        if (request.method === 'GET') {
          const key = getCacheKey(request);
          const entry = getCache.get(key);
          if (entry && isGetCacheFresh(entry)) {
            if (entry.etag) request.headers.set('If-None-Match', entry.etag);
            if (entry.lastModified) request.headers.set('If-Modified-Since', entry.lastModified);
          }
        }
        console.log('request', request);
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        console.log('[API] afterResponse - Status:', response.status, 'URL:', request.url);

        // GET 304 Not Modified → use cached body and return as 200 so callers get data
        if (request.method === 'GET' && response.status === 304) {
          const key = getCacheKey(request);
          const entry = getCache.get(key);
          if (entry) {
            return new Response(entry.body, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }

        // GET 200 → store body and cache headers for future 304
        if (request.method === 'GET' && response.status === 200) {
          const key = getCacheKey(request);
          const clone = response.clone();
          const body = await clone.text();
          getCache.set(key, {
            body,
            etag: response.headers.get('ETag') ?? undefined,
            lastModified: response.headers.get('Last-Modified') ?? undefined,
            timestamp: Date.now(),
          });
        }

        if (response.status !== 401) {
          return response;
        }

        console.log('response is 401', response.status, response);
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
            prefixUrl: undefined,
          });

          const data: RefreshTokenResponse = await res.json();
          console.log('[API] Token refresh successful');

          await storeAccessToken(data.access);
          await storeRefreshToken(data.refresh);

          console.log('[API] Retrying original request with new token');
          return ky(request.url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${data.access}`,
            },
          });
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
