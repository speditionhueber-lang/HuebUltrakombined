import { initializeFirebase } from '../firebase/init';

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { auth } = initializeFirebase();
  const user = auth.currentUser;
  const headers = new Headers(options.headers || {});
  
  if (user) {
    try {
      const idToken = await user.getIdToken();
      headers.set('Authorization', `Bearer ${idToken}`);
    } catch (e) {
      console.warn("Failed to get ID token", e);
    }
  }

  return fetch(url, {
    ...options,
    headers
  });
}
