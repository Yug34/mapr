import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Download, CheckCircle2 } from 'lucide-react';
import { getRegistrationState, activateUpdate, isOffline } from '../utils/serviceWorker';
import { Button } from './ui/button';

export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    const state = getRegistrationState();
    setUpdateAvailable(state.updateAvailable);
    setOfflineReady(state.offlineReady);

    // Listen for service worker events
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    const handleOfflineReady = () => {
      setOfflineReady(true);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);
    window.addEventListener('sw-offline-ready', handleOfflineReady);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('sw-offline-ready', handleOfflineReady);
    };
  }, []);

  const handleUpdate = async () => {
    await activateUpdate();
    setUpdateAvailable(false);
  };

  // Don't show anything if everything is normal
  if (online && !updateAvailable && offlineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* Offline indicator */}
      {!online && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Offline Mode</span>
        </div>
      )}

      {/* Online indicator (briefly shown when coming back online) */}
      {online && !offlineReady && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Online</span>
        </div>
      )}

      {/* Update available */}
      {updateAvailable && (
        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Update Available</span>
          <Button
            onClick={handleUpdate}
            size="sm"
            variant="secondary"
            className="ml-2 h-6 text-xs"
          >
            Update
          </Button>
        </div>
      )}

      {/* Offline ready confirmation */}
      {offlineReady && online && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Ready for Offline Use</span>
        </div>
      )}
    </div>
  );
}

