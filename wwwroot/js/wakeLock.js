// Enhanced Wake Lock API implementation for PWA and Browser compatibility
class WakeLockManager {
    constructor() {
        this.wakeLock = null;
        this.isWakeLockSupported = 'wakeLock' in navigator;
        this.isActive = false;
        this.videoElement = null;
        this.userHasInteracted = false;
        this.lastInteractionTime = 0;
        this.keepAliveInterval = null;
        this.animationFrame = null;
        
        // Detect if running as installed PWA
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true || 
                          document.referrer.includes('android-app://');
        
        // Bind event handlers
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log(`Wake Lock Manager initialized - ${this.isInstalled ? 'PWA' : 'Browser'} mode`);
    }
    
    setupEventListeners() {
        // Handle visibility change (when user switches tabs)
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Handle window focus/blur for better browser support
        window.addEventListener('focus', this.handleFocus);
        window.addEventListener('blur', this.handleBlur);
        
        // Setup initial user interaction listeners
        this.setupUserInteractionListeners();
    }
    
    setupUserInteractionListeners() {
        const handleInteraction = (e) => {
            this.userHasInteracted = true;
            this.lastInteractionTime = Date.now();
            
            // For browser mode, be more aggressive about requesting wake lock
            if (!this.isInstalled) {
                // Small delay to ensure interaction is registered
                setTimeout(() => {
                    this.requestWakeLock();
                }, 100);
            } else {
                this.requestWakeLock();
            }
            
            // Don't remove listeners in browser mode - we need fresh interactions
            if (this.isInstalled) {
                this.removeInteractionListeners();
            }
        };
        
        // Store references for potential removal
        this.interactionHandlers = {
            click: handleInteraction,
            touchstart: handleInteraction,
            touchend: handleInteraction,
            keydown: handleInteraction
        };
        
        document.addEventListener('click', this.interactionHandlers.click, { passive: true });
        document.addEventListener('touchstart', this.interactionHandlers.touchstart, { passive: true });
        document.addEventListener('touchend', this.interactionHandlers.touchend, { passive: true });
        document.addEventListener('keydown', this.interactionHandlers.keydown, { passive: true });
    }
    
    removeInteractionListeners() {
        document.removeEventListener('click', this.interactionHandlers.click);
        document.removeEventListener('touchstart', this.interactionHandlers.touchstart);
        document.removeEventListener('touchend', this.interactionHandlers.touchend);
        document.removeEventListener('keydown', this.interactionHandlers.keydown);
    }
    
    isRecentInteraction() {
        const timeSinceInteraction = Date.now() - this.lastInteractionTime;
        // Consider interaction recent if within last 30 seconds for browser, 5 minutes for PWA
        const threshold = this.isInstalled ? 300000 : 30000;
        return timeSinceInteraction < threshold;
    }
    
