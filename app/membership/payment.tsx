"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { FlutterWaveButton, closePaymentModal } from "flutterwave-react-v3";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function MembershipPayment() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="p-8 text-center">You must be signed in to purchase membership.</div>
    );
  }

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || process.env.NEXT_PUBLIC_FLUTTERWAVE_KEY,
    tx_ref: `NCDFCOOP_MEMBERSHIP_${user.uid}_${Date.now()}`,
    amount: 5000, // Membership fee (₦5,000 as example)
    currency: "NGN",
    payment_options: "card,ussd,banktransfer",
    customer: {
      email: user.email,
      name: user.displayName || "NCDFCOOP Member",
    },
    customizations: {
      title: "NCDFCOOP Membership Payment",
      description: "Unlock exclusive member benefits!",
      logo: "/images/logo/NCDFCOOPLOGO.png",
    },
    callback: async (response) => {
      setLoading(true);
      try {
        // Mark user as member in Firestore
        await updateDoc(doc(db, "users", user.uid), {
          role: "member",
          membershipStatus: "active",
          membershipTier: "Bronze",
          membershipCode: `NCDF-${user.uid.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          membershipPaidAt: new Date().toISOString(),
        });
        setSuccess(true);
        closePaymentModal();
        router.push("/member/investments");
      } catch (err) {
        setError("Failed to activate membership. Please contact support.");
      } finally {
        setLoading(false);
      }
    },
    onClose: () => {},
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Become a Member</h2>
      <p className="mb-6">Pay a one-time fee to unlock all member benefits, rewards, and exclusive deals.</p>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {success ? (
        <div className="text-green-600 font-semibold">Membership activated! Welcome to NCDFCOOP 🎉</div>
      ) : (
        <FlutterWaveButton
          {...config}
          text={loading ? "Processing..." : "Pay ₦5,000 to Join"}
          disabled={loading}
          className="w-full py-3 px-6 bg-[#0B6B3A] hover:bg-[#095234] text-white font-bold rounded-lg transition-colors mt-4"
        />
      )}
    </div>
  );
}
