import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AffiliateInfoCardProps {
  /** The captured `?ref=` code, if any. */
  refCode: string | null;
  /** Sale price in INR (paise as decimal). Used to compute commission preview. */
  price: number | null | undefined;
  /** Commission percentage configured on the product (e.g. 15 for 15%). */
  commissionPercent: number | null | undefined;
  className?: string;
}

/**
 * Surfaces affiliate context to visitors:
 *  - When a ?ref code is stored, shows "Referred by CODE".
 *  - When a commission % is set, shows the potential earning a promoter would receive.
 * Hidden entirely if neither applies.
 */
export function AffiliateInfoCard({
  refCode,
  price,
  commissionPercent,
  className,
}: AffiliateInfoCardProps) {
  const numericPrice = Number(price ?? 0);
  const numericPct = Number(commissionPercent ?? 0);
  const commission =
    numericPct > 0 && numericPrice > 0
      ? Math.round((numericPrice * numericPct) / 100)
      : 0;

  if (!refCode && commission === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm space-y-1.5",
        className
      )}
    >
      {refCode && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Referred by</span>
          <span className="font-mono font-semibold text-foreground">{refCode}</span>
        </div>
      )}
      {commission > 0 && (
        <div className="flex items-start gap-2 text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span>
            Earn <span className="font-semibold text-foreground">₹{commission.toLocaleString("en-IN")}</span> commission by promoting this.
          </span>
        </div>
      )}
    </div>
  );
}
