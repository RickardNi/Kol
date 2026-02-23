// Wake Lock implementation with robust iOS support
// Uses Screen Wake Lock API (Android/Chrome, iOS 16.4+) with a silent video
// fallback for iOS where the API is unreliable or unavailable.
class WakeLockManager {
    constructor() {
        this.wakeLock = null;
        this.isWakeLockSupported = 'wakeLock' in navigator;
        this.isActive = false;
        this.videoElement = null;
        this.userHasInteracted = false;
        this.lastInteractionTime = 0;
        this.keepAliveInterval = null;

        // Detect iOS/iPadOS (includes iPad reporting as Mac)
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        // Detect if running as installed PWA
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone === true ||
                           document.referrer.includes('android-app://');

        // Bind handlers
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

        this.setupEventListeners();

        console.log(`Wake Lock: iOS=${this.isIOS}, PWA=${this.isInstalled}, API=${this.isWakeLockSupported}`);
    }

    setupEventListeners() {
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // Always track user interactions – never remove these listeners.
        // Fresh interaction timestamps are needed to re-acquire wake locks,
        // especially on iOS which releases them aggressively.
        const onInteraction = () => {
            this.userHasInteracted = true;
            this.lastInteractionTime = Date.now();
            this.requestWakeLock();
        };

        document.addEventListener('click', onInteraction, { passive: true });
        document.addEventListener('touchstart', onInteraction, { passive: true });
        document.addEventListener('keydown', onInteraction, { passive: true });
    }

    // ── Wake Lock API ────────────────────────────────────────────────

    async acquireNativeWakeLock() {
        if (!this.isWakeLockSupported || this.wakeLock) return;

        try {
            this.wakeLock = await navigator.wakeLock.request('screen');

            this.wakeLock.addEventListener('release', () => {
                this.wakeLock = null;
                console.log('Wake Lock API released');

                // Immediately try to re-acquire if page is still visible
                if (document.visibilityState === 'visible' && this.userHasInteracted) {
                    setTimeout(() => this.acquireNativeWakeLock(), 500);
                }
            });

            console.log('Wake Lock API acquired');
        } catch (err) {
            console.warn('Wake Lock API request failed:', err.message);
        }
    }

    releaseNativeWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release().catch(() => {});
            this.wakeLock = null;
        }
    }

    // ── Silent-video fallback (critical for iOS) ─────────────────────
    // iOS Safari does not reliably honour the Screen Wake Lock API in
    // PWA/standalone mode. Playing a tiny looping MP4 with `playsinline`
    // is the proven workaround (the same technique used by NoSleep.js).
    // canvas.captureStream() does NOT prevent sleep on iOS.

    ensureVideoFallback() {
        if (!this.videoElement) {
            this.createVideoElement();
        }

        if (this.videoElement.paused) {
            const p = this.videoElement.play();
            if (p) p.catch(() => {
                // Autoplay blocked – will retry on next interaction
            });
        }
    }

    createVideoElement() {
        // Minimal valid H.264 MP4 (677 bytes) – 2x2 black, 1 s, no audio.
        const SILENT_MP4 =
            'data:video/mp4;base64,' +
            'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAJZbW9vdgAAAGxtdmhkAAAA' +
            'AAAAAAAAAAAAAAAD6AAAA+gAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAA' +
            'AAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAeV0cmFrAAAA' +
            'XHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+gAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAA' +
            'AAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAIAAAACAAAAAAGBbWRpYQAAACBtZGhkAAAA' +
            'AAAAAAAAAAAAAAAD6AAAA+hVxAAAAAAALmhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAAAA' +
            'VmlkZW9IYW5kbGVyXDAAAAErbWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAc' +
            'ZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAAA63N0YmwAAACHc3RzZAAAAAAAAAABAAAAd2F2' +
            'YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAgACAEgAAABIAAAAAAAAAAEAAAAAAAAAAAAA' +
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABP//wAAACFhdmNDAULAHv/hAApnQsAe2QCgR/' +
            '7IAQAEaM44gAAAABhzdHRzAAAAAAAAAAEAAAABAAAAAQAAABxzdHNjAAAAAAAAAAEAAAAB' +
            'AAAAAQAAAAEAAAAUc3RzegAAAAAAAAAkAAAAAQAAABRzdGNvAAAAAAAAAAEAAAKBAAAALG1k' +
            'YXQAAAAKZ0LAHtkAoEf+yAAAAARozjiAAAAACmWIgEAAAAAAABA=';

        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('playsinline', '');
        this.videoElement.setAttribute('muted', '');
        this.videoElement.muted = true;      // property must also be set for iOS
        this.videoElement.loop = true;
        this.videoElement.src = SILENT_MP4;
        this.videoElement.style.cssText =
            'position:fixed;top:-100px;left:-100px;width:1px;height:1px;' +
            'opacity:0;pointer-events:none;z-index:-9999;';

        document.body.appendChild(this.videoElement);
    }

    stopVideoFallback() {
        if (this.videoElement) {
            this.videoElement.pause();
        }
    }

    // ── Periodic keep-alive ──────────────────────────────────────────

    startKeepAlive() {
        if (this.keepAliveInterval) return;

        this.keepAliveInterval = setInterval(() => {
            if (document.visibilityState !== 'visible') return;

            // Re-acquire native wake lock if it was released
            if (this.isWakeLockSupported && !this.wakeLock && this.userHasInteracted) {
                this.acquireNativeWakeLock();
            }

            // Keep video playing on iOS
            if (this.isIOS && this.videoElement && this.videoElement.paused && this.userHasInteracted) {
                this.videoElement.play().catch(() => {});
            }
        }, 10_000); // every 10 s
    }

    stopKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }

    // ── Public API ───────────────────────────────────────────────────

    async requestWakeLock() {
        if (!this.userHasInteracted) return;

        // On iOS, ALWAYS use the video fallback – it is the only method
        // that reliably prevents screen sleep, especially in PWA mode.
        if (this.isIOS) {
            this.ensureVideoFallback();
        }

        // Also use the native API where supported (works well on
        // Android/Chrome; partially on iOS 16.4+).
        await this.acquireNativeWakeLock();

        // On platforms without the API and not iOS (rare), also use video
        if (!this.isIOS && !this.isWakeLockSupported) {
            this.ensureVideoFallback();
        }

        this.isActive = true;
        this.startKeepAlive();
    }

    releaseWakeLock() {
        this.stopKeepAlive();
        this.releaseNativeWakeLock();
        this.stopVideoFallback();
        this.isActive = false;
        console.log('Wake lock released');
    }

    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // Page is visible again – re-acquire immediately
            if (this.userHasInteracted) {
                setTimeout(() => this.requestWakeLock(), 300);
            }
        } else {
            // Page hidden – release to save battery
            this.releaseWakeLock();
        }
    }

    // Convenience methods called from Blazor
    enable() {
        if (this.userHasInteracted) this.requestWakeLock();
    }

    disable() {
        this.releaseWakeLock();
    }

    forceEnable() {
        this.userHasInteracted = true;
        this.lastInteractionTime = Date.now();
        this.requestWakeLock();
    }

    isEnabled() {
        return this.isActive;
    }

    getStatus() {
        return {
            isActive: this.isActive,
            isInstalled: this.isInstalled,
            isIOS: this.isIOS,
            isWakeLockSupported: this.isWakeLockSupported,
            userHasInteracted: this.userHasInteracted,
        };
    }

    destroy() {
        this.releaseWakeLock();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);

        if (this.videoElement && this.videoElement.parentNode) {
            this.videoElement.parentNode.removeChild(this.videoElement);
            this.videoElement = null;
        }
    }
}

// ── Bootstrap ────────────────────────────────────────────────────────
let wakeLockManager = null;

function initWakeLock() {
    wakeLockManager = new WakeLockManager();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWakeLock);
} else {
    initWakeLock();
}

// Blazor interop surface
window.wakeLockManager = {
    enable:      () => wakeLockManager?.enable(),
    disable:     () => wakeLockManager?.disable(),
    forceEnable: () => wakeLockManager?.forceEnable(),
    isEnabled:   () => wakeLockManager?.isEnabled() || false,
    getStatus:   () => wakeLockManager?.getStatus() || {},
    destroy:     () => wakeLockManager?.destroy()
};
