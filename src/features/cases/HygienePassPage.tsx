import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CameraCapture } from '@/features/scanner/CameraCapture';
import { dataProvider } from '@/services';
import type { LoanCase, Supplier, Tray } from '@/types/database';
import { Check, Mail, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Photographs the current sterilization batch's hygiene passport (a fresh
 * printout each cycle - never the same twice) and e-mails the supplier that
 * the Sieb is ready for pickup/return. Reachable from CaseDetailPage once a
 * case has an outtake ('compared') - see notifySupplierReady() in the
 * DataProvider, which stores the photo and sends the mail server-side
 * (supabase/functions/send-sieb-ready-email) so the recipient address is
 * never trusted from the client.
 */
export function HygienePassPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [loanCase, setLoanCase] = useState<LoanCase | null | undefined>(undefined);
  const [tray, setTray] = useState<Tray | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    dataProvider.getCase(caseId).then(async (found) => {
      setLoanCase(found);
      if (!found) return;
      const trays = await dataProvider.getTrays();
      const foundTray = trays.find((t) => t.id === found.trayId) ?? null;
      setTray(foundTray);
      if (foundTray) setSupplier(await dataProvider.getSupplier(foundTray.supplierId));
    });
  }, [caseId]);

  const handleSend = async () => {
    if (!caseId || !photoDataUrl) return;
    setSending(true);
    setError(null);
    try {
      await dataProvider.notifySupplierReady(caseId, photoDataUrl);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Senden fehlgeschlagen.');
    } finally {
      setSending(false);
    }
  };

  if (loanCase === undefined) {
    return (
      <div>
        <TopBar title="Hygiene-Pass" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Wird geladen …</p>
      </div>
    );
  }

  if (loanCase === null || !caseId) {
    return (
      <div>
        <TopBar title="Hygiene-Pass" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Fall nicht gefunden.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <TopBar title="Hygiene-Pass" showBack />
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-600">
            <Check size={28} />
          </div>
          <p className="text-base font-semibold text-ink-900">Lieferant benachrichtigt</p>
          <p className="max-w-xs text-sm text-ink-500">
            {tray?.code} ist bereit für die Abholung. E-Mail wurde an {supplier?.contactEmail} gesendet.
          </p>
          <Button className="mt-2" onClick={() => navigate(`/faelle/${caseId}`, { replace: true })}>
            Zurück zum Fall
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Hygiene-Pass" subtitle={tray?.code} showBack />
      <div className="px-4 py-4">
        {!supplier?.contactEmail && (
          <p className="mb-3 rounded-xl bg-warning-50 p-3 text-sm text-warning-700">
            Für {supplier?.name ?? 'diesen Lieferanten'} ist keine E-Mail-Adresse hinterlegt - bitte zuerst in der
            Lieferantenverwaltung ergänzen.
          </p>
        )}

        {!photoDataUrl && (
          <>
            <p className="mb-3 text-sm text-ink-600">
              Hygiene-Pass der aktuellen Sterilisationscharge fotografieren (Chargen-Ausdruck - jedes Mal anders).
            </p>
            <CameraCapture onCapture={setPhotoDataUrl} />
          </>
        )}

        {photoDataUrl && (
          <>
            <div className="overflow-hidden rounded-2xl bg-ink-900">
              <img src={photoDataUrl} alt="Hygiene-Pass" className="w-full object-contain" />
            </div>

            <Card className="mt-4 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Wird gesendet an</p>
              <p className="mt-1 text-sm font-medium text-ink-900">
                {supplier?.name} {supplier?.contactEmail && `· ${supplier.contactEmail}`}
              </p>
            </Card>

            {error && <p className="mt-3 rounded-xl bg-danger-50 p-3 text-sm text-danger-600">{error}</p>}

            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                icon={<RotateCcw size={18} />}
                onClick={() => setPhotoDataUrl(null)}
                disabled={sending}
              >
                Neu fotografieren
              </Button>
              <Button
                size="lg"
                fullWidth
                icon={<Mail size={18} />}
                onClick={handleSend}
                disabled={sending || !supplier?.contactEmail}
              >
                {sending ? 'Wird gesendet …' : 'Bereitschaft melden'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
