// Game Logic JavaScript for Kol Health Tracker
(function() {
    'use strict';

    // Vibration functionality
    window.vibrate = function (duration) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    };

    // Force fullscreen and handle viewport
    function setupFullscreen() {
        // Set viewport height properly for mobile browsers
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Try to enter fullscreen mode if supported
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen request failed:', err);
            });
        }
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            }, 100);
        });
    }

    // Setup fullscreen on page load
    document.addEventListener('DOMContentLoaded', setupFullscreen);

    // Prevent context menu and long press selection
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // Prevent long press selection on all elements
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });

    // Prevent drag and drop
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });

    // Sound effects using Web Audio API
    let audioContext = null;

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playTone(frequency, duration, type = 'sine') {
        initAudio();
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    function playHealthIncrease() {
        playTone(1600, 0.15, 'sine');
    }

    function playHealthDecrease() {
        playTone(800, 0.15, 'sine');
    }

    function playResetSound() {
        // Play a quick two-tone descending reset sound
        playTone(700, 0.15, 'triangle');
        setTimeout(() => playTone(400, 0.15, 'triangle'), 150);
    }

    function playRollSound() {
        // Play a dice rolling sound effect
        playTone(1200, 0.1, 'sawtooth');
        setTimeout(() => playTone(800, 0.1, 'sawtooth'), 100);
        setTimeout(() => playTone(600, 0.1, 'sawtooth'), 200);
        setTimeout(() => playTone(400, 0.2, 'sine'), 300);
    }

    // Expose sound functions globally
    window.playHealthIncrease = playHealthIncrease;
    window.playHealthDecrease = playHealthDecrease;
    window.playResetSound = playResetSound;
    window.playRollSound = playRollSound;

    // Long press detection
    let longPressTimer = null;
    let longPressDelay = 500; // 500ms for long press

    function startLongPress(dotNetRef, isIncrease) {
        longPressTimer = setTimeout(() => {
            dotNetRef.invokeMethodAsync('OnLongPress', isIncrease);
        }, longPressDelay);
    }

    function cancelLongPress() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }

    // Expose long press functions globally
    window.startLongPress = startLongPress;
    window.cancelLongPress = cancelLongPress;

    // Font switching functionality
    window.changeFont = function(fontName) {
        const root = document.documentElement;
        let fontFamily;
        
        switch(fontName) {
            case 'Anta':
                fontFamily = "'Anta', sans-serif";
                break;
            case 'Rationale':
                fontFamily = "'Rationale', sans-serif";
                break;
            case 'Oxanium':
            default:
                fontFamily = "'Oxanium', monospace";
                break;
        }
        
        root.style.setProperty('--app-font-family', fontFamily);
        console.log('Font changed to:', fontName);
    };

    // PWA Install prompt handling
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        console.log('Install prompt ready');
        
        // Optionally show a custom install button or notification
        // You could add a button to your UI here to trigger the install
    });

    window.addEventListener('appinstalled', (evt) => {
        console.log('App was installed');
        deferredPrompt = null;
    });

    // Function to trigger install prompt (can be called from UI)
    window.triggerInstall = function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
            });
        }
    };
})(); 