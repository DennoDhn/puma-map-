import { createRoot } from 'react-dom/client';
import { Platform } from '../src/components/platform';
import '../src/app/globals.css';
import '../src/app/driveonyx-2.css';

createRoot(document.getElementById('app')!).render(<Platform />);
