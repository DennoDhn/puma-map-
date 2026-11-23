import { Dialog } from '../src/components/dialog';
export default function ReadOnlyDialog({ setModal }: { setModal: (value: null) => void }) {
  return (
    <Dialog title="PumaMap-Designvorschau" onClose={() => setModal(null)}>
      <p>
        Du kannst die öffentlichen Bereiche erkunden. Anmeldung und persönliche Inhalte werden auf
        dem Community-Server freigeschaltet.
      </p>
      <button className="button" onClick={() => setModal(null)}>
        Weiter erkunden
      </button>
    </Dialog>
  );
}
