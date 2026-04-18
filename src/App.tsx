import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import FloatingWhatsApp from "@/components/common/FloatingWhatsApp";
import FloatingDownloadApp from "@/components/common/FloatingDownloadApp";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import CourseLesson from "./pages/CourseLesson";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import MyCourses from "./pages/dashboard/MyCourses";
import Certificates from "./pages/dashboard/Certificates";
import Referrals from "./pages/dashboard/Referrals";
import Settings from "./pages/dashboard/Settings";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminReports from "./pages/admin/AdminReports";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminPriceHistory from "./pages/admin/AdminPriceHistory";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminCertificateTemplates from "./pages/admin/AdminCertificateTemplates";
import AdminEnrollments from "./pages/admin/AdminEnrollments";
import AdminSoftware from "./pages/admin/AdminSoftware";
import AdminSoftwarePromoCodes from "./pages/admin/AdminSoftwarePromoCodes";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSecurityIncidents from "./pages/admin/AdminSecurityIncidents";
import VerifyCertificate from "./pages/VerifyCertificate";
import Contact from "./pages/Contact";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Software from "./pages/Software";
import SoftwareDetail from "./pages/SoftwareDetail";
import MySoftware from "./pages/dashboard/MySoftware";
import Videos from "./pages/Videos";
import AdminVideos from "./pages/admin/AdminVideos";
import HelpCenter from "./pages/HelpCenter";
import FAQs from "./pages/FAQs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import Disclaimer from "./pages/Disclaimer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen pb-20 md:pb-0">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/software" element={<Software />} />
              <Route path="/software/:productId" element={<SoftwareDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/verify-certificate" element={<VerifyCertificate />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/course/:courseId" element={<CourseDetail />} />
              <Route
                path="/course/:courseId/lesson/:lessonId"
                element={
                  <ProtectedRoute>
                    <CourseLesson />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/courses"
                element={
                  <ProtectedRoute>
                    <MyCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/certificates"
                element={
                  <ProtectedRoute>
                    <Certificates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/referrals"
                element={
                  <ProtectedRoute>
                    <Referrals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/software"
                element={
                  <ProtectedRoute>
                    <MySoftware />
                  </ProtectedRoute>
                }
              />
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/promo-codes"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPromoCodes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reviews"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminReviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/promotions"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPromotions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/price-history"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPriceHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/certificates"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminCertificates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/certificate-templates"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminCertificateTemplates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/enrollments"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminEnrollments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/software"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSoftware />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/software-promo-codes"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSoftwarePromoCodes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/revenue"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminRevenue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/videos"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminVideos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/security-incidents"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSecurityIncidents />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            <FloatingDownloadApp />
            <FloatingWhatsApp />
            <MobileBottomNav />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
