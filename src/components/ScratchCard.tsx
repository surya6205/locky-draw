import React, { useRef, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Eye } from 'lucide-react';

interface ScratchCardProps {
  onRevealComplete?: () => void;
  children: React.ReactNode;
  width?: number;
  height?: number;
  theme?: 'gold' | 'silver' | 'bronze' | 'default';
  cardTitle?: string;
  cardSubtitle?: string;
  isRevealedExternal?: boolean;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({
  onRevealComplete,
  children,
  width = 340,
  height = 240,
  theme = 'gold',
  cardTitle,
  cardSubtitle,
  isRevealedExternal = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(isRevealedExternal);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isRevealedExternal) {
      setIsRevealed(true);
    }
  }, [isRevealedExternal]);

  // Initialize Canvas with metallic scratch surface
  useEffect(() => {
    if (isRevealedExternal) {
      setIsRevealed(true);
      return;
    }
    setIsRevealed(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Metallic gradient based on theme
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    let titleText = cardTitle || '✨ Scratch Here ✨';
    let subText = cardSubtitle || 'Scratch to Reveal Lucky Winner';
    let textColor = '#78350f';
    let subTextColor = '#92400e';

    if (theme === 'silver') {
      gradient.addColorStop(0, '#64748b'); // slate-500
      gradient.addColorStop(0.2, '#94a3b8'); // slate-400
      gradient.addColorStop(0.4, '#e2e8f0'); // slate-200
      gradient.addColorStop(0.6, '#f8fafc'); // slate-50
      gradient.addColorStop(0.8, '#94a3b8');
      gradient.addColorStop(1, '#475569'); // slate-600
      textColor = '#1e293b';
      subTextColor = '#334155';
    } else if (theme === 'bronze') {
      gradient.addColorStop(0, '#7c2d12'); // orange-900
      gradient.addColorStop(0.2, '#9a3412'); // orange-800
      gradient.addColorStop(0.4, '#c2410c'); // orange-700
      gradient.addColorStop(0.6, '#fed7aa'); // orange-200
      gradient.addColorStop(0.8, '#ea580c'); // orange-600
      gradient.addColorStop(1, '#7c2d12');
      textColor = '#431407';
      subTextColor = '#7c2d12';
    } else {
      // Gold / default
      gradient.addColorStop(0, '#d97706'); // amber-600
      gradient.addColorStop(0.2, '#f59e0b'); // amber-500
      gradient.addColorStop(0.4, '#fbbf24'); // amber-400
      gradient.addColorStop(0.6, '#fef08a'); // yellow-200
      gradient.addColorStop(0.8, '#f59e0b');
      gradient.addColorStop(1, '#b45309'); // amber-700
      textColor = '#78350f';
      subTextColor = '#92400e';
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative stars and pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Border pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // Center text
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, width / 2, height / 2 - 12);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = subTextColor;
    ctx.fillText(subText, width / 2, height / 2 + 14);
  }, [width, height, theme, cardTitle, cardSubtitle, isRevealedExternal]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Check how much percent has been scratched
  const checkScratchPercentage = () => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;
      let transparentPixels = 0;
      const totalPixels = pixels.length / 4;

      for (let i = 3; i < pixels.length; i += 16) {
        // Sample every 4th pixel for performance
        if (pixels[i] === 0) {
          transparentPixels++;
        }
      }

      const ratio = transparentPixels / (totalPixels / 4);
      if (ratio > 0.42) {
        // Over 42% scratched, fully reveal!
        revealFully();
      }
    } catch (e) {
      // Ignored
    }
  };

  const revealFully = () => {
    if (isRevealed) return;
    setIsRevealed(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    triggerConfetti();
    if (onRevealComplete) {
      onRevealComplete();
    }
  };

  const scratch = (clientX: number, clientY: number) => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      setIsDrawing(true);
      const touch = e.touches[0];
      scratch(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || e.touches.length === 0) return;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const borderClass =
    theme === 'silver'
      ? 'border-slate-300 ring-4 ring-slate-200'
      : theme === 'bronze'
      ? 'border-orange-600 ring-4 ring-orange-200'
      : 'border-amber-400 ring-4 ring-amber-200';

  const innerBgClass =
    theme === 'silver'
      ? 'bg-gradient-to-b from-slate-50 via-gray-50 to-slate-100'
      : theme === 'bronze'
      ? 'bg-gradient-to-b from-orange-50 via-amber-50 to-stone-100'
      : 'bg-gradient-to-b from-amber-50 to-orange-50';

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        className={`relative rounded-2xl overflow-hidden border-2 ${borderClass} shadow-xl bg-white select-none`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Hidden Content to be Revealed */}
        <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 ${innerBgClass}`}>
          {children}
        </div>

        {/* Scratch Surface Canvas */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            className="absolute inset-0 cursor-pointer touch-none"
          />
        )}
      </div>

      {/* Manual Instant Reveal Button */}
      {!isRevealed && (
        <button
          type="button"
          onClick={revealFully}
          className="mt-3 px-4 py-1.5 rounded-full bg-slate-900 hover:bg-black text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm border border-slate-700"
        >
          <Eye className="w-3.5 h-3.5 text-amber-300" />
          <span>Instant Reveal</span>
        </button>
      )}
    </div>
  );
};
