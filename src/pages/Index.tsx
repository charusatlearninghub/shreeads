import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/common/SeoHead";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { CoursesPreview } from "@/components/home/CoursesPreview";
import { SoftwarePreview } from "@/components/home/SoftwarePreview";
import { VideoGalleryPreview } from "@/components/home/VideoGalleryPreview";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";
import { PromotionalBanner } from "@/components/promotions/PromotionalBanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="ShreeAds – Learn Digital Marketing & Software Skills"
        description="ShreeAds offers professional courses in digital marketing, software skills, and career development. Enroll now and learn from experts with certificates and hands-on projects."
      />
      <PromotionalBanner variant="compact" />
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CoursesPreview />
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
