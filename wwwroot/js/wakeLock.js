// Improved Wake Lock API implementation
class WakeLockManager {
    constructor() {
        this.wakeLock = null;
        this.isWakeLockSupported = 'wakeLock' in navigator;
        this.isActive = false;
        this.videoElement = null;
        this.userHasInteracted = false;
        
        // Bind event handlers
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Handle visibility change (when user switches tabs)
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Wait for user interaction before enabling wake lock
        this.setupUserInteractionListeners();
    }
    
    setupUserInteractionListeners() {
        const handleInteraction = () => {
            this.userHasInteracted = true;
            this.requestWakeLock();
            
            // Remove listeners after first interaction
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
        };
        
        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
        document.addEventListener('keydown', handleInteraction);
    }
    
    async requestWakeLock() {
        if (this.isActive || !this.userHasInteracted) return;
        
        try {
            if (this.isWakeLockSupported) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock acquired using Wake Lock API');
                
                this.wakeLock.addEventListener('release', () => {
                    console.log('Wake lock released');
                    this.wakeLock = null;
                });
                
                this.isActive = true;
            } else {
                this.useFallbackMethod();
            }
        } catch (err) {
            console.warn('Wake lock request failed:', err);
            this.useFallbackMethod();
        }
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
                
                // Create a simple 1x1 canvas and stream it to video
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, 1, 1);
                
                // Use captureStream to create a video stream
                const stream = canvas.captureStream(1); // 1 FPS
                this.videoElement.srcObject = stream;
                
                document.body.appendChild(this.videoElement);
                this.videoElement.play().catch(console.warn);
            } else {
                this.videoElement.play().catch(console.warn);
            }
            
            this.isActive = true;
            console.log('Wake lock acquired using fallback method');
        } catch (err) {
            console.warn('Fallback wake lock method failed:', err);
            this.isActive = false;
        }
    }
    
    releaseWakeLock() {
        if (!this.isActive) return;
        
        try {
            if (this.wakeLock) {
                this.wakeLock.release();
                this.wakeLock = null;
            }
            
            if (this.videoElement) {
                this.videoElement.pause();
                if (this.videoElement.srcObject) {
                    const tracks = this.videoElement.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                }
                this.videoElement.style.display = 'none';
            }
            
            this.isActive = false;
            console.log('Wake lock released');
        } catch (err) {
            console.warn('Error releasing wake lock:', err);
        }
    }
    
    handleVisibilityChange() {
        if (document.visibilityState === 'visible' && this.userHasInteracted) {
            this.requestWakeLock();
        } else {
            this.releaseWakeLock();
        }
    }
    
    // Public methods for manual control
    enable() {
        if (this.userHasInteracted) {
            this.requestWakeLock();
        }
    }
    
    disable() {
        this.releaseWakeLock();
    }
    
    isEnabled() {
        return this.isActive;
    }
    
    // Cleanup method
    destroy() {
        this.releaseWakeLock();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.videoElement && this.videoElement.parentNode) {
            this.videoElement.parentNode.removeChild(this.videoElement);
        }
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
}

// Make wake lock manager available globally for Blazor interop
window.wakeLockManager = {
    enable: () => wakeLockManager?.enable(),
    disable: () => wakeLockManager?.disable(),
    isEnabled: () => wakeLockManager?.isEnabled() || false
};