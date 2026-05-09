import { Loader2, Ticket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromoCodeInputProps {
  value: string;
  onChange: (v: string) => void;
  onRedeem: () => void;
  loading?: boolean;
  placeholder?: string;
  buttonLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Shared promo-code input + redeem button. Used on Course, Package
 * and Software detail pages so the redemption UX is identical everywhere.
 */
export function PromoCodeInput({
  value,
  onChange,
  onRedeem,
  loading,
  placeholder = "PROMO-XXXXXX",
  buttonLabel = "Redeem",
  disabled,
  className,
}: PromoCodeInputProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder={placeholder}
        className="font-mono uppercase"
        disabled={disabled || loading}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim() && !loading) onRedeem();
        }}
      />
      <Button
        onClick={onRedeem}
        disabled={disabled || loading || !value.trim()}
        className="shrink-0"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Ticket className="w-4 h-4 mr-1.5" /> {buttonLabel}
          </>
        )}
      </Button>
    </div>
  );
}
