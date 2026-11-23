import { createRoot } from 'react-dom/client';
import { Platform } from '../src/components/platform';
import '../src/app/globals.css';
import '../src/app/driveonyx-2.css';
import '../src/app/noir-signature.css';
import '../src/app/noir-details.css';
import '../src/app/virtual-garage.css';

createRoot(document.getElementById('app')!).render(<Platform />);
