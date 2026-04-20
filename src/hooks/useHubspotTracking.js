import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useHubspotTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if the HubSpot tracking script is loaded
    if (window._hsq) {
      window._hsq.push(['setPath', location.pathname]);
      window._hsq.push(['trackPageView']);
    }
  }, [location.pathname]);
};

export default useHubspotTracking;