    async requestWakeLock() {
        // Check if we should request wake lock
        if (this.isActive || !this.userHasInteracted) return;
        
        // For browser mode, ensure recent interaction
        if (!this.isInstalled && !this.isRecentInteraction()) {
            console.log('Interaction too old for browser wake lock');
            return;
        }
        
        try {
            if (this.isWakeLockSupported) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock acquired using Wake Lock API');
                
                this.wakeLock.addEventListener('release', () => {
                    console.log('Wake lock released');
                    this.wakeLock = null;
                    this.isActive = false;
                    
                    // In browser mode, try to re-acquire quickly
                    if (!this.isInstalled && document.visibilityState === 'visible') {
                        setTimeout(() => {
                            if (this.isRecentInteraction()) {
                                this.requestWakeLock();
                            }
                        }, 1000);
                    }
                });
                
                this.isActive = true;
                
                // Setup keep-alive for browser mode
                if (!this.isInstalled) {
                    this.setupKeepAlive();
                }
            } else {
                this.useFallbackMethod();
            }
        } catch (err) {
            console.warn('Wake lock request failed:', err);
            this.useFallbackMethod();
        }
    }
    
    setupKeepAlive() {
        // Clear existing interval
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }
        
        // Re-request wake lock periodically in browser
        this.keepAliveInterval = setInterval(async () => {
            if (document.visibilityState === 'visible' && !this.wakeLock && this.isRecentInteraction()) {
                try {
                    await this.requestWakeLock();
                } catch (err) {
                    console.warn('Keep-alive wake lock request failed:', err);
                }
            }
        }, 15000); // Every 15 seconds
    }
    
    useFallbackMethod() {
        try {
            if (!this.videoElement) {
                this.videoElement = document.createElement('video');
                this.videoElement.setAttribute('muted', '');
                this.videoElement.setAttribute('playsinline', '');
                this.videoElement.setAttribute('loop', '');
                this.videoElement.style.position = 'fixed';
                this.videoElement.style.top = '-1000px';
                this.videoElement.style.left = '-1000px';
                this.videoElement.style.width = '1px';
                this.videoElement.style.height = '1px';
                this.videoElement.style.opacity = '0';
                this.videoElement.style.pointerEvents = 'none';
                this.videoElement.style.zIndex = '-9999';
                
                // Create appropriate video stream based on environment
                if (!this.isInstalled) {
                    this.createPersistentVideoStream();
                } else {
                    this.createSimpleVideoStream();
                }
                
                document.body.appendChild(this.videoElement);
            }
            
            // Ensure video is playing
            const playPromise = this.videoElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.warn('Video play failed:', err);
                    // Try again after a short delay
                    setTimeout(() => {
                        this.videoElement.play().catch(console.warn);
                    }, 1000);
                });
            }
            
            this.isActive = true;
            console.log(`Wake lock acquired using fallback method (${this.isInstalled ? 'PWA' : 'Browser'} mode)`);
        } catch (err) {
            console.warn('Fallback wake lock method failed:', err);
            this.isActive = false;
        }
    }
    
    createSimpleVideoStream() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 1, 1);
        
        const stream = canvas.captureStream(1);
        this.videoElement.srcObject = stream;
    }
    
    createPersistentVideoStream() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        
        // Animate the canvas to keep it active for browser
        let frame = 0;
        const animate = () => {
            if (this.isActive && document.visibilityState === 'visible') {
                ctx.fillStyle = frame % 2 === 0 ? 'black' : 'white';
                ctx.fillRect(0, 0, 1, 1);
                frame++;
            }
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
        
        const stream = canvas.captureStream(30); // Higher FPS for browser
        this.videoElement.srcObject = stream;
    }
    
    releaseWakeLock() {
        if (!this.isActive) return;
        
        try {
            // Clear keep-alive interval
            if (this.keepAliveInterval) {
                clearInterval(this.keepAliveInterval);
                this.keepAliveInterval = null;
            }
            
            // Stop animation frame
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            
            // Release wake lock
            if (this.wakeLock) {
                this.wakeLock.release();
                this.wakeLock = null;
            }
            
            // Handle video element
            if (this.videoElement) {
                this.videoElement.pause();
                if (this.videoElement.srcObject) {
                    const tracks = this.videoElement.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                }
                // Don't remove video element, just hide it
                this.videoElement.style.display = 'none';
            }
            
            this.isActive = false;
            console.log('Wake lock released');
        } catch (err) {
            console.warn('Error releasing wake lock:', err);
        }
    }
    
    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            console.log('Page became visible');
            if (this.userHasInteracted) {
                // For browser mode, we need fresher interaction
                if (!this.isInstalled) {
                    if (this.isRecentInteraction()) {
                        setTimeout(() => this.requestWakeLock(), 500);
                    } else {
                        console.log('Need fresh user interaction for browser wake lock');
                    }
                } else {
                    // PWA mode - can use older interaction
                    setTimeout(() => this.requestWakeLock(), 500);
                }
            }
        } else {
            console.log('Page became hidden');
            this.releaseWakeLock();
        }
    }
    
    handleFocus() {
        console.log('Window focused');
        if (this.userHasInteracted && !this.isActive) {
            setTimeout(() => this.requestWakeLock(), 100);
        }
    }
    
    handleBlur() {
        console.log('Window blurred');
        // Don't release immediately - user might be switching apps briefly
        setTimeout(() => {
            if (document.visibilityState === 'hidden') {
                this.releaseWakeLock();
            }
        }, 1000);
    }
    
    // Public methods for manual control
    enable() {
        if (this.userHasInteracted) {
            this.requestWakeLock();
        } else {
            console.log('User interaction required before enabling wake lock');
        }
    }
    
    disable() {
        this.releaseWakeLock();
    }
    
    isEnabled() {
        return this.isActive;
    }
    
    // Force enable with fresh interaction (useful for button clicks)
    forceEnable() {
        this.userHasInteracted = true;
        this.lastInteractionTime = Date.now();
        this.requestWakeLock();
    }
    
    // Get status info
    getStatus() {
        return {
            isActive: this.isActive,
            isInstalled: this.isInstalled,
            isWakeLockSupported: this.isWakeLockSupported,
            userHasInteracted: this.userHasInteracted,
            isRecentInteraction: this.isRecentInteraction(),
            lastInteractionTime: this.lastInteractionTime
        };
    }
    
    // Cleanup method
    destroy() {
        this.releaseWakeLock();
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('focus', this.handleFocus);
        window.removeEventListener('blur', this.handleBlur);
        
        // Remove interaction listeners
        if (this.interactionHandlers) {
            this.removeInteractionListeners();
        }
        
        // Clean up video element
        if (this.videoElement && this.videoElement.parentNode) {
            this.videoElement.parentNode.removeChild(this.videoElement);
        }
        
        console.log('Wake Lock Manager destroyed');
    }
}

// Initialize wake lock manager
let wakeLockManager = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWakeLock);
} else {
    initWakeLock();
}

function initWakeLock() {
    wakeLockManager = new WakeLockManager();
    
    // Log initial status
    console.log('Wake Lock Manager Status:', wakeLockManager.getStatus());
}

// Make wake lock manager available globally for Blazor interop
window.wakeLockManager = {
    enable: () => wakeLockManager?.enable(),
    disable: () => wakeLockManager?.disable(),
    forceEnable: () => wakeLockManager?.forceEnable(),
    isEnabled: () => wakeLockManager?.isEnabled() || false,
    getStatus: () => wakeLockManager?.getStatus() || {},
    destroy: () => wakeLockManager?.destroy()
};