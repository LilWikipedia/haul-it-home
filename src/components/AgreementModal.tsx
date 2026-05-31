import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckSquare, ChevronDown } from "lucide-react";

export const TERMS_VERSION = "1.0";

// ─── Legal Content ────────────────────────────────────────────────────────────

const UserTermsContent = () => (
  <div className="space-y-4 text-sm leading-relaxed">
    <p className="text-xs text-muted-foreground">Last updated: June 2026 — Version {TERMS_VERSION}</p>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">1. About YeeHaul</h3>
      <p>
        YeeHaul operates an online marketplace that connects individuals who need items transported
        ("Users") with independent truck owners who provide hauling services ("Haulers"). YeeHaul
        is a technology platform only. We are not a motor carrier, freight broker, or transportation
        company. We do not employ Haulers, own vehicles, or provide hauling services directly.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">2. Eligibility</h3>
      <p>
        You must be at least 18 years old to use YeeHaul. By accepting these terms, you confirm
        that you are 18 or older and legally capable of entering into binding agreements.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">3. Marketplace Role — Limitation of Liability</h3>
      <p>
        YeeHaul acts solely as a marketplace intermediary. We do not supervise, direct, or control
        the actions of Haulers. We make no representations or warranties regarding the quality,
        safety, or legality of any hauling service performed through our platform.
      </p>
      <p>
        <strong>YeeHaul is not liable for any loss, theft, damage, or destruction of your property
        during transport.</strong> Any claims related to property damage or loss are strictly between
        you and the Hauler. You are encouraged to document your items with photos before transport
        and to ensure valuable items are appropriately insured.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">4. Your Responsibilities</h3>
      <ul className="list-disc pl-4 space-y-1">
        <li>Provide accurate descriptions of items to be hauled, including true weight and size.</li>
        <li>Only post lawful items. No weapons, hazardous materials, illegal goods, or live animals.</li>
        <li>Be present or have a representative available at pickup and/or dropoff as agreed.</li>
        <li>Treat Haulers with respect. Harassment or abuse may result in account termination.</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">5. Payments & Refunds</h3>
      <p>
        Payment is charged when a Hauler claims your request. Prices are estimates based on distance
        and item size; the final price shown at checkout is binding. Refunds are handled on a
        case-by-case basis. If a Hauler fails to complete a job without cause, contact YeeHaul
        support for a refund review. YeeHaul retains a platform service fee from each transaction.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">6. Dispute Resolution</h3>
      <p>
        Any dispute between Users and Haulers regarding service quality, property damage, or
        payment must first be attempted to be resolved between the parties directly via in-app
        messaging. YeeHaul may, at its sole discretion, assist in mediation but is not obligated
        to resolve disputes and assumes no liability for their outcome.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">7. Account Termination</h3>
      <p>
        YeeHaul reserves the right to suspend or terminate any account at any time for violations
        of these terms, fraudulent activity, or behavior that harms the platform or its community.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">8. Disclaimer of Warranties</h3>
      <p>
        The YeeHaul platform is provided "as is" without warranty of any kind. We do not guarantee
        that a Hauler will be available for your request, that the service will be uninterrupted,
        or that the platform will be free of errors.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">9. Changes to These Terms</h3>
      <p>
        YeeHaul may update these terms from time to time. You will be asked to review and accept
        updated terms before continuing to use the platform. Continued use after acceptance
        constitutes agreement to the updated terms.
      </p>
    </section>

    <p className="text-xs text-muted-foreground pt-2">
      By clicking "I Agree," you acknowledge that you have read, understood, and agree to be
      bound by these Terms of Service and our Privacy Policy.
    </p>
  </div>
);

