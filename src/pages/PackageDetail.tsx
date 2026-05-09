import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package as PackageIcon,
  BookOpen,
  Box,
  Check,
  Loader2,
  Award,
  Infinity as InfinityIcon,
  Smartphone,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/common/SeoHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAffiliateRefCapture,
  getStoredAffiliateRef,
  clearStoredAffiliateRef,
} from "@/hooks/useAffiliateRef";
import {
  PageContainer,
  PricingCard,
  PromoCodeInput,
  AffiliateInfoCard,
  AccordionSection,
  MobileBottomBar,
  type AccordionSectionItem,
} from "@/components/shared";

interface Pkg {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number;
  thumbnail_url: string | null;
  affiliate_commission_percent: number | null;
}

export default function PackageDetail() {
  useAffiliateRefCapture();
  const { packageId } = useParams<{ packageId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [software, setSoftware] = useState<{ id: string; title: string }[]>([]);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [owned, setOwned] = useState(false);
  const storedRef = typeof window !== "undefined" ? getStoredAffiliateRef() : null;

  useEffect(() => {
    if (packageId) void load(packageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId]);

  async function load(id: string) {
    setLoading(true);
    const { data: p } = await supabase
      .from("packages")
      .select(
        "id, name, description, price, original_price, thumbnail_url, is_active, affiliate_commission_percent"
      )
      .eq("id", id)
      .maybeSingle();
    if (!p || !p.is_active) {
      setPkg(null);
      setLoading(false);
      return;
    }
    setPkg(p as Pkg);

    const { data: items } = await supabase
      .from("package_items")
      .select("item_type, item_id")
      .eq("package_id", id);
    const courseIds = (items || []).filter((i) => i.item_type === "course").map((i) => i.item_id);
    const swIds = (items || []).filter((i) => i.item_type === "software").map((i) => i.item_id);
    const [cRes, sRes] = await Promise.all([
      courseIds.length
        ? supabase.from("courses").select("id, title").in("id", courseIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      swIds.length
        ? supabase.from("software_products").select("id, title").in("id", swIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);
    setCourses(cRes.data || []);
    setSoftware(sRes.data || []);

    if (user) {
      const { data: own } = await supabase
        .from("package_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("package_id", id)
        .maybeSingle();
      setOwned(!!own);
    }
    setLoading(false);
  }

  async function redeem() {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!code.trim()) {
      toast({ title: "Enter your promo code", variant: "destructive" });
      return;
    }
    setRedeeming(true);
    try {
      const ref = getStoredAffiliateRef();
      const { data, error } = await supabase.rpc("redeem_package_promo", {
        _code: code.trim().toUpperCase(),
        _referral_code: ref ?? undefined,
      });
      if (error) throw error;
      const result = data as { success: boolean; affiliate_credited: boolean };
      if (result?.affiliate_credited) clearStoredAffiliateRef();
      toast({
        title: "Package unlocked!",
        description: "All included courses and software are now in your dashboard.",
      });
      navigate("/dashboard/packages");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Redemption failed";
      toast({ title: "Could not redeem", description: msg, variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PageContainer className="text-center">
          <PackageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h1 className="text-2xl font-bold mb-2">Package not found</h1>
          <Button asChild variant="outline">
            <Link to="/packages">Browse Packages</Link>
          </Button>
        </PageContainer>
        <Footer />
      </div>
    );
  }

  const accordionItems: AccordionSectionItem[] = [];
  if (courses.length) {
    accordionItems.push({
      id: "courses",
      title: "Courses Included",
      icon: <BookOpen className="w-4 h-4" />,
      meta: `${courses.length}`,
      content: (
        <ul className="space-y-2">
          {courses.map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span className="text-foreground">{c.title}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (software.length) {
    accordionItems.push({
      id: "software",
      title: "Software Included",
      icon: <Box className="w-4 h-4" />,
      meta: `${software.length}`,
      content: (
        <ul className="space-y-2">
          {software.map((s) => (
            <li key={s.id} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span className="text-foreground">{s.title}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }
  accordionItems.push({
    id: "benefits",
    title: "What you get",
    icon: <Award className="w-4 h-4" />,
    content: (
      <ul className="space-y-2">
        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Lifetime access to every included course and software product</li>
        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Certificate of completion for each course</li>
        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Watch on mobile and desktop with secure streaming</li>
        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Priority support on WhatsApp</li>
      </ul>
    ),
  });

  const features = [
    { label: "Lifetime access to bundle", icon: <InfinityIcon className="w-4 h-4" /> },
    { label: "Certificate per course", icon: <Award className="w-4 h-4" /> },
    { label: "Mobile & desktop access", icon: <Smartphone className="w-4 h-4" /> },
  ];

  const whatsappMsg = `Hi, I am interested in the package: "${pkg.name}". Please share more details.`;

  const pricingBody = owned ? (
    <div className="space-y-3">
      <Badge variant="default" className="w-full justify-center py-2 text-sm">
        You own this package
      </Badge>
      <Button asChild className="w-full" size="lg">
        <Link to="/dashboard/packages">Go to My Packages</Link>
      </Button>
    </div>
  ) : (
    <>
      <p className="text-sm text-muted-foreground">
        Have a package promo code? Enter it below to unlock everything in this bundle instantly.
      </p>
      <PromoCodeInput
        value={code}
        onChange={setCode}
        onRedeem={redeem}
        loading={redeeming}
        placeholder="PKG-XXXXXX"
      />
      {!user && (
        <p className="text-xs text-muted-foreground text-center">
          <Link to="/login" className="text-primary underline">
            Sign in
          </Link>{" "}
          to redeem your code.
        </p>
      )}
      <AffiliateInfoCard
        refCode={storedRef}
        price={pkg.price}
        commissionPercent={pkg.affiliate_commission_percent}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={`${pkg.name} – ShreeAds Package`}
        description={pkg.description || "Learning bundle"}
      />
      <Header />
      <main>
        <PageContainer>
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-10">
            {/* LEFT: thumbnail, title, description, accordions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="min-w-0 space-y-6"
            >
              {pkg.thumbnail_url ? (
                <img
                  src={pkg.thumbnail_url}
                  alt={pkg.name}
                  className="w-full aspect-video rounded-2xl object-cover border"
                />
              ) : (
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border">
                  <PackageIcon className="w-16 h-16 text-primary/60" />
                </div>
              )}

              <div>
                <Badge variant="secondary" className="mb-3">
                  Package
                </Badge>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                  {pkg.name}
                </h1>
                {pkg.description && (
                  <p className="text-muted-foreground mt-3 text-base leading-relaxed">
                    {pkg.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-4 text-sm">
                  <Badge variant="outline" className="gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> {courses.length} Courses
                  </Badge>
                  <Badge variant="outline" className="gap-1.5">
                    <Box className="w-3.5 h-3.5" /> {software.length} Software
                  </Badge>
                </div>
              </div>

              <AccordionSection items={accordionItems} defaultOpen={["courses", "software"]} />
            </motion.div>

            {/* RIGHT: sticky pricing card */}
            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="hidden lg:block"
            >
              <PricingCard
                price={Number(pkg.price)}
                originalPrice={Number(pkg.original_price)}
                whatsappMessage={whatsappMsg}
                features={features}
              >
                {pricingBody}
              </PricingCard>
            </motion.aside>
          </div>
        </PageContainer>

        {/* Mobile inline card (visible <lg) */}
        <div className="lg:hidden px-4 pb-32">
          <PricingCard
            price={Number(pkg.price)}
            originalPrice={Number(pkg.original_price)}
            whatsappMessage={whatsappMsg}
            features={features}
            sticky={false}
          >
            {pricingBody}
          </PricingCard>
        </div>
      </main>

      {/* Mobile sticky purchase bar */}
      {!owned && (
        <MobileBottomBar
          left={
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold">
                  ₹{Number(pkg.price).toLocaleString("en-IN")}
                </span>
                {Number(pkg.original_price) > Number(pkg.price) && (
                  <span className="text-xs text-muted-foreground line-through">
                    ₹{Number(pkg.original_price).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {courses.length} courses · {software.length} software
              </p>
            </div>
          }
          right={
            <Button
              size="sm"
              onClick={() =>
                document.querySelector<HTMLInputElement>('input[placeholder="PKG-XXXXXX"]')?.focus()
              }
            >
              Redeem code
            </Button>
          }
        />
      )}

      <Footer />
    </div>
  );
}
