import { config } from '../config';

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  authToken: string,
  refreshToken: string,
  setAuthToken: (token: string) => void,
  setRefreshToken: (token: string) => void,
  onLogout: () => void
): Promise<Response> {
  const makeRequest = (token: string) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
  };

  let response = await makeRequest(authToken);

  if (response.status === 401 && refreshToken) {
    // Attempt to refresh the token
    try {
      const refreshResponse = await fetch(`${config.apiUrl}/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setAuthToken(data.access);
        // Retry the original request with the new token
        response = await makeRequest(data.access);
      } else {
        // Refresh failed, logout the user
        onLogout();
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      onLogout();
      throw error;
    }
  }

  return response;
}