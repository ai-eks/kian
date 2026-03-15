import { CheckOutlined, DownOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { CompactDropdown } from './CompactDropdown';

export interface CompactSelectOption {
  label: string;
  value: string;
  /** Extra description shown as secondary text */
  description?: string;
  icon?: ReactNode;
}

export interface CompactSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: CompactSelectOption[];
  /** Optional non-selectable header shown at the top of the menu */
  menuHeader?: string;
  /** Placeholder when no value selected */
  placeholder?: string;
  className?: string;
  /** Min width of the dropdown popup */
  popupMinWidth?: number;
}

export const CompactSelect = ({
  value,
  onChange,
  options,
  menuHeader,
  placeholder = '请选择',
  className = '',
  popupMinWidth = 160,
}: CompactSelectProps) => {
  const selectedOption = options.find((o) => o.value === value);
  const menuItems = [
    ...(menuHeader
      ? [
          {
            key: '__compact-select-header__',
            disabled: true,
            className: 'compact-select-menu-header-item',
            label: <span className="compact-select-menu-header-text">{menuHeader}</span>,
          },
        ]
      : []),
    ...options.map((opt) => ({
      key: opt.value,
      label: (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            {opt.icon && <span className="text-xs text-slate-400">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
            {opt.description && (
              <span className="shrink-0 text-[11px] text-slate-400">{opt.description}</span>
            )}
          </div>
          {opt.value === value && (
            <CheckOutlined className="shrink-0 text-[11px] text-[#2f6ff7]" />
          )}
        </div>
      ),
    })),
  ];

  return (
    <CompactDropdown
      trigger={['click']}
      overlayStyle={{ minWidth: popupMinWidth }}
      menu={{
        selectable: true,
        selectedKeys: value ? [value] : [],
        items: menuItems,
        onClick: (info) => {
          if (info.key === '__compact-select-header__') return;
          onChange?.(info.key);
        },
      }}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] leading-normal text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 ${className}`}
      >
        <span className="max-w-[200px] truncate">
          {selectedOption?.label ?? placeholder}
        </span>
        <DownOutlined className="text-[9px]" />
      </button>
    </CompactDropdown>
  );
};
