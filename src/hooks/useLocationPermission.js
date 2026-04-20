import { useState, useCallback, useEffect } from 'react';

export const useLocationPermission = () => {
    const [location, setLocation] = useState(null);
    const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
    const [error, setError] = useState(null);

    // Function to request location (will prompt user)
    const requestLocationPermission = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                const err = new Error("Geolocalização não suportada pelo seu navegador.");
                setError(err);
                setPermissionStatus('denied');
                reject(err);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    setLocation(loc);
                    setPermissionStatus('granted');
                    setError(null);
                    resolve(loc);
                },
                (err) => {
                    let errorMessage = "Erro ao obter localização.";
                    if (err.code === 1) errorMessage = "Permissão de localização negada.";
                    else if (err.code === 2) errorMessage = "Localização indisponível.";
                    else if (err.code === 3) errorMessage = "Tempo limite excedido ao obter localização.";
                    
                    const errorObj = new Error(errorMessage);
                    setError(errorObj);
                    setPermissionStatus('denied');
                    reject(errorObj);
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
            );
        });
    }, []);

    // Function to check permission status without necessarily forcing a prompt
    const checkLocationPermission = useCallback(async () => {
        // If we already have coordinates, permission is granted
        if (location) return true;

        if (navigator.permissions && navigator.permissions.query) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                setPermissionStatus(result.state);
                return result.state === 'granted';
            } catch (e) {
                // Fallback for browsers that don't support this query
                return false;
            }
        }
        return false;
    }, [location]);

    // Initial silent check
    useEffect(() => {
        const init = async () => {
            const isGranted = await checkLocationPermission();
            if (isGranted) {
                // If granted, just fetch the coords silently to have them ready
                requestLocationPermission().catch(() => {}); 
            }
        };
        init();
    }, [checkLocationPermission, requestLocationPermission]);

    return {
        checkLocationPermission,
        requestLocationPermission,
        isLocationEnabled: permissionStatus === 'granted' && !!location,
        location,
        permissionStatus,
        error
    };
};