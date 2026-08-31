import { Navigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/common/SeoHead";
import { HeroSection } from "@/components/home/HeroSection";

import { CoursesPreview } from "@/components/home/CoursesPreview";
import { PackagesPreview } from "@/components/home/PackagesPreview";
import { SoftwarePreview } from "@/components/home/SoftwarePreview";
import { VideoGalleryPreview } from "@/components/home/VideoGalleryPreview";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";
import { PromotionalBanner } from "@/components/promotions/PromotionalBanner";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const params = new URLSearchParams(location.search);
  const ref = params.get("ref");

  // If landing here with a referral code and not signed in, jump straight to Register.
  if (ref && !isLoading && !user) {
    return <Navigate to={`/register?ref=${encodeURIComponent(ref)}`} replace />;
  }


  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="ShreeAds – Learn Digital Marketing & Software Skills"
        description="ShreeAds offers professional courses in digital marketing, software skills, and career development. Enroll now and learn from experts with certificates and hands-on projects."
      />
      <Header />
      <main>
        <PromotionalBanner variant="compact" />
        <HeroSection />
        
        <CoursesPreview />
        <PackagesPreview />
        <SoftwarePreview />
        <VideoGalleryPreview />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
