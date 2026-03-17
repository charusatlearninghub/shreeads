import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

interface CourseProgress {
  id: string;
  title: string;
  category: string | null;
  totalLessons: number;
  completedLessons: number;
  completed_at: string | null;
  certificate?: {
    id: string;
    certificate_number: string;
    issued_at: string;
  } | null;
}

const Certificates = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingCertId, setGeneratingCertId] = useState<string | null>(null);

  const fetchCourses = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch enrollments with course info
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          enrolled_at,
          courses (
            id,
            title,
            category
          )
        `)
        .eq('user_id', user.id);

      // Fetch existing certificates
      const { data: certificates } = await supabase
        .from('certificates')
        .select('id, course_id, certificate_number, issued_at')
        .eq('user_id', user.id);

      const certificateMap = new Map(
        certificates?.map(c => [c.course_id, c]) || []
      );

      if (enrollments) {
        const coursesWithProgress: CourseProgress[] = [];

        for (const enrollment of enrollments) {
          const course = enrollment.courses as { id: string; title: string; category: string | null };
          
          // Get lessons for this course
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', enrollment.course_id);

          const totalLessons = lessons?.length || 0;
          let completedLessons = 0;
          let lastCompletedAt: string | null = null;

          if (totalLessons > 0 && lessons) {
            // Get completed progress
            const { data: progress } = await supabase
              .from('lesson_progress')
              .select('lesson_id, last_watched_at')
              .eq('user_id', user.id)
              .eq('is_completed', true)
              .in('lesson_id', lessons.map(l => l.id))
              .order('last_watched_at', { ascending: false });

            completedLessons = progress?.length || 0;
            if (progress && progress.length > 0) {
              lastCompletedAt = progress[0].last_watched_at;
            }
          }

          const cert = certificateMap.get(course.id);
          
          coursesWithProgress.push({
            id: course.id,
            title: course.title,
            category: course.category,
            totalLessons,
            completedLessons,
            completed_at: lastCompletedAt,
            certificate: cert ? {
              id: cert.id,
              certificate_number: cert.certificate_number,
              issued_at: cert.issued_at,
            } : null,
          });
        }

        // Sort: completed courses first, then by completion percentage
        coursesWithProgress.sort((a, b) => {
          const aCompleted = a.completedLessons === a.totalLessons && a.totalLessons > 0;
          const bCompleted = b.completedLessons === b.totalLessons && b.totalLessons > 0;
          if (aCompleted && !bCompleted) return -1;
          if (!aCompleted && bCompleted) return 1;
          return (b.completedLessons / (b.totalLessons || 1)) - (a.completedLessons / (a.totalLessons || 1));
        });

        setCourses(coursesWithProgress);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const generateCertificate = async (courseId: string) => {
    setGeneratingCertId(courseId);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({ title: 'Error', description: 'Please log in to generate certificate', variant: 'destructive' });
        return;
      }

      const response = await supabase.functions.invoke('generate-certificate', {
        body: { course_id: courseId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.error) {
        toast({ title: 'Cannot Generate Certificate', description: data.error, variant: 'destructive' });
        return;
      }

      toast({ 
        title: 'Certificate Generated!', 
        description: `Certificate #${data.certificate.certificate_number} has been created.` 
      });
      
      // Refresh the list
      await fetchCourses();
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      toast({ title: 'Error', description: error.message || 'Failed to generate certificate', variant: 'destructive' });
    } finally {
      setGeneratingCertId(null);
    }
  };

  const downloadCertificate = (course: CourseProgress) => {
    if (!course.certificate) return;
    
    // Generate a printable HTML certificate
    const userName = profile?.full_name || 'Student';
    const issuedDate = new Date(course.certificate.issued_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const certificateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${course.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Inter', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f5f5f5;
            padding: 20px;
          }
          
          .certificate {
            width: 800px;
            height: 600px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 40px;
            position: relative;
            overflow: hidden;
          }
          
          .certificate-inner {
            background: white;
            border-radius: 12px;
            height: 100%;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            position: relative;
          }
          
          .certificate-inner::before {
            content: '';
            position: absolute;
            inset: 8px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            pointer-events: none;
          }
          
          .award-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
          }
          
          .award-icon svg {
            width: 40px;
            height: 40px;
            fill: white;
          }
          
          .title {
            font-family: 'Playfair Display', serif;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 4px;
            color: #6b7280;
            margin-bottom: 8px;
          }
          
          .course-title {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 24px;
            max-width: 500px;
          }
          
          .presented-to {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #9ca3af;
            margin-bottom: 8px;
          }
          
          .recipient-name {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 24px;
          }
          
          .description {
            font-size: 14px;
            color: #6b7280;
            max-width: 400px;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          
          .footer {
            display: flex;
            justify-content: space-between;
            width: 100%;
            max-width: 500px;
          }
          
          .footer-item {
            text-align: center;
          }
          
          .footer-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #9ca3af;
            margin-bottom: 4px;
          }
          
          .footer-value {
            font-size: 12px;
            color: #374151;
            font-weight: 500;
          }
          
          @media print {
            body { background: white; padding: 0; }
            .certificate { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="certificate-inner">
            <div class="award-icon">
              <svg viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            </div>
            <p class="title">Certificate of Completion</p>
            <h1 class="course-title">${course.title}</h1>
            <p class="presented-to">Presented to</p>
            <h2 class="recipient-name">${userName}</h2>
            <p class="description">
              For successfully completing all lessons and demonstrating proficiency in the course curriculum.
            </p>
            <div class="footer">
              <div class="footer-item">
                <p class="footer-label">Date Issued</p>
                <p class="footer-value">${issuedDate}</p>
              </div>
              <div class="footer-item">
                <p class="footer-label">Certificate ID</p>
                <p class="footer-value">${course.certificate.certificate_number}</p>
              </div>
            </div>
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;

    const blob = new Blob([certificateHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onafterprint = () => {
        URL.revokeObjectURL(url);
      };
    }
  };

  const displayName = profile?.full_name || 'Student';

  const completedCourses = courses.filter(c => c.completedLessons === c.totalLessons && c.totalLessons > 0);
  const inProgressCourses = courses.filter(c => c.completedLessons < c.totalLessons || c.totalLessons === 0);

  return (
    <DashboardLayout title="Certificates" subtitle="Your achievements and certifications">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-8 text-center">
          <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display font-bold text-lg mb-2">No Courses Enrolled</h3>
          <p className="text-muted-foreground">
            Enroll in a course to start earning certificates
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Completed Courses - Certificates */}
          {completedCourses.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Earned Certificates ({completedCourses.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-sensitive="true">
                {completedCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="bg-gradient-to-br from-primary via-purple-600 to-pink-500 p-8 text-white text-center relative">
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                          }} />
                        </div>
                        <Award className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-sm opacity-80 mb-2">Certificate of Completion</p>
                        <h3 className="font-display font-bold text-xl mb-4">{course.title}</h3>
                        <p className="text-lg">{displayName}</p>
                        {course.certificate ? (
                          <>
                            <Badge variant="secondary" className="mt-3 bg-white/20 text-white border-0">
                              #{course.certificate.certificate_number}
                            </Badge>
                            <p className="text-sm opacity-80 mt-2">
                              Issued on {new Date(course.certificate.issued_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm opacity-80 mt-2">
                            Completed on {course.completed_at && new Date(course.completed_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      <CardContent className="p-4">
                        {course.certificate ? (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => downloadCertificate(course)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Certificate
                          </Button>
                        ) : (
                          <Button 
                            className="w-full"
                            onClick={() => generateCertificate(course.id)}
                            disabled={generatingCertId === course.id}
                          >
                            {generatingCertId === course.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Award className="w-4 h-4 mr-2" />
                                Generate Certificate
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* In Progress Courses */}
          {inProgressCourses.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                In Progress ({inProgressCourses.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgressCourses.map((course) => {
                  const progress = course.totalLessons > 0 
                    ? Math.round((course.completedLessons / course.totalLessons) * 100) 
                    : 0;
                  
                  return (
                    <Card key={course.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{course.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {course.completedLessons} of {course.totalLessons} lessons completed
                          </p>
                          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Certificates;
