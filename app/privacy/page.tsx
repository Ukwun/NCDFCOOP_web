export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          CoopX collects account, order, and activity data to operate payments, fulfillment, and platform safety.
        </p>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          We do not sell personal data. Information is processed for service delivery, compliance, and fraud prevention, with access controls in place.
        </p>
      </div>
    </div>
  );
}
