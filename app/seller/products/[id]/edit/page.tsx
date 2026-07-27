"use client";

import { FormEvent, useEffect, useState } from "react";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { ArrowLeft, Loader2, PackageCheck, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth/authContext";
import { COLLECTIONS, USER_ROLES } from "@/lib/constants/database";
import { db } from "@/lib/firebase/config";

type EditableProduct = {
  name: string;
  description: string;
  category: string;
  price: string;
  originalPrice: string;
  stock: string;
  unit: string;
  status: "draft" | "pending" | "live" | "rejected";
  rejectionReason: string;
};

const EMPTY_PRODUCT: EditableProduct = {
  name: "",
  description: "",
  category: "",
  price: "",
  originalPrice: "",
  stock: "",
  unit: "unit",
  status: "draft",
  rejectionReason: "",
};

export default function SellerProductEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<EditableProduct>(EMPTY_PRODUCT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db || !user?.uid || !params.id) return;
    let active = true;

    void (async () => {
      try {
        setLoading(true);
        const snapshot = await getDoc(doc(db, COLLECTIONS.PRODUCTS, params.id));
        if (!snapshot.exists()) throw new Error("Product not found.");
        const data = snapshot.data();
        if (data.sellerId !== user.uid) {
          throw new Error("You do not own this product.");
        }
        if (!active) return;
        setProduct({
          name: String(data.name || ""),
          description: String(data.description || ""),
          category: String(data.category || ""),
          price: String(data.price || ""),
          originalPrice: String(data.originalPrice || ""),
          stock: String(data.stock ?? ""),
          unit: String(data.unit || "unit"),
          status: ["draft", "pending", "live", "rejected"].includes(data.status)
            ? data.status
            : "draft",
          rejectionReason: String(data.rejectionReason || ""),
        });
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Product details could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [params.id, user?.uid]);

  const update = (field: keyof EditableProduct, value: string) => {
    setProduct((current) => ({ ...current, [field]: value }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!db || !params.id) return;

    const name = product.name.trim();
    const description = product.description.trim();
    const category = product.category.trim();
    const price = Number(product.price);
    const originalPrice = Number(product.originalPrice || product.price);
    const stock = Number(product.stock);
    if (
      name.length < 2 ||
      name.length > 160 ||
      description.length < 10 ||
      description.length > 5_000 ||
      !category ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(originalPrice) ||
      originalPrice < price ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError(
        "Enter a valid name, description, category, price and whole-number stock quantity.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      const nextStatus =
        product.status === "rejected" ? "draft" : product.status;
      await updateDoc(doc(db, COLLECTIONS.PRODUCTS, params.id), {
        name,
        description,
        category,
        price,
        retailPrice: price,
        originalPrice,
        stock,
        unit: product.unit.trim().slice(0, 50) || "unit",
        status: nextStatus,
        isActive: nextStatus === "live",
        requiresReview: nextStatus === "pending",
        updatedAt: Timestamp.now(),
      });
      router.push("/seller/products");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The product could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute
      currentPath={`/seller/products/${params.id}/edit`}
      requiredRoles={[USER_ROLES.SELLER]}
    >
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 py-6 text-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 dark:text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => router.push("/seller/products")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold transition hover:-translate-x-0.5 dark:border-white/10 dark:bg-white/5"
          >
            <ArrowLeft size={17} /> Products
          </button>

          <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900">
            <header className="border-b border-slate-200 bg-gradient-to-r from-emerald-950 to-teal-800 p-6 text-white dark:border-white/10 sm:p-8">
              <PackageCheck size={28} className="text-emerald-300" />
              <h1 className="mt-4 text-2xl font-black sm:text-3xl">
                Edit product
              </h1>
              <p className="mt-2 text-sm text-emerald-100">
                Saved changes synchronize with your seller inventory. Rejected
                products return to draft so you can resubmit them.
              </p>
            </header>

            {loading ? (
              <div className="grid min-h-64 place-items-center">
                <Loader2 className="animate-spin text-emerald-700" />
              </div>
            ) : (
              <form onSubmit={save} className="space-y-5 p-5 sm:p-8">
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
                  >
                    {error}
                  </div>
                )}
                {product.status === "rejected" && product.rejectionReason && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                    Review feedback: {product.rejectionReason}
                  </div>
                )}

                <Field
                  label="Product name"
                  value={product.name}
                  onChange={(value) => update("name", value)}
                  maxLength={160}
                />
                <label className="block">
                  <span className="text-sm font-bold">Description</span>
                  <textarea
                    value={product.description}
                    onChange={(event) =>
                      update("description", event.target.value)
                    }
                    rows={6}
                    maxLength={5_000}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:border-white/15"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Category"
                    value={product.category}
                    onChange={(value) => update("category", value)}
                    maxLength={100}
                  />
                  <Field
                    label="Unit"
                    value={product.unit}
                    onChange={(value) => update("unit", value)}
                    maxLength={50}
                  />
                  <Field
                    label="Price (₦)"
                    value={product.price}
                    onChange={(value) => update("price", value)}
                    type="number"
                    min="1"
                  />
                  <Field
                    label="Original price (₦)"
                    value={product.originalPrice}
                    onChange={(value) => update("originalPrice", value)}
                    type="number"
                    min="1"
                  />
                  <Field
                    label="Stock"
                    value={product.stock}
                    onChange={(value) => update("stock", value)}
                    type="number"
                    min="0"
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => router.push("/seller/products")}
                    className="min-h-12 rounded-xl border border-slate-300 px-5 text-sm font-bold transition hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Save size={17} />
                    )}
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  min?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        required
        className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-transparent px-4 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:border-white/15"
      />
    </label>
  );
}
