/**
 * Responsive CSS class utilities for mobile-first design
 * These ensure consistent spacing and touch targets across devices
 */

export const responsiveClasses = {
  // Touch-friendly button sizing (min 48px on mobile)
  button: {
    primary: 'py-2 md:py-2.5 px-4 md:px-6 text-xs md:text-sm font-semibold rounded-lg min-h-[48px] md:min-h-auto flex items-center justify-center',
    secondary: 'py-2 md:py-2.5 px-4 md:px-6 text-xs md:text-sm font-semibold rounded-lg min-h-[48px] md:min-h-auto flex items-center justify-center',
  },

  // Touch-friendly input sizing
  input: {
    base: 'py-2.5 md:py-2 px-3 md:px-3 text-sm md:text-xs min-h-[48px] md:min-h-auto rounded-lg border transition-colors',
  },

  // Responsive grid layouts
  grid: {
    form: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4',
    twoCol: 'grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-3',
    threeCol: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3',
  },

  // Responsive spacing
  spacing: {
    section: 'px-4 md:px-6 lg:px-0',
    vertical: 'space-y-4 md:space-y-5',
    horizontal: 'gap-3 md:gap-4',
  },

  // Responsive text sizing
  text: {
    label: 'text-xs md:text-[9px] font-semibold uppercase tracking-wider',
    heading: 'text-lg md:text-base font-bold font-lora',
    body: 'text-xs md:text-xs',
  },

  // Responsive modal (full screen on mobile, centered on desktop)
  modal: {
    container: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 md:p-4',
    content: 'bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] md:max-h-[85vh] flex flex-col space-y-4 shadow-2xl',
    header: 'px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between',
    body: 'px-4 md:px-6 py-3 md:py-4 flex-1 overflow-y-auto',
    footer: 'px-4 md:px-6 py-3 md:py-4 border-t flex gap-2 md:gap-3',
  },

  // Responsive sidebar (hidden on mobile, visible on lg)
  sidebar: {
    container: 'hidden lg:flex lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-4 lg:h-fit',
  },

  // Responsive flex layouts
  flex: {
    between: 'flex items-center justify-between flex-wrap md:flex-nowrap gap-2 md:gap-4',
    center: 'flex items-center justify-center flex-wrap md:flex-nowrap gap-2 md:gap-3',
  },
};
