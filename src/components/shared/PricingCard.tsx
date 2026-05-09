import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PricingCardFeature {
  label: string;
  icon?: ReactNode;
}

interface PricingCardProps {
  /** Top thumbnail rendered inside the card. */
  thumbnail?: ReactNode;
  /** Display price (already formatted number, in INR). */
  price: number;
  /** Optional original price for strikethrough. */
  originalPrice?: number | null;
  isFree?: boolean;
  /** Render below price (badges, promo banner). */
  priceExtra?: ReactNode;
  /** Main body — promo input, redeem button, or owned state. */
  children?: ReactNode;
  /** Bullet list of inclusions shown at bottom. */
  features?: PricingCardFeature[];
  /** WhatsApp message; if provided shows a WhatsApp CTA. */
  whatsappMessage?: string;
  whatsappPhone?: string;
  className?: string;
  sticky?: boolean;
}

const DEFAULT_PHONE = "919265106657";

export function PricingCard({
  thumbnail,
  price,
  originalPrice,
  isFree,
  priceExtra,
  children,
  features,
  whatsappMessage,
  whatsappPhone = DEFAULT_PHONE,
  className,
  sticky = true,
}: PricingCardProps) {
  const hasDiscount =
    !isFree && originalPrice != null && Number(originalPrice) > Number(price);
  const save = hasDiscount ? Number(originalPrice) - Number(price) : 0;
  const discountPct = hasDiscount
    ? Math.round((save / Number(originalPrice)) * 100)
    : 0;

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/60",
        sticky && "lg:sticky lg:top-28",
        className
      )}
    >
      {thumbnail && <div className="aspect-video bg-muted">{thumbnail}</div>}
      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Price block */}
        <div>
          {isFree ? (
            <Badge variant="secondary" className="text-base px-3 py-1">
              Free
            </Badge>
          ) : (
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                ₹{Number(price).toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    ₹{Number(originalPrice).toLocaleString("en-IN")}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    {discountPct}% OFF
                  </Badge>
                </>
              )}
            </div>
          )}
          {hasDiscount && (
            <p className="text-xs text-success mt-1.5 font-medium">
              You save ₹{save.toLocaleString("en-IN")}
            </p>
          )}
          {priceExtra}
        </div>

        {/* Body slot */}
        {children && <div className="space-y-3">{children}</div>}

        {/* WhatsApp CTA */}
        {whatsappMessage && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="border-t border-border flex-1" />
              <span className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                or
              </span>
              <div className="border-t border-border flex-1" />
            </div>
            <Button
              size="lg"
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white border-0"
              asChild
            >
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact on WhatsApp
              </a>
            </Button>
          </>
        )}

        {/* Features */}
        {features && features.length > 0 && (
          <div className="pt-4 border-t space-y-2.5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <span className="text-success shrink-0">
                  {f.icon ?? <CheckCircle className="w-4 h-4" />}
                </span>
                <span className="text-muted-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
