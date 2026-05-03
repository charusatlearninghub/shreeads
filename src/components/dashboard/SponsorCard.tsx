import { useEffect, useState } from "react";
import { UserCheck, UserX, Users, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SponsorInfo {
  has_sponsor: boolean;
  sponsor_name?: string;
  sponsor_email?: string;
  referral_code_used?: string | null;
}

interface ReferredUser {
  id: string;
  name: string;
  created_at: string;
  enrollments_count: number;
  courses: { id: string; title: string }[] | null;
}

interface ReferralsDetail {
  total_referrals: number;
  converted: number;
  users: ReferredUser[];
}

export function SponsorCard() {
  const { user } = useAuth();
  const [info, setInfo] = useState<SponsorInfo | null>(null);
  const [refs, setRefs] = useState<ReferralsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: sp }, { data: rd }] = await Promise.all([
        supabase.rpc("get_my_sponsor"),
        supabase.rpc("get_my_referrals_detail"),
      ]);
      if (cancelled) return;
      if (sp) setInfo(sp as unknown as SponsorInfo);
      if (rd) setRefs(rd as unknown as ReferralsDetail);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || !info) return null;

  const total = refs?.total_referrals ?? 0;
  const converted = refs?.converted ?? 0;
  const rate = total > 0 ? Math.round((converted / total) * 100) : 0;

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-5">
        {/* Sponsor */}
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${info.has_sponsor ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            {info.has_sponsor ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-1">My Sponsor</h3>
            {info.has_sponsor ? (
              <>
                <p className="font-display text-lg font-bold truncate">{info.sponsor_name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {info.referral_code_used && (
                    <Badge variant="secondary" className="font-mono text-xs">{info.referral_code_used}</Badge>
                  )}
                  <p className="text-xs text-muted-foreground">
                    You joined this platform through {info.sponsor_name}.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No sponsor on record for your account.</p>
            )}
          </div>
        </div>

        {/* My referrals stats */}
        {total > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> My Referrals
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(v => !v)} className="h-7 px-2 text-xs">
                {expanded ? <>Hide <ChevronUp className="w-3 h-3 ml-1" /></> : <>Show users <ChevronDown className="w-3 h-3 ml-1" /></>}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <div className="text-xl font-bold">{total}</div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Referred</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <div className="text-xl font-bold text-green-600">{converted}</div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Converted</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <div className="text-xl font-bold">{rate}%</div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Rate</div>
              </div>
            </div>

            {expanded && refs && refs.users.length > 0 && (
              <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
                {refs.users.map(u => (
                  <div key={u.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{u.name}</p>
                      <Badge variant={u.enrollments_count > 0 ? "default" : "outline"} className="text-[10px]">
                        {u.enrollments_count > 0 ? `${u.enrollments_count} enrolled` : "No enrollments"}
                      </Badge>
                    </div>
                    {u.courses && u.courses.length > 0 && (
                      <ul className="space-y-1 mt-1">
                        {u.courses.map((c, idx) => (
                          <li key={`${c.id}-${idx}`} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3 shrink-0" />
                            <span className="truncate">{c.title || "Course"}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
