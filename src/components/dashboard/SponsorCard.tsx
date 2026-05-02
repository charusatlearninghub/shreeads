import { useEffect, useState } from "react";
import { UserCheck, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SponsorInfo {
  has_sponsor: boolean;
  sponsor_name?: string;
  sponsor_email?: string;
  referral_code_used?: string | null;
}

export function SponsorCard() {
  const { user } = useAuth();
  const [info, setInfo] = useState<SponsorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_my_sponsor");
      if (cancelled) return;
      if (!error && data) setInfo(data as unknown as SponsorInfo);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || !info) return null;

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5">
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
      </CardContent>
    </Card>
  );
}
