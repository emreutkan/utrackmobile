import ky from 'ky';
import { getAccessToken, getRefreshToken, storeAccessToken, getBackendPreference } from './Storage';

// Backend configurations
const LOCAL_IP = '192.168.1.2';
const EC2_DOMAIN = 'api.utrack.irfanemreutkan.com';
let SELECTED_BACKEND = `http://${LOCAL_IP}:8000/api`;

// Get API URLs based on backend preference
export const getAPI_URL = async (): Promise<string> => {
  const backend = await getBackendPreference();
  if (backend === 'local') {
    SELECTED_BACKEND = `http://${LOCAL_IP}:8000/api`;
  } else {
    SELECTED_BACKEND = `http://${EC2_DOMAIN}/api`;
  }
  return SELECTED_BACKEND;
};
const apiClient = ky.create({
  prefixUrl: await getAPI_URL(),
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set('Content-Type', 'application/json');
        request.headers.set('Authorization', `Bearer ${getAccessToken()}`);
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          console.log('Unauthorized, refreshing token');
          const refreshToken = await getRefreshToken();
          if (refreshToken) {
            await storeAccessToken(refreshToken);
          }
        }
      },
    ],
  },
  retry: {
    limit: 2,
    methods: ['GET', 'PUT'],
  },
});

export default apiClient;
