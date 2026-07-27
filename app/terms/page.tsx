export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          By using CoopX, you agree to trade fairly, provide accurate information, and comply with platform and cooperative policies.
        </p>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Orders, pricing, and availability may change as inventory updates in real time. Platform misuse, fraud, or abuse can result in account suspension.
        </p>
      </div>
    </div>
  );
}
