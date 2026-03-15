import type { CSSProperties, ReactNode } from 'react';
import SimpleBar from 'simplebar-react';

interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  autoHide?: boolean;
}

export const ScrollArea = ({
  children,
  className,
  style,
  autoHide = false
}: ScrollAreaProps) => (
  <SimpleBar className={className} style={style} autoHide={autoHide}>
    {children}
  </SimpleBar>
);
