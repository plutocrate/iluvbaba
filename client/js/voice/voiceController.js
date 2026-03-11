/**
 * Voice Controller
 * Web Speech API — requires a secure context (HTTPS or localhost).
 * Brave on HTTP localhost may still block mic; HTTPS fixes all browsers.
 */

export class VoiceController {
  constructor(onCommand) {
    this.onCommand = onCommand;
    this.recognition = null;
    this.active = false;
    this.supported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    this.pillEl = null;
    this.statusEl = null;
  }

  init(pillEl, statusEl) {
    this.pillEl   = pillEl;
    this.statusEl = statusEl;

    if (!this.supported) {
      this._setStatus('Not supported in this browser', 'inactive');
      return false;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.continuous     = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (evt) => {
      const txt = evt.results[evt.results.length - 1][0].transcript.toLowerCase().trim();
      this._handleTranscript(txt);
    };

    this.recognition.onerror = (evt) => {
      if (evt.error === 'not-allowed') {
        this._setStatus('Mic blocked — allow mic in browser settings', 'error');
        this.active = false;
      } else if (evt.error === 'network') {
        // Brave and some browsers report "network" when mic is blocked on non-HTTPS.
        // Since we're already on HTTPS, this usually means the user denied the permission.
        if (location.protocol !== 'https:') {
          this._setStatus('Mic needs HTTPS — use https://localhost:3000', 'error');
        } else {
          this._setStatus('Mic blocked — check browser mic permissions', 'error');
        }
        this.active = false;
      } else if (evt.error !== 'no-speech') {
        this._setStatus('Error: ' + evt.error, 'error');
      }
    };

    this.recognition.onend = () => {
      if (this.active) {
        setTimeout(() => { try { this.recognition.start(); } catch(e){} }, 200);
      }
    };

    return true;
  }

  _handleTranscript(text) {
    const map = {
      'up':'up','move up':'up','go up':'up','north':'up',
      'down':'down','move down':'down','go down':'down','south':'down',
      'left':'left','move left':'left','go left':'left','west':'left',
      'right':'right','move right':'right','go right':'right','east':'right',
      'undo':'undo','go back':'undo','back':'undo',
      'restart':'restart','reset':'restart','start over':'restart',
    };
    for (const [phrase, cmd] of Object.entries(map)) {
      if (text.includes(phrase)) {
        this._setStatus('Heard: ' + cmd, 'active');
        this.onCommand(cmd);
        return;
      }
    }
  }

  toggle() {
    if (!this.supported || !this.recognition) return;
    this.active ? this.stop() : this.start();
  }

  start() {
    if (!this.recognition) return;
    this.active = true;
    try {
      this.recognition.start();
      this._setStatus('Listening…', 'active');
    } catch(e) {
      this._setStatus('Could not start mic', 'error');
    }
  }

  stop() {
    this.active = false;
    try { this.recognition?.stop(); } catch(e){}
    this._setStatus('Off', 'inactive');
  }

  _setStatus(msg, type) {
    if (this.statusEl) this.statusEl.textContent = msg;
    if (this.pillEl)   this.pillEl.className = 'voice-pill ' + type;
  }
}
