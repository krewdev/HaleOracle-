import React, { useEffect, useRef } from 'react';

const TelegramLogin = ({ botName, onAuth, buttonSize = 'large', requestAccess = 'write', usePic = true }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!botName) {
            console.warn('TelegramLogin: botName prop is missing');
            return;
        }

        // Define the global callback function that Telegram's script will call
        // We attach it to the window object so the script can find it
        window.onTelegramAuth = (user) => {
            onAuth(user);
        };

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.async = true;
        script.setAttribute('data-telegram-login', botName);
        script.setAttribute('data-size', buttonSize);
        script.setAttribute('data-request-access', requestAccess);
        script.setAttribute('data-userpic', usePic);
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');

        if (containerRef.current) {
            containerRef.current.innerHTML = ''; // Clear previous if any
            containerRef.current.appendChild(script);
        }
    }, [botName, buttonSize, requestAccess, usePic, onAuth]);

    return <div ref={containerRef} className="telegram-login-container py-2"></div>;
};

export default TelegramLogin;
