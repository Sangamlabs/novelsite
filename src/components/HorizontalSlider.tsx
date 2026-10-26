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
  itemWidthClass?: string;
}

export const HorizontalSlider: React.FC<HorizontalSliderProps> = ({
  title,
  subtitle,
  categoryTag,
  onViewAll,
  viewAllLabel = 'View All',
  children,
  emptyMessage = 'No manuscripts available in this category yet.',
  count,
  itemWidthClass
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [dotCount, setDotCount] = useState(0);
  const [mobileCardWidth, setMobileCardWidth] = useState<number | null>(null);

  const itemCount = React.Children.count(children);

  // Compute scroll boundaries, overflow, and active dot
  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const tolerance = 6;

    const overflow = maxScroll > tolerance;
    setHasOverflow(overflow);
    setCanScrollLeft(scrollLeft > tolerance);
    setCanScrollRight(scrollLeft < maxScroll - tolerance);

    // Dynamic mobile card width calculation (2 full cards + partial preview of 3rd card on mobile)
    if (clientWidth < 640 && !itemWidthClass) {
      // 12px gap between cards
      const gap = 12;
      // Target approximately 2 full cards visible + ~25-35% preview of the 3rd card (~2.35 cards across clientWidth)
      const calculated = Math.floor((clientWidth - gap) / 2.35);
      // Bound between 145px and 168px on 360–430px screens
      setMobileCardWidth(Math.max(145, Math.min(168, calculated)));
    } else {
      setMobileCardWidth(null);
    }

    // Calculate dot count and active dot
    if (overflow && itemCount > 1) {
      const itemsPerScreen = clientWidth < 640 ? 2 : clientWidth < 1024 ? 3.5 : 5;
      const computedDots = Math.min(Math.max(2, Math.ceil(itemCount / itemsPerScreen)), 6);
      setDotCount(computedDots);

      if (maxScroll > 0) {
        const progress = Math.min(1, Math.max(0, scrollLeft / maxScroll));
        const activeIdx = Math.min(computedDots - 1, Math.round(progress * (computedDots - 1)));
        setActiveDotIndex(activeIdx);
      }
    } else {
      setDotCount(0);
      setActiveDotIndex(0);
    }
  }, [itemCount, itemWidthClass]);

  useEffect(() => {
    updateScrollState();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    const timer = setTimeout(updateScrollState, 150);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      clearTimeout(timer);
    };
  }, [updateScrollState, children]);

  // Left / Right Arrow Scroll Handler (scrolls by approx 1-2 cards smoothly)
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Determine current card step from rendered child or estimate
    const firstChild = el.querySelector(':scope > div') as HTMLElement | null;
    const cardStep = firstChild ? firstChild.offsetWidth + 12 : (el.clientWidth < 640 ? 160 : 190);

    // Scroll by approximately 1.5 cards on mobile or 2 cards on desktop
    const cardsToScroll = el.clientWidth < 640 ? 1.5 : 2;
    const scrollAmount = Math.max(Math.round(cardStep * cardsToScroll), 160);
    const targetScroll = direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;

    el.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  // Scroll to dot page index
  const scrollToDot = (dotIndex: number) => {
    const el = scrollContainerRef.current;
    if (!el || dotCount <= 1) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;

    const targetLeft = (dotIndex / (dotCount - 1)) * maxScroll;
    el.scrollTo({
      left: targetLeft,
      behavior: 'smooth'
    });
  };

  const hasChildren = itemCount > 0;

  return (
    <section className="py-6 sm:py-8 font-serif" aria-labelledby={`slider-heading-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {/* Section Header: Title on Left, Controls (View All + Navigation Arrows) on Right */}
      <div className="flex items-end justify-between gap-2 sm:gap-4 mb-3 sm:mb-5">
        <div className="min-w-0 flex-1">
          {categoryTag && (
            <span className="text-[10px] sm:text-[11px] font-serif uppercase tracking-widest text-[#B08D46] block mb-0.5">
              {categoryTag}
            </span>
          )}
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <h2
              id={`slider-heading-${title.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-lg sm:text-2xl md:text-3xl font-serif font-medium text-[#28311F] tracking-tight truncate"
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
            <p className="text-xs sm:text-sm text-[#68715F] font-serif mt-0.5 max-w-xl leading-relaxed line-clamp-1 sm:line-clamp-none">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Bar: Optional "View All" + Visible Navigation Arrow Buttons (Mobile & Desktop) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-serif text-[#2C3A22] hover:text-[#1D2716] hover:underline underline-offset-4 flex items-center gap-1 transition-colors py-1 cursor-pointer whitespace-nowrap"
            >
              <span>{viewAllLabel}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#B08D46]" />
            </button>
          )}

          {/* Left / Right Arrow Buttons: Visible on BOTH Mobile & Desktop */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-1">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${title} carousel left`}
              aria-disabled={!canScrollLeft}
              className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border border-[#2C3A22]/20 flex items-center justify-center transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2C3A22] focus-visible:outline-none ${
                canScrollLeft
                  ? 'bg-[#F8F9F3] text-[#2C3A22] hover:bg-[#2C3A22] hover:text-[#EEF0E4] hover:border-[#2C3A22] shadow-2xs active:scale-95'
                  : 'bg-[#F8F9F3]/40 text-[#68715F]/35 border-[#2C3A22]/10 cursor-not-allowed opacity-35'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label={`Scroll ${title} carousel right`}
              aria-disabled={!canScrollRight}
              className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border border-[#2C3A22]/20 flex items-center justify-center transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2C3A22] focus-visible:outline-none ${
                canScrollRight
                  ? 'bg-[#F8F9F3] text-[#2C3A22] hover:bg-[#2C3A22] hover:text-[#EEF0E4] hover:border-[#2C3A22] shadow-2xs active:scale-95'
                  : 'bg-[#F8F9F3]/40 text-[#68715F]/35 border-[#2C3A22]/10 cursor-not-allowed opacity-35'
              }`}
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slider Carousel Track with Native Touch Swiping */}
      {hasChildren ? (
        <>
          <div
            ref={scrollContainerRef}
            tabIndex={0}
            role="region"
            aria-label={`${title} carousel`}
            className="flex items-stretch gap-3 sm:gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2 pt-1 overscroll-x-contain focus-visible:ring-1 focus-visible:ring-[#2C3A22]/30 focus-visible:outline-none -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {React.Children.map(children, (child, idx) => (
              <div
                key={idx}
                style={mobileCardWidth ? { width: `${mobileCardWidth}px`, flexBasis: `${mobileCardWidth}px` } : undefined}
                className={`snap-start shrink-0 flex flex-col ${
                  itemWidthClass
                    ? itemWidthClass
                    : 'w-[152px] min-w-[145px] max-w-[168px] sm:w-[170px] sm:basis-[170px] md:w-[190px] md:basis-[190px] lg:w-[210px] lg:basis-[210px]'
                }`}
              >
                {child}
              </div>
            ))}
          </div>

          {/* Pagination Dots Indicator */}
          {dotCount > 1 && (
            <div
              className="flex items-center justify-center gap-1.5 mt-3 sm:mt-4"
              role="tablist"
              aria-label={`${title} navigation dots`}
            >
              {Array.from({ length: dotCount }).map((_, idx) => {
                const isActive = idx === activeDotIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Go to ${title} slide ${idx + 1}`}
                    onClick={() => scrollToDot(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3A22] ${
                      isActive
                        ? 'w-5 bg-[#B08D46]'
                        : 'w-1.5 bg-[#2C3A22]/20 hover:bg-[#2C3A22]/40'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 text-center text-xs sm:text-sm font-serif text-[#68715F] border border-white/60">
          {emptyMessage}
        </div>
      )}
    </section>
  );
};
