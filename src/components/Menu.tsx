import React, { ReactNode } from 'react';
import {
  Button,
  DialogTrigger,
  Popover,
  Dialog,
  Checkbox,
  CheckboxGroup,
} from 'react-aria-components';

/**
 * Accessible Popover Menu Component
 * Uses React Aria for automatic keyboard navigation, focus management, and ARIA attributes
 */

interface PopoverMenuProps {
  /** Trigger button content */
  trigger: ReactNode;
  /** Menu content */
  children: ReactNode;
  /** Trigger button className */
  triggerClassName?: string;
  /** Menu popover className */
  menuClassName?: string;
  /** Whether menu is currently open (controlled) */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * Popover Menu Component
 * Automatically handles:
 * - Click outside to close
 * - Escape key to close
 * - Focus management
 * - ARIA attributes
 *
 * @example
 * ```tsx
 * <PopoverMenu
 *   trigger={<span>🌞 DST</span>}
 *   triggerClassName="px-3 py-2 bg-slate-700 rounded"
 * >
 *   <div className="p-3">
 *     <label><input type="checkbox" /> Option 1</label>
 *   </div>
 * </PopoverMenu>
 * ```
 */
export function PopoverMenu({
  trigger,
  children,
  triggerClassName = '',
  menuClassName = '',
  isOpen,
  onOpenChange,
}: PopoverMenuProps) {
  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <Button className={triggerClassName}>{trigger}</Button>
      <Popover
        offset={8}
        className={`
          bg-slate-900/95 backdrop-blur-lg
          border border-slate-700
          rounded-lg shadow-2xl
          z-50
          entering:animate-in entering:fade-in entering:slide-in-from-top-2 entering:duration-200
          exiting:animate-out exiting:fade-out exiting:slide-out-to-top-2 exiting:duration-150
          ${menuClassName}
        `}
      >
        <Dialog className="outline-none">{children}</Dialog>
      </Popover>
    </DialogTrigger>
  );
}

/**
 * Checkbox Menu Item Component
 * For use inside PopoverMenu
 */
interface CheckboxMenuItemProps {
  /** Checkbox label */
  label: string;
  /** Checkbox checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Optional icon/prefix */
  icon?: ReactNode;
}

export function CheckboxMenuItem({ label, checked, onChange, icon }: CheckboxMenuItemProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="cursor-pointer"
      />
      {icon && <span>{icon}</span>}
      <span className="text-xs text-slate-300">{label}</span>
    </label>
  );
}

/**
 * Menu Section Component
 * Groups related menu items with a header
 */
interface MenuSectionProps {
  /** Section title */
  title: string;
  /** Section content (menu items) */
  children: ReactNode;
  /** Whether to show border separator */
  showDivider?: boolean;
}

export function MenuSection({ title, children, showDivider = false }: MenuSectionProps) {
  return (
    <div className={showDivider ? 'mt-3 pt-3 border-t border-slate-700/50' : ''}>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 px-2">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/**
 * Menu Button Component
 * Clickable button inside a menu (e.g., for actions)
 */
interface MenuButtonProps {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Whether button is selected/active */
  isActive?: boolean;
  /** Optional icon/prefix */
  icon?: ReactNode;
  /** Custom className */
  className?: string;
}

export function MenuButton({
  label,
  onClick,
  isActive = false,
  icon,
  className = '',
}: MenuButtonProps) {
  const baseClass = 'w-full px-3 py-1.5 text-xs rounded-lg border transition-all';
  const activeClass = isActive
    ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-100'
    : 'bg-slate-700/20 border-slate-600/40 hover:bg-slate-700/40 text-slate-300';

  return (
    <button onClick={onClick} className={`${baseClass} ${activeClass} ${className}`}>
      {icon && <span className="mr-1.5">{icon}</span>}
      {label}
    </button>
  );
}
