export interface SpeechRecognitionResultCallback {
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as Record<string, unknown>;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function startChineseVoiceRecognition(
  callbacks: SpeechRecognitionResultCallback,
): (() => void) | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (!Ctor) {
    callbacks.onError?.('当前浏览器暂不支持语音识别，请使用 Chrome 或 Edge 浏览器。');
    return null;
  }

  try {
    const recognition = new Ctor();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const first = event.results?.[0]?.[0]?.transcript?.trim();
      if (first) {
        callbacks.onTranscript(first);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        callbacks.onError?.('麦克风权限未开启，请在浏览器地址栏允许麦克风访问。');
      } else if (event.error === 'no-speech') {
        callbacks.onError?.('没有听到声音，请靠近麦克风再试一次。');
      } else {
        callbacks.onError?.(`语音识别出现异常（${event.error}），请重试。`);
      }
    };

    recognition.onend = () => {
      callbacks.onEnd?.();
    };

    recognition.start();
    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore stop errors
      }
    };
  } catch {
    callbacks.onError?.('启动语音识别失败，请检查麦克风设备。');
    return null;
  }
}

export function speakChinese(text: string, rate = 0.92): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
