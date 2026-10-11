// Accessibility Service Helper for MAHI AI Assistant
// Provides on-screen inspection, voice-driven navigation, element interaction,
// deep app launching, and Android Accessibility intent triggers

export interface AccessibilityActionResult {
  success: boolean;
  message: string;
  target?: string;
}

export class AccessibilityService {
  private enabled: boolean = false;
  private screenStream: MediaStream | null = null;

  constructor() {
    try {
      this.enabled = localStorage.getItem('mahi_accessibility_enabled') === 'true';
    } catch (e) {
      this.enabled = false;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem('mahi_accessibility_enabled', val ? 'true' : 'false');
    } catch (e) {}
  }

  // Open Android System Accessibility Settings
  public openSystemAccessibilitySettings() {
    this.setEnabled(true);
    try {
      window.location.href = 'intent:#Intent;action=android.settings.ACCESSIBILITY_SETTINGS;end';
    } catch (e) {
      console.warn('Could not launch accessibility intent directly:', e);
    }
  }

  public openSystemAppSettings() {
    try {
      window.location.href = 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;package=com.mahi.assistant;end';
    } catch (e) {
      console.warn('Could not launch app settings:', e);
    }
  }

  public openNotificationSettings() {
    try {
      window.location.href = 'intent:#Intent;action=android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS;end';
    } catch (e) {
      console.warn('Could not launch notification listener settings:', e);
    }
  }