const HaulerTermsContent = () => (
  <div className="space-y-4 text-sm leading-relaxed">
    <p className="text-xs text-muted-foreground">Last updated: June 2026 — Version {TERMS_VERSION}</p>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">1. Independent Contractor Status</h3>
      <p>
        You are engaging with YeeHaul as an <strong>independent contractor</strong>, not as an
        employee, agent, or partner. You retain full control over when, where, and how you
        provide hauling services. YeeHaul does not direct or supervise your work, set your hours,
        or require exclusivity. You are solely responsible for all taxes, self-employment
        contributions, and any other obligations arising from your work as a Hauler.
      </p>
      <p>
        Nothing in this agreement creates an employment relationship. You are not entitled to
        employee benefits, workers' compensation, unemployment insurance, or any other employment
        protections through YeeHaul.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">2. Licensing, Insurance & Legal Compliance</h3>
      <ul className="list-disc pl-4 space-y-1">
        <li>You must hold a valid driver's license appropriate for the vehicle you operate.</li>
        <li>
          You are solely responsible for maintaining adequate auto insurance on your vehicle,
          including coverage appropriate for commercial or for-hire use if required in your
          jurisdiction. YeeHaul does not provide insurance coverage of any kind.
        </li>
        <li>You must comply with all federal, state, and local laws governing transportation,
        vehicle operation, and for-hire services in your area.</li>
        <li>You represent that your vehicle is roadworthy and properly registered.</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">3. Cargo Responsibility</h3>
      <p>
        From the moment you take possession of a User's items at pickup until delivery is
        confirmed, <strong>you are solely responsible for the safe transport and security of those
        items.</strong> YeeHaul bears no liability for any loss, theft, or damage occurring while
        items are in your possession.
      </p>
      <p>
        You agree to indemnify and hold YeeHaul harmless from any claims, damages, or costs
        arising from your failure to safely transport items as agreed.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">4. Platform Fee</h3>
      <p>
        YeeHaul retains an <strong>18% platform service fee</strong> from each completed job.
        The remaining 82% of the job value represents your earnings. This fee covers platform
        operations, payment processing, and customer support. The fee percentage may be adjusted
        in the future with advance notice.
      </p>
      <p>
        Payouts are processed after job completion and payment confirmation. You are responsible
        for any taxes owed on your earnings.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">5. Conduct & Job Completion</h3>
      <ul className="list-disc pl-4 space-y-1">
        <li>Once you claim a job, you are expected to complete it. Frequent cancellations
        after claiming may result in account suspension.</li>
        <li>You must treat Users and their property with respect.</li>
        <li>Do not transport illegal, hazardous, or prohibited materials regardless of what
        a User requests.</li>
        <li>You must accurately update job status in the app at each stage of the haul.</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">6. Limitation of Liability</h3>
      <p>
        YeeHaul's total liability to you arising from or related to this agreement or your use
        of the platform shall not exceed the total platform fees paid by YeeHaul in the three
        months preceding the claim.
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">7. Account Termination</h3>
      <p>
        YeeHaul reserves the right to deactivate your Hauler account for violations of these
        terms, safety concerns, low ratings, fraudulent activity, or any conduct detrimental
        to Users or the platform.
      </p>
    </section>

    <p className="text-xs text-muted-foreground pt-2">
      By clicking "I Agree," you confirm you have read and understood this Hauler Contractor
      Agreement and agree to its terms as an independent contractor.
    </p>
  </div>
);

// ─── Modal Component ──────────────────────────────────────────────────────────

type AgreementModalProps = {
  type: "user" | "hauler";
  open: boolean;
  onAccepted: () => void;
};

const AgreementModal = ({ type, open, onAccepted }: AgreementModalProps) => {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Consider "at bottom" if within 60px of the end (handles rounding/padding)
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 60;
    if (atBottom) setScrolledToBottom(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setScrolledToBottom(false);

    // If the content doesn't overflow, enable immediately
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el && el.scrollHeight <= el.clientHeight + 10) {
        setScrolledToBottom(true);
      }
    });
  }, [open, type]);

  const title = type === "user"
    ? "Terms of Service & User Agreement"
    : "Hauler Independent Contractor Agreement";

  const description = type === "user"
    ? "Please read and scroll through our Terms of Service before continuing."
    : "As a Hauler you must agree to our Contractor Agreement before accessing jobs.";

  return (
    <Dialog open={open} onOpenChange={() => { /* intentionally non-dismissable */ }}>
      <DialogContent
        className="max-w-lg w-full"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Scrollable terms body */}
        <div
          ref={scrollRef}
          onScroll={checkScrollPosition}
          className="h-72 overflow-y-auto border rounded-lg px-4 py-3 bg-muted/30"
        >
          {type === "user" ? <UserTermsContent /> : <HaulerTermsContent />}
        </div>

        {/* Scroll nudge */}
        {!scrolledToBottom && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground animate-bounce">
            <ChevronDown className="h-3 w-3" />
            Scroll to the bottom to continue
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={!scrolledToBottom}
            onClick={onAccepted}
            className="w-full gap-2"
            size="lg"
          >
            <CheckSquare className="h-4 w-4" />
            I Have Read and Agree — Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgreementModal;
