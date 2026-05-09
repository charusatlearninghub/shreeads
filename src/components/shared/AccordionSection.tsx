import { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface AccordionSectionItem {
  id: string;
  title: ReactNode;
  icon?: ReactNode;
  content: ReactNode;
  /** Optional small text shown to the right of the title (e.g. "12 lessons"). */
  meta?: ReactNode;
}

interface AccordionSectionProps {
  items: AccordionSectionItem[];
  /** IDs of items expanded by default. */
  defaultOpen?: string[];
  className?: string;
}

/**
 * Shared collapsible content sections. Animated, mobile-friendly,
 * theme-token styled. Use on detail pages for "What you'll learn",
 * "Course content", "FAQs" etc.
 */
export function AccordionSection({
  items,
  defaultOpen,
  className,
}: AccordionSectionProps) {
  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpen}
      className={cn("w-full space-y-3", className)}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="rounded-xl border bg-card overflow-hidden data-[state=open]:shadow-sm"
        >
          <AccordionTrigger className="px-4 sm:px-5 py-4 hover:no-underline text-left">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {item.icon && <span className="shrink-0 text-primary">{item.icon}</span>}
              <span className="font-semibold text-sm sm:text-base truncate">
                {item.title}
              </span>
              {item.meta && (
                <span className="ml-auto mr-3 text-xs text-muted-foreground shrink-0">
                  {item.meta}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 sm:px-5 pb-5 pt-0 text-sm text-muted-foreground">
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
