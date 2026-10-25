import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

interface HorizontalSliderProps {
  title: string;
  subtitle?: string;
  categoryTag?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  children: React.ReactNode;
  emptyMessage?: string;
  count?: number;
}

export const HorizontalSlider: React.FC<HorizontalSliderProps> = ({
  title,
  subtitle,
  categoryTag,
  onViewAll,
  viewAllLabel = 'View All',
  children,
  emptyMessage = 'No manuscripts available in this category yet.',
  count
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Check scroll boundary to enable/disable arrow controls accurately
  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const tolerance = 4; // Sub-pixel threshold

    const overflow = maxScroll > tolerance;
    setHasOverflow(overflow);
    setCanScrollLeft(scrollLeft > tolerance);
    setCanScrollRight(scrollLeft < maxScroll - tolerance);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollContainerRef.current;
    if (!el) return;

    // Listen to scroll events
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    // Initial check after layout paint
    const timer = setTimeout(updateScrollState, 150);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      clearTimeout(timer);
    };
  }, [updateScrollState, children]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Scroll by ~75% of the visible container width or standard card cluster
    const scrollAmount = Math.max(el.clientWidth * 0.75, 280);
    const targetScroll = direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;

    el.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  const hasChildren = React.Children.count(children) > 0;

  return (
    <section className="py-8 font-serif" aria-labelledby={`slider-heading-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          {categoryTag && (
            <span className="text-[11px] font-serif uppercase tracking-widest text-[#B08D46] block mb-1">
              {categoryTag}
            </span>
          )}
          <div className="flex items-baseline gap-3">
            <h2
              id={`slider-heading-${title.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-2xl sm:text-3xl font-serif font-medium text-[#28311F] tracking-tight"
            >
              {title}
            </h2>
            {count !== undefined && count > 0 && (
              <span className="text-xs font-serif text-[#68715F]" aria-label={`${count} items`}>
                ({count})
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#68715F] font-serif mt-1 max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Bar: Optional "View All" + Desktop Carousel Arrow Buttons */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-serif text-[#2C3A22] hover:text-[#1D2716] hover:underline underline-offset-4 flex items-center gap-1 transition-colors py-1 cursor-pointer"
            >
              <span>{viewAllLabel}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#B08D46]" />
            </button>
          )}

          {/* Desktop Left / Right Arrow Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${title} carousel left`}
              aria-disabled={!canScrollLeft}
              className={`w-9 h-9 rounded-full border border-[#2C3A22]/20 flex items-center justify-center transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2C3A22] focus-visible:outline-none ${
                canScrollLeft
                  ? 'bg-white/80 text-[#28311F] hover:bg-[#2C3A22] hover:text-[#EEF0E4] hover:border-[#2C3A22] shadow-xs active:scale-95'
                  : 'bg-white/30 text-[#68715F]/40 border-[#2C3A22]/10 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label={`Scroll ${title} carousel right`}
              aria-disabled={!canScrollRight}
              className={`w-9 h-9 rounded-full border border-[#2C3A22]/20 flex items-center justify-center transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2C3A22] focus-visible:outline-none ${
                canScrollRight
                  ? 'bg-white/80 text-[#28311F] hover:bg-[#2C3A22] hover:text-[#EEF0E4] hover:border-[#2C3A22] shadow-xs active:scale-95'
                  : 'bg-white/30 text-[#68715F]/40 border-[#2C3A22]/10 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slider Carousel Track */}
      {hasChildren ? (
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          role="region"
          aria-label={`${title} carousel`}
          className="flex items-stretch gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-4 pt-1 overscroll-x-contain focus-visible:ring-1 focus-visible:ring-[#2C3A22]/30 focus-visible:outline-none -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {React.Children.map(children, (child, idx) => (
            <div
              key={idx}
              className="snap-start shrink-0 w-[82vw] sm:w-[270px] md:w-[285px] lg:w-[295px] flex flex-col"
            >
              {child}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center text-xs sm:text-sm font-serif text-[#68715F] border border-white/60">
          {emptyMessage}
        </div>
      )}
    </section>
  );
};
