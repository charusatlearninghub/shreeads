import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface MobileCardField {
  label: string;
  value: React.ReactNode;
  className?: string;
  hidden?: boolean;
}

interface MobileDataCardProps {
  fields: MobileCardField[];
  actions?: React.ReactNode;
  className?: string;
}

export function MobileDataCard({ fields, actions, className }: MobileDataCardProps) {
  const visibleFields = fields.filter(f => !f.hidden);
  
  return (
    <Card className={cn("md:hidden", className)}>
      <CardContent className="p-4 space-y-2.5">
        {visibleFields.map((field, i) => (
          <div key={i} className="flex items-start justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground shrink-0 min-w-[80px]">
              {field.label}
            </span>
            <span className={cn("text-sm text-right", field.className)}>
              {field.value}
            </span>
          </div>
        ))}
        {actions && (
          <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MobileCardListProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardList({ children, className }: MobileCardListProps) {
  return (
    <div className={cn("space-y-3 md:hidden", className)}>
      {children}
    </div>
  );
}
