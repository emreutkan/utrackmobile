import ky from 'ky';
import { supabase } from '../lib/supabase';
import { BACKEND_URL } from './types';
import { useBackendStore } from '@/state/stores/backendStore';

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

const MAX_LOG_BODY = 8000;

const apiClient = ky.create({
  prefixUrl: BACKEND_URL,
  hooks: {
    beforeRequest: [
      async (request) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

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

        console.log(`[API] REQUEST: ${request.method} ${request.url}`);
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        const clone = response.clone();
        try {
          const text = await clone.text();
          const preview = text.length > MAX_LOG_BODY ? text.slice(0, MAX_LOG_BODY) + '...' : text;
          console.log(
            `[API] RESPONSE: ${response.status} ${request.method} ${request.url}`,
            preview
          );
        } catch (_) {
          console.log(
            `[API] RESPONSE: ${response.status} ${request.method} ${request.url} (body not readable)`
          );
        }

        // Log 4xx body so we can see validation/error reason
        if (response.status >= 400) {
          const clone = response.clone();
          try {
            const body = await clone.text();
            console.warn(
              `[API] ${response.status} ${request.method} ${request.url}`,
              body.includes('<!') ? `(HTML ${response.status})` : body
            );
          } catch (_) {}
          // 5xx or repeated 4xx HTML responses = backend down
          if (response.status >= 500 || (response.status >= 400 && response.status < 500)) {
            const clone2 = response.clone();
            const body2 = await clone2.text().catch(() => '');
            if (response.status >= 500 || body2.includes('<!')) {
              useBackendStore.getState().recordFailure();
            }
          }
        } else {
          useBackendStore.getState().recordSuccess();
        }

        // GET 304 Not Modified → use cached body and return as 200
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

        // 401: try to refresh Supabase session and retry
        if (response.status === 401) {
          const { data, error } = await supabase.auth.refreshSession();
          if (!error && data.session) {
            const { prefixUrl, hooks, ...retryOptions } = options as any;
            return ky(request.url, {
              ...retryOptions,
              headers: {
                ...retryOptions.headers,
                Authorization: `Bearer ${data.session.access_token}`,
              },
              retry: { limit: 0, methods: [] },
            });
          }
        }

        return response;
      },
    ],
  },
  retry: {
    limit: 0,
    methods: [],
  },
  timeout: 30000,
});

export default apiClient;
