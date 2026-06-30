import { notFound } from 'next/navigation';

export default function DiagnosticsPage() {
  // Operational diagnostics are intentionally unavailable from the public UI.
  // Health monitoring is exposed through the non-secret /api/health-check route.
  notFound();
}
