import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Copy, Check, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface ReferralCode {
  code: string;
  total_referrals: number;
}

const Referrals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    const fetchReferralCode = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('referral_codes')
          .select('code, total_referrals')
          .eq('user_id', user.id)
          .maybeSingle();

        setReferralCode(data);
      } catch (error) {
        console.error('Error fetching referral code:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralCode();
  }, [user]);

  const handleCopyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode.code);
      setCodeCopied(true);
      toast({ title: "Copied!", description: "Referral code copied to clipboard" });
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleShareReferralCode = () => {
    if (referralCode && navigator.share) {
      navigator.share({
        title: 'Join SHREE ADS Learning',
        text: `Use my referral code ${referralCode.code} to join SHREE ADS Learning!`,
        url: window.location.origin,
      });
    }
  };

  return (
    <DashboardLayout title="Referrals" subtitle="Invite friends and earn rewards">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : referralCode ? (
        <div className="space-y-6">
          {/* Referral Stats */}
          <div className="grid sm:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-4xl font-bold text-primary mb-2">
                    {referralCode.total_referrals}
                  </h3>
                  <p className="text-muted-foreground">Total Referrals</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="font-display text-4xl font-bold text-green-500 mb-2">
                    0
                  </h3>
                  <p className="text-muted-foreground">Rewards Earned</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Referral Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Your Referral Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Share your referral code with friends. When they sign up using your code, you'll both earn rewards!
                </p>
                
                <div className="flex flex-col sm:flex-row items-stretch gap-4">
                  <div className="flex-1 bg-secondary rounded-xl px-6 py-4 font-mono font-bold text-2xl text-center">
                    {referralCode.code}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 sm:flex-none"
                      onClick={handleCopyReferralCode}
                    >
                      {codeCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {codeCopied ? 'Copied!' : 'Copy'}
                    </Button>
                    {navigator.share && (
                      <Button className="flex-1 sm:flex-none" onClick={handleShareReferralCode}>
                        Share
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <h4 className="font-semibold mb-1">Share Your Code</h4>
                    <p className="text-sm text-muted-foreground">
                      Send your unique referral code to friends
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <h4 className="font-semibold mb-1">They Sign Up</h4>
                    <p className="text-sm text-muted-foreground">
                      Friends create an account using your code
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <h4 className="font-semibold mb-1">Earn Rewards</h4>
                    <p className="text-sm text-muted-foreground">
                      Get rewards when they complete courses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display font-bold text-lg mb-2">No Referral Code</h3>
          <p className="text-muted-foreground">
            Your referral code will appear here once generated
          </p>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default Referrals;
