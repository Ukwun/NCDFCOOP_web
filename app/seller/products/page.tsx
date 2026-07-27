"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import ProtectedRoute from "@/components/ProtectedRoute";
import { COLLECTIONS, USER_ROLES } from "@/lib/constants/database";
import { AppColors, AppTextStyles } from "@/lib/theme";
import Image from "next/image";
import { resolveProductImage } from "@/lib/utils/productImage";

interface SellerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  thumbnail?: string;
  images?: string[];
  sellerId: string;
  sellerName: string;
  rating: number;
  reviews: number;
  discount?: number;
  unit?: string;
  status?: "draft" | "pending" | "live" | "rejected";
  requiresReview?: boolean;
  isActive?: boolean;
  rejectionReason?: string;
  type?: "retail" | "wholesale" | "both";
  activeOffer?: {
    id: string;
    title: string;
    discountPercentage: number;
    status: "active" | "scheduled" | "inactive";
  };
}

export default function SellerProductsPage() {
  const router = useRouter();
  const { user, loading, currentRole } = useAuth();
  const userId = user?.uid;
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const visibleProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      [product.name, product.description, product.category, product.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [products, searchTerm]);

  // Keep inventory live so saves and moderation changes appear immediately.
  useEffect(() => {
    if (!loading && userId && currentRole === USER_ROLES.SELLER) {
      if (!db) {
        setError("Database not initialized. Please refresh the page.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const sellerProducts = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where("sellerId", "==", userId),
      );
      return onSnapshot(
        sellerProducts,
        (snapshot) => {
          setProducts(
            snapshot.docs.map(
              (item) => ({ id: item.id, ...item.data() }) as SellerProduct,
            ),
          );
          setError(null);
          setIsLoading(false);
        },
        (snapshotError) => {
          console.error("Error watching products:", snapshotError);
          setError("Failed to load products");
          setIsLoading(false);
        },
      );
    } else if (!loading && !userId) {
      router.push("/signin");
    } else if (!loading && userId && currentRole !== USER_ROLES.SELLER) {
      router.push("/home");
    }
  }, [userId, loading, currentRole, router]);

  const fetchSellerProducts = async () => {
    if (!user) return;

    if (!db) {
      setProducts([]);
      setError("Database not initialized. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where("sellerId", "==", user.uid),
      );

      const querySnapshot = await getDocs(q);
      const fetchedProducts = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as SellerProduct,
      );

      setProducts(fetchedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    if (!db) {
      setError("Database not initialized. Please refresh the page.");
      return;
    }

    try {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      await updateDoc(productRef, { stock: newStock });
      setEditingId(null);
      fetchSellerProducts();
    } catch (err) {
      console.error("Error updating stock:", err);
      setError("Failed to update stock");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    if (!db) {
      setError("Database not initialized. Please refresh the page.");
      return;
    }

    try {
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
      fetchSellerProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product");
    }
  };

  const handlePublishProduct = async (productId: string) => {
    if (!db) return;
    try {
      setError(null);
      await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), {
        status: "pending",
        isActive: false,
        requiresReview: true,
        updatedAt: Timestamp.now(),
      });
      await fetchSellerProducts();
    } catch (publishError) {
      console.error("Error publishing product:", publishError);
      setError(
        "We could not submit this product for review. Refresh your session and try again.",
      );
    }
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin">
          <div
            className="w-8 h-8 border-4 border-gray-300 rounded-full"
            style={{ borderTopColor: AppColors.primary }}
          />
        </div>
      </div>
    );
  }

  // Unauthorized
  if (!user || currentRole !== USER_ROLES.SELLER) {
    return null;
  }

  // Calculate statistics
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  return (
    <ProtectedRoute
      currentPath="/seller/products"
      requiredRoles={[USER_ROLES.SELLER]}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div
          className="py-8 border-b"
          style={{
            backgroundColor: AppColors.surface,
            borderColor: AppColors.border,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div>
              <h1
                style={{
                  ...AppTextStyles.h1,
                  color: AppColors.textPrimary,
                }}
              >
                My Products
              </h1>
              <p
                style={{
                  ...AppTextStyles.bodyLarge,
                  color: AppColors.textSecondary,
                }}
              >
                Manage your product listings and inventory
              </p>
            </div>
            <button
              onClick={() => router.push("/seller/products/add")}
              className="px-6 py-3 rounded-lg text-white font-bold transition-all hover:shadow-lg"
              style={{
                backgroundColor: AppColors.primary,
              }}
            >
              ➕ Add New Product
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto flex flex-col px-4 sm:px-6 lg:px-8 py-5">
        <form
          className="order-1 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row dark:border-slate-700 dark:bg-slate-800"
          onSubmit={(event) => {
            event.preventDefault();
            setSearchTerm(searchInput);
          }}
        >
          <label className="relative flex-1">
            <span className="sr-only">Search your uploaded products</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                if (!event.target.value) setSearchTerm("");
              }}
              placeholder="Search your products by name, category, or status"
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>
          <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 active:translate-y-0">
            <Search size={18} /> Search
          </button>
        </form>

        <div className="order-5 grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {/* Total Products */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.labelLarge,
                color: AppColors.textSecondary,
              }}
            >
              Products uploaded
            </p>
            <p
              style={{
                ...AppTextStyles.h2,
                color: AppColors.primary,
              }}
            >
              {totalProducts}
            </p>
          </div>

          {/* Total Stock */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.labelLarge,
                color: AppColors.textSecondary,
              }}
            >
              📊 Total Stock
            </p>
            <p
              style={{
                ...AppTextStyles.h2,
                color: AppColors.primary,
              }}
            >
              {totalStock.toLocaleString()}
            </p>
          </div>

          {/* Inventory Value */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.labelLarge,
                color: AppColors.textSecondary,
              }}
            >
              💰 Inventory Value
            </p>
            <p
              style={{
                ...AppTextStyles.h2,
                color: "#48BB78",
              }}
            >
              ₦{totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="order-2 mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg">
            {error}
          </div>
        )}

        <div className="order-3 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          <p className="font-bold">Your seller submission access is active.</p>
          <p className="mt-1">
            Every new listing is visible here immediately with its uploaded
            image, then enters verification before it can appear to members or
            institutional buyers. Approval updates this page in real time.
          </p>
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div
            className="order-4 mt-4 rounded-lg p-12 text-center border-2"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.h3,
                color: AppColors.textSecondary,
              }}
            >
              📭 No products yet
            </p>
            <p
              style={{
                ...AppTextStyles.bodyLarge,
                color: AppColors.textSecondary,
              }}
            >
              Start selling by adding your first product!
            </p>
          </div>
        )}

        {products.length > 0 && visibleProducts.length === 0 && (
          <div className="order-4 mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            No uploaded products match “{searchTerm}”.
          </div>
        )}

        {/* Products Table */}
        {visibleProducts.length > 0 && (
          <div
            className="order-4 mt-4 rounded-lg border-2 overflow-hidden"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      backgroundColor: AppColors.background,
                      borderBottom: `2px solid ${AppColors.border}`,
                    }}
                  >
                    <th
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textPrimary,
                      }}
                      className="px-6 py-4 text-left"
                    >
                      Product
                    </th>
                    <th
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textPrimary,
                      }}
                      className="px-6 py-4 text-left"
                    >
                      Category
                    </th>
                    <th
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textPrimary,
                      }}
                      className="px-6 py-4 text-right"
                    >
                      Price
                    </th>
                    <th
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textPrimary,
                      }}
                      className="px-6 py-4 text-center"
                    >
                      Stock
                    </th>
                    <th
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textPrimary,
                      }}
                      className="px-6 py-4 text-right"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: `1px solid ${AppColors.border}`,
                      }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {/* Product Name */}
                      <td className="px-6 py-4">
                        <div
                          className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                          onClick={() => router.push(`/products/${product.id}`)}
                        >
                          {(product.thumbnail || product.images?.[0]) && (
                            <Image
                              src={resolveProductImage(product.thumbnail || product.images?.[0])}
                              alt={product.name}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p
                              style={{
                                ...AppTextStyles.labelLarge,
                                color: AppColors.textPrimary,
                              }}
                            >
                              {product.name}
                            </p>
                            <p
                              style={{
                                ...AppTextStyles.bodySmall,
                                color: AppColors.textSecondary,
                              }}
                            >
                              {product.unit || "unit"}
                            </p>
                            <p className="text-xs font-medium capitalize text-slate-500">
                              {product.type || "retail"} listing · {product.stock} {product.unit || "units"} available
                            </p>
                            {product.activeOffer?.status !== "inactive" && product.activeOffer && (
                              <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                                {product.activeOffer.title} · -{product.activeOffer.discountPercentage}%
                              </span>
                            )}
                            <span
                              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                product.status === "live"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : product.status === "draft"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {product.status === "live"
                                ? "Live"
                                : product.status === "draft"
                                  ? "Draft"
                                  : product.status === "rejected"
                                    ? "Needs changes"
                                    : "Awaiting review"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <p
                          style={{
                            ...AppTextStyles.bodyMedium,
                            color: AppColors.textSecondary,
                            textTransform: "capitalize",
                          }}
                        >
                          {product.category}
                        </p>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-right">
                        <div>
                          <p
                            style={{
                              ...AppTextStyles.labelLarge,
                              color: AppColors.primary,
                            }}
                          >
                            ₦{product.price.toLocaleString()}
                          </p>
                          {product.discount && product.discount > 0 && (
                            <p
                              style={{
                                ...AppTextStyles.bodySmall,
                                color: "#E53E3E",
                              }}
                            >
                              -{product.discount}%
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4 text-center">
                        {editingId === product.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) =>
                                setEditStock(parseInt(e.target.value))
                              }
                              className="w-16 px-2 py-1 border rounded text-center"
                              style={{ borderColor: AppColors.primary }}
                            />
                            <button
                              onClick={() =>
                                handleUpdateStock(product.id, editStock)
                              }
                              className="px-3 py-1 rounded text-white text-sm font-bold"
                              style={{ backgroundColor: AppColors.primary }}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer px-4 py-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                            onClick={() => {
                              setEditingId(product.id);
                              setEditStock(product.stock);
                            }}
                          >
                            <p
                              style={{
                                ...AppTextStyles.labelLarge,
                                color:
                                  product.stock > 10
                                    ? "#48BB78"
                                    : product.stock > 0
                                      ? "#D69E2E"
                                      : "#E53E3E",
                              }}
                            >
                              {product.stock} {product.unit || "pcs"}
                            </p>
                            <p
                              style={{
                                ...AppTextStyles.bodySmall,
                                color: AppColors.textSecondary,
                              }}
                            >
                              Click to edit
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {product.status === "draft" && (
                            <button
                              onClick={() =>
                                void handlePublishProduct(product.id)
                              }
                              className="rounded bg-emerald-700 px-3 py-1 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-95"
                            >
                              Submit for review
                            </button>
                          )}
                          <button
                            onClick={() =>
                              router.push(`/seller/products/${product.id}/edit`)
                            }
                            className="px-3 py-1 rounded text-sm font-semibold transition-all duration-200 hover:bg-blue-50 active:scale-95"
                            style={{
                              borderColor: AppColors.primary,
                              color: AppColors.primary,
                              border: `2px solid ${AppColors.primary}`,
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-3 py-1 rounded text-sm font-semibold transition-all duration-200 hover:bg-red-600 active:scale-95 text-white"
                            style={{
                              backgroundColor: "#E53E3E",
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