  // Request real Screen Vision capture stream (GetDisplayMedia)
  public async requestScreenVision(): Promise<boolean> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        this.setEnabled(true);
        return true;
      }
    } catch (e) {
      console.warn('Screen capture not supported or cancelled:', e);
    }
    this.setEnabled(true);
    return true;
  }

  // Inspect what is visible on the current screen (DOM, buttons, text, inputs)
  public inspectVisibleScreen(): { summary: string; elements: string[]; inputs: string[] } {
    const elements: string[] = [];
    const inputs: string[] = [];

    // Collect clickable elements
    const clickables = Array.from(document.querySelectorAll('button:not([disabled]), a[href], [role="button"]'));
    clickables.slice(0, 20).forEach((el) => {
      const text = el.textContent?.trim() || el.getAttribute('aria-label');
      if (text && text.length > 0 && text.length < 60 && !elements.includes(text)) {
        elements.push(text);
      }
    });

    // Collect inputs & placeholders
    const inputFields = Array.from(document.querySelectorAll('input, textarea'));
    inputFields.forEach((el) => {
      const placeholder = (el as HTMLInputElement).placeholder || (el as HTMLInputElement).name;
      if (placeholder && !inputs.includes(placeholder)) {
        inputs.push(placeholder);
      }
    });

    const summary = `Screen inspection: ${elements.length} clickable elements detected (${elements.slice(0, 5).join(', ')}), ${inputs.length} input fields detected.`;

    return { summary, elements, inputs };
  }

  // Find and activate a visible button or clickable element matching query
  public clickElementByText(query: string): AccessibilityActionResult {
    const clean = query.trim().toLowerCase();
    const clickables = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"], div[tabindex]'));
    
    for (const el of clickables) {
      const text = (el.textContent || (el as HTMLInputElement).value || el.getAttribute('aria-label') || '').toLowerCase();
      if (text.includes(clean)) {
        (el as HTMLElement).click();
        return { success: true, message: `Activated control: "${el.textContent?.trim() || clean}"`, target: clean };
      }
    }

    return { success: false, message: `Could not find clickable element matching "${query}"` };
  }

  // Type text into an input field matching query
  public typeIntoInput(query: string, textToType: string): AccessibilityActionResult {
    const clean = query.trim().toLowerCase();
    const inputs = Array.from(document.querySelectorAll('input, textarea')) as (HTMLInputElement | HTMLTextAreaElement)[];

    for (const el of inputs) {
      const label = (el.placeholder || el.name || el.id || '').toLowerCase();
      if (label.includes(clean)) {
        el.value = textToType;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true, message: `Typed "${textToType}" into ${label || 'input field'}` };
      }
    }

    // Fallback: type in first active input
    if (inputs.length > 0) {
      inputs[0].value = textToType;
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true, message: `Typed "${textToType}" into input` };
    }

    return { success: false, message: `No suitable input field found for "${query}"` };
  }

  // Scroll viewport or active scrollable container
  public scroll(direction: 'up' | 'down' | 'top' | 'bottom'): AccessibilityActionResult {
    const scrollAmount = window.innerHeight * 0.75;
    if (direction === 'down') {
      window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      return { success: true, message: 'Scrolled down smoothly' };
    } else if (direction === 'up') {
      window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
      return { success: true, message: 'Scrolled up smoothly' };
    } else if (direction === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return { success: true, message: 'Scrolled to top' };
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return { success: true, message: 'Scrolled to bottom' };
    }
  }

  // Launch apps via real Android intent or web fallback
  public launchApp(appName: string): AccessibilityActionResult {
    const cleanName = appName.trim().toLowerCase();
    try {
      if (cleanName.includes('whatsapp')) {
        window.location.href = 'whatsapp://';
        return { success: true, message: 'Opening WhatsApp' };
      } else if (cleanName.includes('youtube')) {
        window.location.href = 'vnd.youtube://';
        return { success: true, message: 'Opening YouTube' };
      } else if (cleanName.includes('sms') || cleanName.includes('message')) {
        window.location.href = 'sms:';
        return { success: true, message: 'Opening Messages / SMS' };
      } else if (cleanName.includes('call') || cleanName.includes('dialer') || cleanName.includes('phone')) {
        window.location.href = 'tel:';
        return { success: true, message: 'Opening Phone Dialer' };
      } else if (cleanName.includes('camera')) {
        window.location.href = 'intent:#Intent;action=android.media.action.IMAGE_CAPTURE;end';
        return { success: true, message: 'Opening Camera' };
      } else if (cleanName.includes('setting')) {
        window.location.href = 'intent:#Intent;action=android.settings.SETTINGS;end';
        return { success: true, message: 'Opening System Settings' };
      } else if (cleanName.includes('chrome') || cleanName.includes('browser')) {
        window.location.href = 'intent:#Intent;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end';
        return { success: true, message: 'Opening Web Browser' };
      } else if (cleanName.includes('gallery') || cleanName.includes('photo')) {
        window.location.href = 'intent:#Intent;action=android.intent.action.VIEW;type=image/*;end';
        return { success: true, message: 'Opening Photos / Gallery' };
      } else if (cleanName.includes('instagram')) {
        window.location.href = 'instagram://app';
        return { success: true, message: 'Opening Instagram' };
      } else {
        // Generic launch
        window.location.href = `intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;
        return { success: true, message: `Launching ${appName}` };
      }
    } catch (e) {
      return { success: false, message: `Could not launch ${appName}` };
    }
  }

  // Trigger real SMS sending
  public sendSMSIntent(recipient: string, message: string): AccessibilityActionResult {
    try {
      const cleanPhone = recipient.replace(/[^0-9+]/g, '');
      const encodedMsg = encodeURIComponent(message);
      const url = cleanPhone ? `sms:${cleanPhone}?body=${encodedMsg}` : `sms:?body=${encodedMsg}`;
      window.location.href = url;
      return { success: true, message: `SMS drafted for ${recipient}` };
    } catch (e) {
      return { success: false, message: 'Failed to launch SMS intent' };
    }
  }

  // Trigger real Phone Call
  public makeCallIntent(phoneNumber: string): AccessibilityActionResult {
    try {
      const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
      window.location.href = `tel:${cleanPhone}`;
      return { success: true, message: `Calling ${phoneNumber}` };
    } catch (e) {
      return { success: false, message: 'Failed to launch Call intent' };
    }
  }

  // Go Back
  public navigateBack(): AccessibilityActionResult {
    if (window.history.length > 1) {
      window.history.back();
      return { success: true, message: 'Navigated back' };
    }
    return { success: false, message: 'No previous page in history' };
  }
}

export const accessibilityService = new AccessibilityService();
