import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  icon: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'search',
    title: 'Search',
    description: 'Search any NYC address, owner name, or unit to pull instant building reports',
    icon: '🔍',
  },
  {
    target: 'results',
    title: 'Results',
    description: 'View scored properties with grades A/B/C. Filter, sort, and drill into details',
    icon: '📊',
  },
  {
    target: 'pipeline',
    title: 'Pipeline',
    description: 'Track leads through your sales pipeline from discovery to close',
    icon: '🔀',
  },
  {
    target: 'outreach',
    title: 'Outreach',
    description: 'Send personalized emails using proven templates. Track opens and follow-ups',
    icon: '📧',
  },
  {
    target: 'scout-ai',
    title: 'Merlin AI',
    description: 'Ask questions about your pipeline, get lead suggestions, draft emails',
    icon: '🤖',
  },
  {
    target: 'import',
    title: 'Import',
    description: 'Import your existing lead lists from CSV or Excel',
    icon: '📥',
  },
  {
    target: 'export',
    title: 'Export',
    description: 'Generate PDF reports and CSV exports for your team',
    icon: '📤',
  },
  {
    target: 'settings',
    title: 'Settings',
    description: 'Configure API keys, manage team members, and company info',
    icon: '⚙️',
  },
];

const STORAGE_KEY = 'scout_tour_completed';

export function useTour() {
  const [isOpen, setIsOpen] = useState(false);

  const startTour = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  // Auto-show on first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay to let layout render
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  return { isOpen, startTour, closeTour };
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuidedTour({ isOpen, onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = welcome screen
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(-1);
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Position tooltip relative to highlighted element
  useEffect(() => {
    if (currentStep < 0 || currentStep >= TOUR_STEPS.length) return;

    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const padding = 6;

    // Highlight around the element
    setHighlightStyle({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Position tooltip to the right of the element
    const tooltipLeft = rect.right + 16;
    const tooltipTop = rect.top - 10;

    // If tooltip would go off screen right, position below instead
    if (tooltipLeft + 340 > window.innerWidth) {
      setTooltipStyle({
        top: rect.bottom + 16,
        left: Math.max(16, rect.left),
      });
    } else {
      setTooltipStyle({
        top: Math.max(16, Math.min(tooltipTop, window.innerHeight - 260)),
        left: tooltipLeft,
      });
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep < TOUR_STEPS.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        // Completed
        onClose();
      }
      setIsAnimating(false);
    }, 150);
  }, [currentStep, onClose]);

  const handlePrev = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((s) => Math.max(-1, s - 1));
      setIsAnimating(false);
    }, 150);
  }, []);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleStartSteps = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(0);
      setIsAnimating(false);
    }, 150);
  }, []);

  if (!isOpen) return null;

  const isWelcome = currentStep === -1;
  const step = currentStep >= 0 ? TOUR_STEPS[currentStep] : null;

  return createPortal(
    <div className="tour-overlay" style={{ zIndex: 99999 }}>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity duration-300"
        style={{ zIndex: 99999 }}
        onClick={handleSkip}
      />

      {/* Highlight ring around current element */}
      {!isWelcome && (
        <div
          className="fixed rounded-lg transition-all duration-300 ease-out tour-highlight-ring"
          style={{
            ...highlightStyle,
            zIndex: 100000,
            boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.6), 0 0 0 3px #C5A55A, 0 0 20px rgba(197, 165, 90, 0.4)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Welcome overlay */}
      {isWelcome && (
        <div
          className={`fixed inset-0 flex items-center justify-center transition-opacity duration-300 ${
            isAnimating ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ zIndex: 100001 }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md mx-4 overflow-hidden">
            {/* Gold accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-camelot-gold-dark via-camelot-gold to-camelot-gold-light" />

            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-camelot-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Sparkles size={32} className="text-camelot-gold" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Welcome to Camelot OS
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Your property intelligence platform. Let us give you a quick tour of the key features.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleStartSteps}
                  className="w-full px-6 py-3 bg-camelot-gold text-white rounded-xl font-semibold hover:bg-camelot-gold-dark transition-colors shadow-lg shadow-camelot-gold/25"
                >
                  Take the Tour
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full px-6 py-3 text-gray-400 rounded-xl font-medium hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step tooltip card */}
      {step && (
        <div
          ref={tooltipRef}
          className={`fixed transition-all duration-300 ease-out ${
            isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            ...tooltipStyle,
            zIndex: 100001,
            width: 340,
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Gold top accent */}
            <div className="h-1 bg-gradient-to-r from-camelot-gold-dark via-camelot-gold to-camelot-gold-light" />

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{step.icon}</span>
                  <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                {step.description}
              </p>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? 'w-6 bg-camelot-gold'
                        : i < currentStep
                        ? 'w-1.5 bg-camelot-gold/40'
                        : 'w-1.5 bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Skip Tour
                </button>

                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft size={14} />
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium bg-camelot-gold text-white rounded-lg hover:bg-camelot-gold-dark transition-colors"
                  >
                    {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Step counter */}
              <p className="text-center text-[11px] text-gray-300 mt-3">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
