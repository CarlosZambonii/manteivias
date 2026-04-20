import React, { useEffect, useState } from 'react';
import { OfflineManagerProvider, useOfflineManager } from '@/contexts/OfflineManager';
import { OfflineBanner } from '@/components/offline/OfflineUI';
import { IOSOfflineBanner } from '@/components/offline/iOSOfflineUI';
import { isIOSSafari } from '@/utils/iosDetector';

// Inner component to access context
const OfflineUIWrapper = ({ children }) => {
    const { isIOS } = useOfflineManager();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <>{children}</>;

    return (
        <div className="flex flex-col min-h-screen">
            {isIOS ? <IOSOfflineBanner /> : <OfflineBanner />}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
};

const OfflineDataProvider = ({ children }) => {
  return (
    <OfflineManagerProvider>
        <OfflineUIWrapper>
            {children}
        </OfflineUIWrapper>
    </OfflineManagerProvider>
  );
};

export default OfflineDataProvider;