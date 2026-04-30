// Custom hook for notification sounds
import { useEffect, useRef, useState } from 'react';

export const useNotificationSound = () => {
    const [permission, setPermission] = useState('default');
    const audioRef = useRef(null);

    useEffect(() => {
        // Check notification permission
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }

        // Create audio element for notification sound
        // Using a simple beep sound data URL
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        }
        return permission;
    };

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.volume = 0.3; // Gentle volume
            audioRef.current.play().catch(err => {
                console.log('Could not play notification sound:', err);
            });
        }
    };

    return {
        permission,
        requestPermission,
        playSound,
        canPlaySound: permission === 'granted'
    };
};

export default useNotificationSound;
