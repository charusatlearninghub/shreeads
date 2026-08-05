import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Loader2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CourseWaitlistCardProps {
  courseId: string;
  courseTitle: string;
  launchDate?: string | null;
}

/**
 * Shown on upcoming ("coming soon") courses so visitors can register
 * to be notified when enrollment opens.
 */
export function CourseWaitlistCard({ courseId, courseTitle, launchDate }: CourseWaitlistCardProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (profile?.email) setEmail(profile.email);
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.email, profile?.full_name]);

  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("course_waitlist")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setJoined(true);
    };
    void checkExisting();
  }, [user, courseId]);

  const handleJoin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      toast({ title: "Enter a valid email", description: "We need an email to notify you.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("course_waitlist").insert({
        course_id: courseId,
        user_id: user?.id ?? null,
        email: cleanEmail,
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
      });

      if (error) {
        // Unique index on (course_id, lower(email))
        if (error.code === "23505") {
          setJoined(true);
          toast({ title: "You're already on the list", description: "We'll notify you when enrollment opens." });
          return;
        }
        throw error;
      }

      setJoined(true);
      toast({ title: "You're on the waitlist!", description: `We'll email you when "${courseTitle}" opens.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not join the waitlist";
      toast({ title: "Something went wrong", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const launchLabel = launchDate
    ? new Date(launchDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <Card className="border-primary/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">Coming Soon</h3>
            {launchLabel && (
              <p className="text-xs text-muted-foreground">Expected launch: {launchLabel}</p>
            )}
          </div>
        </div>

        {joined ? (
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>You're on the waitlist. We'll notify you as soon as enrollment opens.</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Join the waitlist and be the first to know when enrollment opens.
            </p>
            <div className="space-y-2">
              <Input
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
              />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
              <Input
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
              />
              <Button className="w-full" onClick={handleJoin} disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>
                ) : (
                  <><BellRing className="w-4 h-4 mr-2" /> Notify Me</>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
