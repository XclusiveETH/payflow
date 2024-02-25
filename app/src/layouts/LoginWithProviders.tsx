import { AuthenticationStatus, createAuthenticationAdapter } from '@rainbow-me/rainbowkit';

import '@farcaster/auth-kit/styles.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import Login from './Login';
import { SiweMessage } from 'siwe';
import axios, { AxiosError } from 'axios';
import { ProfileType } from '../types/ProfleType';
import { me } from '../services/user';
import { API_URL } from '../utils/urlConstants';
import { toast } from 'react-toastify';
import { AppSettings } from '../types/AppSettingsType';
import { useMediaQuery } from '@mui/material';
import { LoginProviders } from '../utils/providers';

const appSettingsStorageItem = localStorage.getItem('appSettings');
const appSettingsStored = appSettingsStorageItem
  ? (JSON.parse(appSettingsStorageItem) as AppSettings)
  : null;

export default function LoginWithProviders() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [appSettings] = useState<AppSettings>(
    appSettingsStored
      ? appSettingsStored
      : {
          darkMode: prefersDarkMode
        }
  );

  const fetchingStatusRef = useRef(false);
  const verifyingRef = useRef(false);
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>('loading');
  const [profile, setProfile] = useState<ProfileType>();

  useMemo(() => {
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
  }, [appSettings]);

  // Fetch user when:
  useEffect(() => {
    const fetchStatus = async () => {
      if (fetchingStatusRef.current || verifyingRef.current) {
        return;
      }

      fetchingStatusRef.current = true;

      try {
        const profile = await me();

        setAuthStatus(profile ? 'authenticated' : 'unauthenticated');
        setProfile(profile);
      } catch (error: any | AxiosError) {
        if (axios.isAxiosError(error)) {
          toast.error(`${error.message} 🤷🏻‍♂️`);
        }
        console.error(error);
      } finally {
        fetchingStatusRef.current = false;
      }
    };

    // 1. page loads
    fetchStatus();

    // 2. window is focused (in case user logs out of another window)
    window.addEventListener('focus', fetchStatus);
    return () => window.removeEventListener('focus', fetchStatus);
  }, []);

  // 3. in case successfully authenticated, fetch currently authenticated user
  useMemo(async () => {
    if (authStatus === 'authenticated' && !profile) {
      try {
        const response = await axios.get(`${API_URL}/api/user/me`, { withCredentials: true });
        if (Boolean(response.status === 200)) {
          const authAccount = response.data;
          setProfile(authAccount);
        }
      } catch (_error) {
        setAuthStatus('unauthenticated');
      }
    }
  }, [authStatus, profile]);

  const authAdapter = useMemo(() => {
    return createAuthenticationAdapter({
      getNonce: async () => {
        const response = await axios.get(`${API_URL}/api/auth/nonce`, { withCredentials: true });
        return await response.data;
      },

      createMessage: ({ nonce, address, chainId }) => {
        return new SiweMessage({
          domain: window.location.host,
          address,
          statement: 'Sign in with Ethereum to Payflow',
          uri: window.location.origin,
          version: '1',
          chainId,
          nonce
        });
      },

      getMessageBody: ({ message }) => {
        return message.prepareMessage();
      },

      verify: async ({ message, signature }) => {
        verifyingRef.current = true;

        try {
          const response = await axios.post(
            `${API_URL}/api/auth/verify/${message.address}`,
            { message, signature },
            { withCredentials: true }
          );

          const authenticated = Boolean(response.status === 200);

          if (authenticated) {
            setAuthStatus(authenticated ? 'authenticated' : 'unauthenticated');
          }

          return authenticated;
        } catch (error) {
          return false;
        } finally {
          verifyingRef.current = false;
        }
      },

      signOut: async () => {
        setAuthStatus('unauthenticated');
        setProfile(undefined);
        await axios.get(`${API_URL}/api/auth/logout`, { withCredentials: true });
      }
    });
  }, []);

  return (
    <LoginProviders
      darkMode={appSettings.darkMode}
      authConfig={{ adapter: authAdapter, status: authStatus }}>
      <Login authStatus={authStatus} profile={profile} settings={appSettings} />
    </LoginProviders>
  );
}
