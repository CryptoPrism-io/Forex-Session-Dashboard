import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipPortalProps {
  children: React.ReactNode;
  isVisible: boolean;
}

/**
 * Portal component that renders tooltips outside the DOM hierarchy
 * This prevents tooltips from being clipped by parent container overflow
 */
export function TooltipPortal({ children, isVisible }: TooltipPortalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let root = document.getElementById('tooltip-portal-root');

    if (!root) {
      root = document.createElement('div');
      root.id = 'tooltip-portal-root';
      root.style.position = 'fixed';
      root.style.top = '0';
      root.style.left = '0';
      root.style.pointerEvents = 'none';
      root.style.zIndex = '9999';
      root.style.width = '100%';
      root.style.height = '100%';
      document.body.appendChild(root);
    }

    setPortalRoot(root);

    return () => {
      // Clean up portal on unmount
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
    };
  }, []);

  if (!portalRoot || !isVisible) {
    return null;
  }

  return createPortal(children, portalRoot);
}
