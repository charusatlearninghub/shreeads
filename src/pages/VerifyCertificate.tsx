import { useState } from "react";
import { motion } from "framer-motion";
import { Award, Search, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface VerificationResult {
  valid: boolean;
  certificate?: {
    certificate_number: string;
    issued_at: string;
    course_title: string;
    recipient_name: string;
  };
}

const VerifyCertificate = () => {
  const [certificateNumber, setCertificateNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedNumber = certificateNumber.trim().toUpperCase();
    if (!trimmedNumber) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await supabase.functions.invoke('verify-certificate', {
        body: { certificate_number: trimmedNumber },
      });

      if (response.error) {
        setResult({ valid: false });
        return;
      }

      setResult(response.data);
    } catch (error) {
      console.error('Verification error:', error);
      setResult({ valid: false });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-lg">Certificate Verification</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Award className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-4">Verify a Certificate</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Enter a certificate number to verify its authenticity and view the details.
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleVerify}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Enter certificate number (e.g., CERT-2026-A1B2C3D4)"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  className="flex-1 text-center font-mono uppercase"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !certificateNumber.trim()}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.form>

        {/* Result */}
        {hasSearched && !isLoading && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {result.valid && result.certificate ? (
              <Card className="overflow-hidden border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                  <h2 className="text-xl font-bold">Certificate Verified</h2>
                  <p className="text-green-100 text-sm mt-1">This certificate is authentic and valid</p>
                </div>
                <CardContent className="p-6" data-sensitive="true">
                  <div className="space-y-4">
                    <div className="text-center pb-4 border-b">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Certificate Number</p>
                      <p className="font-mono font-bold text-lg">{result.certificate.certificate_number}</p>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Recipient</p>
                        <p className="font-semibold">{result.certificate.recipient_name}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Date Issued</p>
                        <p className="font-semibold">
                          {new Date(result.certificate.issued_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Course Completed</p>
                      <p className="font-semibold text-lg">{result.certificate.course_title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
                <CardContent className="p-8 text-center">
                  <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <h2 className="text-xl font-bold mb-2">Certificate Not Found</h2>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    We couldn't find a certificate with that number. Please check the number and try again.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <p>
            Certificate numbers start with "CERT-" followed by the year and a unique code.
          </p>
          <p className="mt-1">
            Example: CERT-2026-A1B2C3D4
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default VerifyCertificate;
