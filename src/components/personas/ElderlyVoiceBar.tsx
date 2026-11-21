'use client';

import { useRef, useState } from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';
import { getCompartmentMeta } from '@/data/compartments';
import { getItemHealthStatus } from '@/lib/inventoryUtils';
import {
  speakChinese,
  startChineseVoiceRecognition,
  stopSpeaking,
} from '@/lib/speech';

interface ElderlyVoiceBarProps {
  onVoiceSearchQuery: (query: string) => void;
  onItemLocated?: () => void;
}

export function ElderlyVoiceBar({
  onVoiceSearchQuery,
  onItemLocated,
}: ElderlyVoiceBarProps) {
  const { items, focusItemFromList } = usePantryStore();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<string>(
    '按住下方蓝色大按钮说出要找的东西（如“酱油在哪”），松开后会自动在 3D 高亮并为您读出位置与保质期。',
  );
  const stopRef = useRef<(() => void) | null>(null);
  const pressStartTimeRef = useRef<number>(0);

  const handleVoiceQuery = (spoken: string) => {
    const cleaned = spoken
      .replace(/[。，！？\s请帮我找一下在哪里还有吗什么时候过期]/g, '')
      .trim();

    onVoiceSearchQuery(cleaned);

    const matched = items.find(
      (i) =>
        (cleaned.length > 0 && i.name.includes(cleaned)) ||
        (cleaned.includes('酱油') && i.name.includes('酱油')) ||
        (cleaned.includes('奶') && i.name.includes('奶')) ||
        (cleaned.includes('蛋') && i.name.includes('蛋')) ||
        (cleaned.includes('苹果') && i.name.includes('苹果')) ||
        (cleaned.includes('豆腐') && i.name.includes('豆腐')) ||
        (cleaned.includes('米') && i.name.includes('米')) ||
        (cleaned.includes('水饺') && i.name.includes('水饺')) ||
        (cleaned.includes('冰淇淋') && i.name.includes('冰淇淋')),
    );

    if (matched) {
      focusItemFromList(matched.id);
      onItemLocated?.();
      const loc = getCompartmentMeta(matched.compartmentId)?.label ?? '储物区';
      const health = getItemHealthStatus(matched);
      const expiryInfo = health.isExpired
        ? `已经过期 ${Math.abs(health.daysLeft)} 天，请不要食用`
        : `保质期到 ${matched.expiryDate}，还有 ${health.daysLeft} 天`;
      const msg = `找到了！${matched.name}在${loc}，现在还剩 ${matched.quantity} ${matched.unit}，${expiryInfo}。`;
      setFeedback(msg);
      speakChinese(msg, 0.86);
    } else {
      const msg = `您刚才说的是“${spoken}”，已为您在下方列表筛选，您也可以点下方大按钮直接问。`;
      setFeedback(msg);
      speakChinese(msg, 0.88);
    }
  };

  const stopVoice = () => {
    stopRef.current?.();
    stopRef.current = null;
    setIsListening(false);
  };

  const startVoice = () => {
    setIsListening(true);
    setFeedback('正在听您说话… 请问“酱油在哪”或“牛奶在哪”，说完松开按钮。');
    stopRef.current = startChineseVoiceRecognition({
      onTranscript: (text) => {
        handleVoiceQuery(text);
      },
      onError: (errMsg) => {
        setFeedback(errMsg);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  // Supports BOTH press-and-hold (>280ms) AND quick single-tap toggle without double-firing
  const handlePointerDown = () => {
    pressStartTimeRef.current = Date.now();
    if (isListening) {
      stopVoice();
    } else {
      startVoice();
    }
  };

  const handlePointerUp = () => {
    const heldMs = Date.now() - pressStartTimeRef.current;
    if (isListening && heldMs >= 280) {
      stopVoice();
    }
  };

  const broadcastExpiryAlerts = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      setFeedback('已停止语音播报。');
      return;
    }

    const expired = items.filter((i) => getItemHealthStatus(i).isExpired);
    const expiring = items.filter((i) => getItemHealthStatus(i).isExpiringSoon);
    const lowStock = items.filter((i) => getItemHealthStatus(i).isLowStock);

    const parts: string[] = [];
    if (expired.length > 0) {
      parts.push(
        `提醒您，有 ${expired.length} 样食物已经过期：${expired.map((i) => i.name).join('、')}，请尽快清理。`,
      );
    }
    if (expiring.length > 0) {
      parts.push(
        `有 ${expiring.length} 样食物三天内到期：${expiring.map((i) => i.name).join('、')}，建议今天先吃。`,
      );
    }
    if (lowStock.length > 0) {
      parts.push(
        `快用完需要买的有 ${lowStock.length} 样：${lowStock.slice(0, 3).map((i) => i.name).join('、')}。`,
      );
    }

    const speechText =
      parts.length > 0
        ? parts.join(' ')
        : '太好了！家里的食物目前全部新鲜充足。';

    setFeedback(speechText);
    if (speakChinese(speechText, 0.86)) {
      setIsSpeaking(true);
      window.setTimeout(() => setIsSpeaking(false), 12000);
    }
  };

  return (
    <section
      className="pantry-surface p-5"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            长辈大字语音助手
          </h2>
          <p className="mt-1.5 text-xl font-semibold leading-relaxed text-gray-800">
            {feedback}
          </p>
        </div>

        {/* Oversized >= 64px AAA High-Contrast Action Buttons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="flex min-h-[72px] select-none items-center justify-center gap-3 rounded-2xl border-2 border-gray-900 px-6 py-4 text-2xl font-black text-white shadow-sm transition-transform active:scale-[0.98]"
            style={{
              backgroundColor: isListening ? '#b91c1c' : '#1d4ed8',
            }}
          >
            <Mic className={`h-8 w-8 ${isListening ? 'animate-pulse' : ''}`} />
            <span>{isListening ? '正在听您说…松开或再点停止' : '按住说话 · 找东西'}</span>
          </button>

          <button
            type="button"
            onClick={broadcastExpiryAlerts}
            className="flex min-h-[72px] items-center justify-center gap-3 rounded-2xl border-2 border-gray-900 px-6 py-4 text-2xl font-black text-white shadow-sm transition-transform active:scale-[0.98]"
            style={{
              backgroundColor: isSpeaking ? '#991b1b' : '#111827',
            }}
          >
            {isSpeaking ? (
              <VolumeX className="h-8 w-8" />
            ) : (
              <Volume2 className="h-8 w-8" />
            )}
            <span>{isSpeaking ? '停止语音播报' : '播报库存与过期提醒'}</span>
          </button>
        </div>

        {/* One-tap large demo voice queries */}
        <div className="flex flex-wrap items-center gap-2.5 border-t-2 border-gray-200 pt-3">
          <span className="text-lg font-extrabold text-gray-900">
            点一下直接问：
          </span>
          {['酱油在哪', '牛奶在哪', '鸡蛋在哪', '苹果在哪'].map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => handleVoiceQuery(phrase)}
              className="min-h-[64px] rounded-2xl border-2 border-gray-900 bg-blue-50 px-5 py-2 text-xl font-extrabold text-blue-900 transition-colors hover:bg-blue-100 active:scale-95"
            >
              “{phrase}”
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
