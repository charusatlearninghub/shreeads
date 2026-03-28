import { Link } from "react-router-dom";

interface LegalAgreementNoteProps {
  className?: string;
}

/**
 * Shown near course purchase / enrollment so users see Privacy, Terms, Refund, and Disclaimer.
 */
export function LegalAgreementNote({ className = "" }: LegalAgreementNoteProps) {
  return (
    <p
      className={`text-xs sm:text-sm text-muted-foreground text-center leading-relaxed ${className}`}
    >
      By purchasing or enrolling in a course, you agree to our{" "}
      <Link to="/privacy-policy" className="text-primary underline underline-offset-2 hover:no-underline font-medium">
        Privacy Policy
      </Link>
      ,{" "}
      <Link to="/terms-of-service" className="text-primary underline underline-offset-2 hover:no-underline font-medium">
        Terms of Service
      </Link>
      ,{" "}
      <Link to="/refund-policy" className="text-primary underline underline-offset-2 hover:no-underline font-medium">
        Refund Policy
      </Link>
      , and{" "}
      <Link to="/disclaimer" className="text-primary underline underline-offset-2 hover:no-underline font-medium">
        Disclaimer
      </Link>
      .
    </p>
  );
}
