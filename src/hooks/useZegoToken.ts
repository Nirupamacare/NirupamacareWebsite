import { useState, useCallback } from 'react';

export interface CallTokenResponse {
  app_id: number;
  sdk: 'prebuilt' | 'express';
  room_id: string;
  user_id: string;
  user_name?: string;
  token?: string;
  allowed: boolean;
  reason?: string;
}

export interface UseZegoTokenOptions {
  apiBaseUrl: string;
  accessToken: string;
}

export const useZegoToken = ({ apiBaseUrl, accessToken }: UseZegoTokenOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<CallTokenResponse | null>(null);

  const fetchToken = useCallback(
    async (callId: string, sdk: 'prebuilt' | 'express' = 'prebuilt') => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/v1/call/${callId}/token?sdk=${sdk}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Failed to fetch token: ${response.statusText}`);
        }

        const data: CallTokenResponse = await response.json();

        if (!data.allowed) {
          throw new Error(data.reason || 'Not allowed to join this call');
        }

        setTokenData(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl, accessToken]
  );

  return { fetchToken, loading, error, tokenData };
};
