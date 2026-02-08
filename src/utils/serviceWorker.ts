/**
 * Service Worker Registration and Update Management
 */
import { devLog, devWarn } from "../lib/devLog";

export interface ServiceWorkerRegistrationState {
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  offlineReady: boolean;
}

let registrationState: ServiceWorkerRegistrationState = {
  registration: null,
  updateAvailable: false,
  offlineReady: false,
};

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    devWarn('[Service Worker] Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registrationState.registration = registration;

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          registrationState.updateAvailable = true;
          devLog('[Service Worker] New version available');
          
          // Dispatch custom event for UI to handle
          window.dispatchEvent(
            new CustomEvent('sw-update-available', { detail: { registration } })
          );
        } else if (newWorker.state === 'activated') {
          registrationState.offlineReady = true;
          devLog('[Service Worker] Service worker activated');
          
          window.dispatchEvent(
            new CustomEvent('sw-offline-ready', { detail: { registration } })
          );
        }
      });
    });

    // Handle controller change (new service worker took control)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      devLog('[Service Worker] Controller changed - reloading page');
      window.location.reload();
    });

    devLog('[Service Worker] Registered successfully:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[Service Worker] Registration failed:', error);
    return null;
  }
}

/**
 * Unregister the service worker (useful for development)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const unregistered = await registration.unregister();
    if (unregistered) {
      registrationState.registration = null;
      registrationState.updateAvailable = false;
      registrationState.offlineReady = false;
      devLog('[Service Worker] Unregistered successfully');
    }
    return unregistered;
  } catch (error) {
    console.error('[Service Worker] Unregistration failed:', error);
    return false;
  }
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates(): Promise<void> {
  if (!registrationState.registration) {
    devWarn('[Service Worker] No registration found');
    return;
  }

  try {
    await registrationState.registration.update();
    devLog('[Service Worker] Update check completed');
  } catch (error) {
    console.error('[Service Worker] Update check failed:', error);
  }
}

/**
 * Activate the waiting service worker (apply update)
 */
export async function activateUpdate(): Promise<void> {
  if (!registrationState.registration || !registrationState.registration.waiting) {
    devWarn('[Service Worker] No waiting service worker found');
    return;
  }

  try {
    // Send message to service worker to skip waiting
    registrationState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    devLog('[Service Worker] Update activation requested');
  } catch (error) {
    console.error('[Service Worker] Update activation failed:', error);
  }
}

/**
 * Get current registration state
 */
export function getRegistrationState(): ServiceWorkerRegistrationState {
  return { ...registrationState };
}

/**
 * Check if app is running offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

