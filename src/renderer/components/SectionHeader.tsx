import type { ReactNode } from 'react';
import { Typography } from 'antd';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
}

export const SectionHeader = ({ title, subtitle, extra }: SectionHeaderProps) => (
  <div className="mb-4 flex items-center justify-between">
    <div>
      <Typography.Title level={4} className="!mb-0 !text-slate-900">
        {title}
      </Typography.Title>
      {subtitle ? <Typography.Text className="!text-slate-500">{subtitle}</Typography.Text> : null}
    </div>
    {extra}
  </div>
);
