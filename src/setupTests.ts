import '@testing-library/jest-dom/vitest';
import { vi, beforeEach, afterEach } from 'vitest';

// 1. Mock global fetch for API endpoints (/api/config, /api/ai/analyze-inbox, Outlook, etc.)
const mockFetch = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString();

  if (url.includes('/api/config')) {
    return new Response(
      JSON.stringify({
        status: 'ok',
        authenticated: true,
        companyId: 'company-default',
        user: { uid: 'test-user-id', email: 'test@spedition-hueber.de' },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (url.includes('/api/ai/analyze-inbox')) {
    return new Response(
      JSON.stringify({
        emails: [],
        unreadCount: 0,
        priorityTasks: [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (url.includes('/api/outlook')) {
    return new Response(
      JSON.stringify({
        success: true,
        emails: [],
        events: [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

vi.stubGlobal('fetch', mockFetch);

// 2. Mock Firebase Firestore module to prevent real network connections during UI component tests
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    onSnapshot: vi.fn((_ref: any, onNext?: any, _onError?: any) => {
      // Simulate an empty snapshot if callback is provided
      if (typeof onNext === 'function') {
        setTimeout(() => {
          onNext({
            empty: true,
            docs: [],
            forEach: (_cb: any) => {},
          });
        }, 0);
      }
      // Return unsubscribe function
      return () => {};
    }),
    getDoc: vi.fn(async () => ({
      exists: () => false,
      data: () => null,
    })),
    getDocs: vi.fn(async () => ({
      empty: true,
      docs: [],
      forEach: (_cb: any) => {},
    })),
    setDoc: vi.fn(async () => {}),
    updateDoc: vi.fn(async () => {}),
    deleteDoc: vi.fn(async () => {}),
  };
});

// 3. Mock Firebase Auth
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>();
  return {
    ...actual,
    getAuth: vi.fn(() => ({
      currentUser: {
        uid: 'test-user-id',
        email: 'test@spedition-hueber.de',
        emailVerified: true,
        isAnonymous: false,
      },
      onAuthStateChanged: vi.fn((cb: any) => {
        cb({
          uid: 'test-user-id',
          email: 'test@spedition-hueber.de',
          emailVerified: true,
        });
        return () => {};
      }),
    })),
  };
});

// Setup and teardown hooks
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('outlook_logged_in', 'true');
});

afterEach(() => {
  vi.restoreAllMocks();
});
