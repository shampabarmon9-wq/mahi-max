// Background Service Keepalive for Mahi AI Assistant
// Keeps audio context, websocket, and media stream alive when user minimizes or switches apps

class BackgroundServiceKeepalive {
  private audioElement: HTMLAudioElement | null = null;
  private wakeLock: any = null;
  private isActive: boolean = false;

  // Ultra-short silent WAV audio base64
  private silentAudioUri = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

  public start() {
    if (this.isActive) return;
    this.isActive = true;

    // 1. Inaudible looping audio element to maintain foreground media priority in Android / Chrome
    try {
      if (!this.audioElement) {
        this.audioElement = new Audio(this.silentAudioUri);
        this.audioElement.loop = true;
        this.audioElement.volume = 0.01;
      }
      this.audioElement.play().catch(() => {
        // Autoplay policy fallback
      });
    } catch (e) {
      console.warn('Silent audio keepalive init warning:', e);
    }

    // 2. Android MediaSession foreground indicator
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Mahi AI Assistant',
          artist: 'Active Background Assistant',
          album: 'Background Voice Service Active',
          artwork: [
            { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=192&h=192&fit=crop', sizes: '192x192', type: 'image/png' },
            { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=512&h=512&fit=crop', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.playbackState = 'playing';

        navigator.mediaSession.setActionHandler('pause', () => {
          this.stop();
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          this.stop();
        });
      } catch (e) {
        console.warn('MediaSession init error:', e);
      }
    }

    // 3. Screen WakeLock if available
    if ('wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        (navigator as any).wakeLock.request('screen').then((lock: any) => {
          this.wakeLock = lock;
          lock.addEventListener('release', () => {
            this.wakeLock = null;
          });
        }).catch(() => {});
      } catch (e) {}
    }
  }

  public stop() {
    this.isActive = false;

    // 1. Pause and reset audio
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {}
    }

    // 2. Clear MediaSession
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch (e) {}
    }

    // 3. Release WakeLock
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
        this.wakeLock = null;
      } catch (e) {}
    }
  }

  public isServiceActive(): boolean {
    return this.isActive;
  }
}

export const backgroundKeepalive = new BackgroundServiceKeepalive();
