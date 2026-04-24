import React, { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
  useTransitionStyles,
} from '@floating-ui/react';

export default function Tooltip({ children, content, placement = 'top' }) {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = React.useRef(null);

  const { x, y, strategy, refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({
        fallbackAxisSideDirection: 'start',
      }),
      shift({ padding: 5 }),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const { isMounted, styles } = useTransitionStyles(context, {
    initial: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
    duration: 200,
  });

  if (!content) return children;

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()} className="inline-block">
        {children}
      </div>
      <FloatingPortal>
        {isMounted && (
          <div
            ref={refs.setFloating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              ...styles,
              zIndex: 100,
            }}
            {...getFloatingProps()}
            className="bg-gray-900 text-white text-[11px] font-medium px-2 py-1 rounded shadow-xl pointer-events-none max-w-xs break-words"
          >
            {content}
          </div>
        )}
      </FloatingPortal>
    </>
  );
}
