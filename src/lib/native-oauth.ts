import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

/**
 * Detects if the app is running inside a native platform (Capacitor WebView).
 * OAuth in WebViews fails because:
 * 1. WebView doesn't share cookies/state with external browsers
 * 2. The OAuth "state" parameter stored in localStorage before redirect is lost
 *    when the callback returns to a different WebView context
 * 3. Google explicitly blocks OAuth in embedded WebViews (user-agent check)
 * 
 * Solution: Open OAuth in Chrome Custom Tabs (external browser) which properly
 * maintains state and cookies, then deep-link back to the app.
 */
export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Opens Google/Apple OAuth in an external browser (Chrome Custom Tabs on Android)
 * and handles the callback via deep links.
 * 
 * Flow:
 * 1. Construct the OAuth URL via Supabase
 * 2. Open it in Chrome Custom Tabs (shares cookies properly)
 * 3. After auth, Google redirects → Supabase callback → your app URL
 * 4. Capacitor intercepts the deep link and closes the browser
 * 5. Session tokens from the URL are set in the WebView's Supabase client
 */
export async function handleNativeOAuth(
  provider: 'google' | 'apple'
): Promise<{ error: Error | null }> {
  try {
    // Get the OAuth URL from Supabase without actually redirecting
    const redirectUrl = 'https://shreeads.lovable.app';
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // Don't redirect in WebView
      },
    });

    if (error || !data?.url) {
      return { error: error || new Error('Failed to get OAuth URL') };
    }

    // Open OAuth URL in Chrome Custom Tabs (external browser)
    await Browser.open({ 
      url: data.url,
      presentationStyle: 'popover',
    });

    // Listen for the app URL being opened (deep link callback)
    return new Promise((resolve) => {
      let appUrlHandle: Awaited<ReturnType<typeof App.addListener>> | null = null;
      let browserHandle: Awaited<ReturnType<typeof Browser.addListener>> | null = null;
      let resolved = false;

      const cleanup = async () => {
        if (appUrlHandle) await appUrlHandle.remove().catch(() => {});
        if (browserHandle) await browserHandle.remove().catch(() => {});
      };

      const doResolve = (result: { error: Error | null }) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(result);
      };

      // Handle deep link callback
      App.addListener('appUrlOpen', async (event) => {
        try {
          await Browser.close();
        } catch {
          // Browser may already be closed
        }

        // Extract tokens from the callback URL
        const url = new URL(event.url);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get('access_token') || url.searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          doResolve({ error: sessionError || null });
        } else {
          const { error: refreshError } = await supabase.auth.getSession();
          if (refreshError) {
            doResolve({ error: new Error('OAuth completed but no session tokens received. Please try again.') });
          } else {
            doResolve({ error: null });
          }
        }
      }).then(h => { appUrlHandle = h; });

      // Handle browser closed without completing OAuth
      Browser.addListener('browserFinished', () => {
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              doResolve({ error: null });
            } else {
              doResolve({ error: new Error('Sign-in was cancelled') });
            }
          });
        }, 1000);
      }).then(h => { browserHandle = h; });

      // Timeout after 2 minutes
      setTimeout(() => {
        doResolve({ error: new Error('Sign-in timed out. Please try again.') });
      }, 120000);
    });
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
