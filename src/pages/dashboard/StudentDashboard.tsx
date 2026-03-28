import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Play, 
  Award, 
  Clock, 
  Users,
  Gift,
  ChevronRight,
  Ticket,
  GraduationCap,
  Copy,
  Check,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePromoCode } from "@/hooks/usePromoCode";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LegalAgreementNote } from "@/components/common/LegalAgreementNote";

interface Enrollment {
  id: string;
  course_id: string;
  enrolled_at: string;
  courses: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    category: string | null;
  };
}

interface CourseProgress {
  course_id: string;
  total_lessons: number;
  completed_lessons: number;
  percentage: number;
}

interface ReferralCode {
  code: string;
  total_referrals: number;
}

const StudentDashboard = () => {
  const { user, profile, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { redeemPromoCode, isRedeeming } = usePromoCode();
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseProgress, setCourseProgress] = useState<Map<string, CourseProgress>>(new Map());
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            id,
            course_id,
            enrolled_at,
            courses (
              id,
              title,
              description,
              thumbnail_url,
              category
            )
          `)
          .eq('user_id', user.id)
          .order('enrolled_at', { ascending: false });

        if (enrollmentsError) throw enrollmentsError;
        setEnrollments((enrollmentsData || []) as unknown as Enrollment[]);

        if (enrollmentsData && enrollmentsData.length > 0) {
          const progressMap = new Map<string, CourseProgress>();
          
          for (const enrollment of enrollmentsData) {
            const { data: lessons } = await supabase
              .from('lessons')
              .select('id')
              .eq('course_id', enrollment.course_id);

            const totalLessons = lessons?.length || 0;

            if (totalLessons > 0) {
              const { data: completedProgress } = await supabase
                .from('lesson_progress')
                .select('lesson_id')
                .eq('user_id', user.id)
                .eq('is_completed', true)
                .in('lesson_id', lessons?.map(l => l.id) || []);

              const completedLessons = completedProgress?.length || 0;
              const percentage = Math.round((completedLessons / totalLessons) * 100);

              progressMap.set(enrollment.course_id, {
                course_id: enrollment.course_id,
                total_lessons: totalLessons,
                completed_lessons: completedLessons,
                percentage,
              });
            }
          }
          
          setCourseProgress(progressMap);
        }

        const { data: referralData } = await supabase
          .from('referral_codes')
          .select('code, total_referrals')
          .eq('user_id', user.id)
          .maybeSingle();

        setReferralCode(referralData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleRedeemCode = async () => {
    const result = await redeemPromoCode(promoCodeInput);
    if (result?.success) {
      setShowPromoDialog(false);
      setPromoCodeInput("");
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          enrolled_at,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            category
          )
        `)
        .eq('user_id', user?.id)
        .order('enrolled_at', { ascending: false });

      setEnrollments((enrollmentsData || []) as unknown as Enrollment[]);
    }
  };

  const handleCopyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode.code);
      setCodeCopied(true);
      toast({ title: "Copied!", description: "Referral code copied to clipboard" });
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';

  const stats = [
    { icon: BookOpen, label: "Enrolled Courses", value: enrollments.length.toString(), href: "/dashboard/courses" },
    { icon: Play, label: "Lessons Completed", value: Array.from(courseProgress.values()).reduce((acc, p) => acc + p.completed_lessons, 0).toString(), href: "/dashboard/courses" },
    { icon: Award, label: "Certificates", value: Array.from(courseProgress.values()).filter(p => p.percentage === 100).length.toString(), href: "/dashboard/certificates" },
    { icon: Clock, label: "Total Lessons", value: Array.from(courseProgress.values()).reduce((acc, p) => acc + p.total_lessons, 0).toString(), href: "/dashboard/courses" },
  ];

  // Redirect admins to admin dashboard
  if (!authLoading && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <DashboardLayout title="Dashboard" subtitle={`Welcome back, ${displayName}!`}>
      {/* Promo Code Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-r from-primary via-purple-600 to-pink-500 border-0 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Have a Promo Code?</h3>
                <p className="text-sm opacity-90">Enter your code to enroll in a new course</p>
              </div>
            </div>
            <Button 
              className="bg-white text-primary hover:bg-white/90 shadow-lg"
              onClick={() => setShowPromoDialog(true)}
            >
              <Gift className="w-4 h-4" />
              Redeem Code
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.href}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-bold">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Continue Learning */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Continue Learning</h2>
          <Link to="/courses" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            Browse Courses <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : enrollments.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display font-bold text-lg mb-2">No Courses Yet</h3>
            <p className="text-muted-foreground mb-4">
              Enter a promo code to enroll in your first course
            </p>
            <Button onClick={() => setShowPromoDialog(true)}>
              <Ticket className="w-4 h-4 mr-2" />
              Enter Promo Code
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.slice(0, 3).map((enrollment, index) => {
              const progress = courseProgress.get(enrollment.course_id);
              const isCompleted = progress?.percentage === 100;

              return (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Link to={`/course/${enrollment.course_id}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="aspect-video bg-secondary relative">
                        {enrollment.courses.thumbnail_url ? (
                          <img 
                            src={enrollment.courses.thumbnail_url} 
                            alt={enrollment.courses.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
                            <GraduationCap className="w-12 h-12 text-primary/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 text-primary ml-1" />
                          </div>
                        </div>
                        {isCompleted && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-green-500 text-white">Completed</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-display font-bold mb-2 line-clamp-1">
                          {enrollment.courses.title}
                        </h3>
                        {enrollment.courses.category && (
                          <Badge variant="secondary" className="mb-3">
                            {enrollment.courses.category}
                          </Badge>
                        )}
                        {progress && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold">{progress.percentage}%</span>
                            </div>
                            <Progress value={progress.percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {progress.completed_lessons} of {progress.total_lessons} lessons
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Referral Section */}
      {referralCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Refer & Earn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-1">
                  <p className="text-muted-foreground mb-4">
                    Share your referral code with friends and earn rewards when they join!
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary rounded-lg px-4 py-3 font-mono font-bold text-lg">
                      {referralCode.code}
                    </div>
                    <Button variant="outline" onClick={handleCopyReferralCode}>
                      {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-display text-3xl font-bold text-primary">
                    {referralCode.total_referrals}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Promo Code Dialog */}
      <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Promo Code</DialogTitle>
            <DialogDescription>
              Enter your promo code to enroll in a course
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter promo code"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              className="font-mono text-lg"
              disabled={isRedeeming}
            />
          </div>
          <LegalAgreementNote className="mb-2 px-1" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromoDialog(false)} disabled={isRedeeming}>
              Cancel
            </Button>
            <Button onClick={handleRedeemCode} disabled={isRedeeming || !promoCodeInput.trim()}>
              {isRedeeming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redeeming...
                </>
              ) : (
                'Redeem'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentDashboard;
