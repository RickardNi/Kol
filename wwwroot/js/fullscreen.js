// Mobile viewport height fix for PWA fullscreen mode
(function() {
    // Function to set the viewport height custom property
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // Function to handle fullscreen mode
    function handleFullscreen() {
        if (window.navigator.standalone || window.matchMedia('(display-mode: fullscreen)').matches) {
            // We're in PWA fullscreen mode
            document.documentElement.style.setProperty('--safe-area-inset-top', '0px');
            document.body.style.paddingTop = '0';
            
            // Force the app to use the full screen
            const healthTracker = document.querySelector('.health-tracker');
            if (healthTracker) {
                healthTracker.style.paddingTop = '0';
                healthTracker.style.marginTop = '0';
            }
        }
    }

    // Set initial viewport height
    setViewportHeight();
    handleFullscreen();

    // Update on resize and orientation change
    window.addEventListener('resize', () => {
        setViewportHeight();
        handleFullscreen();
    });

    window.addEventListener('orientationchange', () => {
        // Small delay to ensure the browser has updated the viewport
        setTimeout(() => {
            setViewportHeight();
            handleFullscreen();
        }, 100);
    });

    // Handle when the app becomes standalone (PWA installed)
    window.addEventListener('appinstalled', () => {
        handleFullscreen();
    });

    // iOS specific handling
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // Force fullscreen on iOS PWA
        if (window.navigator.standalone) {
            document.documentElement.style.setProperty('--safe-area-inset-top', '0px');
            document.body.style.paddingTop = '0';
            
            // Hide the status bar area by extending content
            const style = document.createElement('style');
            style.textContent = `
                .health-tracker {
                    padding-top: 0 !important;
                    margin-top: 0 !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    height: 100dvh !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
})();
