"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Search, X } from "lucide-react";
import { useAuth } from "@/lib/auth/authContext";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase/config";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { COLLECTIONS, USER_ROLES } from "@/lib/constants/database";
import { AppColors, AppTextStyles } from "@/lib/theme";
import styles from "./animations.module.css";

const PRODUCT_CATEGORIES = [
  { id: "vegetables", name: "Vegetables", emoji: "🥬" },
  { id: "grains", name: "Grains & Cereals", emoji: "🌾" },
  { id: "fruits", name: "Fruits", emoji: "🍎" },
  { id: "oils", name: "Oils & Fats", emoji: "🫒" },
  { id: "spices", name: "Spices", emoji: "🌶️" },
  { id: "dairy", name: "Dairy & Eggs", emoji: "🥛" },
  { id: "proteins", name: "Proteins", emoji: "🥩" },
  { id: "beverages", name: "Beverages", emoji: "☕" },
];

type ProductForm = {
  name: string;
  description: string;
  price: string;
  wholesalePrice: string;
  originalPrice: string;
  category: string;
  stock: string;
  unit: string;
  productType: "retail" | "wholesale" | "both";
  wholesaleMinOrder: string;
  images: string[];
  thumbnail: string;
};

export default function AddProductPage() {
  const router = useRouter();
  const { user, loading, currentRole } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [confirmation, setConfirmation] = useState<{
    productId: string;
    status: "draft" | "pending";
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    description: "",
    price: "",
    wholesalePrice: "",
    originalPrice: "",
    category: "vegetables",
    stock: "",
    unit: "kg",
    productType: "retail",
    wholesaleMinOrder: "",
    images: [] as string[],
    thumbnail: "",
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const visibleCategories = useMemo(() => {
    const term = categoryFilter.trim().toLowerCase();
    if (!term) return PRODUCT_CATEGORIES;
    return PRODUCT_CATEGORIES.filter((category) =>
      `${category.name} ${category.id}`.toLowerCase().includes(term),
    );
  }, [categoryFilter]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const calculateDiscount = () => {
    const original = parseFloat(
      formData.originalPrice || formData.price || "0",
    );
    const price = parseFloat(formData.price || "0");

    if (
      !Number.isFinite(original) ||
      !Number.isFinite(price) ||
      original <= 0 ||
      price >= original
    ) {
      return 0;
    }

    return Math.round(((original - price) / original) * 100);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    } else if (!loading && user && currentRole !== USER_ROLES.SELLER) {
      router.push("/home");
    }
  }, [loading, user, currentRole, router]);

  // Require a real Firebase-authenticated user to use the backend for publishing/uploads.
  const canUseFirebaseBackend = Boolean(
    db && auth?.currentUser && auth.currentUser.uid === user?.uid,
  );

  const saveProduct = async (publish = false) => {
    if (!user) {
      setError("You must be logged in to save products");
      return;
    }

    const currentErrors: { [key: string]: string } = {};
    const priceValue = parseFloat(formData.price || "0");
    const stockValue = parseInt(formData.stock || "0", 10);
    const wholesalePriceValue = parseFloat(formData.wholesalePrice || "0");
    const wholesaleMinOrderValue = parseInt(
      formData.wholesaleMinOrder || "1",
      10,
    );

    if (!formData.name.trim()) currentErrors.name = "Product name is required";
    if (publish && formData.description.trim().length < 10) {
      currentErrors.description =
        "Add at least 10 characters before publishing";
    }
    if (!formData.category) currentErrors.category = "Select a category";
    if (!formData.price.trim() || priceValue <= 0)
      currentErrors.price = "Please enter a valid base price";
    if (!formData.stock.trim() || stockValue <= 0)
      currentErrors.stock = "Stock quantity must be greater than zero";
    if (!formData.unit) currentErrors.unit = "Please choose a unit measure";
    if (
      formData.productType !== "retail" &&
      (!formData.wholesalePrice.trim() || wholesalePriceValue <= 0)
    ) {
      currentErrors.wholesalePrice =
        "Wholesale price is required for wholesale products";
    }
    if (formData.productType !== "retail" && wholesaleMinOrderValue < 1) {
      currentErrors.wholesaleMinOrder =
        "Wholesale minimum order must be at least 1";
    }

    if (Object.keys(currentErrors).length > 0) {
      setFieldErrors(currentErrors);
      setError("Please fix the highlighted fields before saving");
      setSaveNotice(null);
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveNotice(null);

    try {
      const finalPriceValue = parseFloat(formData.price || "0");
      const finalWholesalePriceValue = parseFloat(
        formData.wholesalePrice || "0",
      );
      const finalOriginalPriceValue = formData.originalPrice.trim()
        ? parseFloat(formData.originalPrice)
        : finalPriceValue;
      const finalStockValue = parseInt(formData.stock || "0", 10);
      const finalWholesaleMinOrderValue = parseInt(
        formData.wholesaleMinOrder || "1",
        10,
      );

      const timestampValue = Timestamp.now();

      const newProduct = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        type: formData.productType,
        price: finalPriceValue,
        retailPrice: finalPriceValue,
        wholesalePrice:
          formData.productType !== "retail" && finalWholesalePriceValue > 0
            ? finalWholesalePriceValue
            : undefined,
        originalPrice: finalOriginalPriceValue,
        discount: calculateDiscount(),
        minOrderQuantity:
          formData.productType !== "retail" ? finalWholesaleMinOrderValue : 1,
        stock: finalStockValue,
        unit: formData.unit,
        maxOrder: 100,
        status: publish ? "pending" : "draft",
        images: formData.images.length > 0
          ? Array.from(new Set(formData.images))
          : formData.thumbnail
            ? [formData.thumbnail]
            : ["/images/Groceries1.png"],
        thumbnail: formData.thumbnail || "/images/Groceries1.png",
        sellerId: user.uid,
        sellerName: user.displayName || "Seller",
        ownershipType: "seller",
        rating: 4.5,
        reviews: 0,
        isFeatured: false,
        isActive: false,
        requiresReview: publish,
        createdAt: timestampValue,
        updatedAt: timestampValue,
      };

      const sanitizedProduct = Object.fromEntries(
        Object.entries(newProduct).filter(([, v]) => v !== undefined),
      );

      const saveProductDirectly = async () => {
        const fallbackProduct = {
          ...sanitizedProduct,
          status: publish ? "pending" : "draft",
          isActive: false,
          isFeatured: false,
          sellerVerified: false,
          requiresReview: publish,
          rating: 0,
          reviews: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        } as Record<string, unknown>;
        delete fallbackProduct.publishedAt;

        const fallbackRef = await addDoc(
          collection(db, COLLECTIONS.PRODUCTS),
          fallbackProduct,
        );
        setConfirmation({
          productId: fallbackRef.id,
          status: publish ? "pending" : "draft",
          message: publish
            ? "Your product has been submitted and is currently under verification."
            : "Your product has been saved as a draft.",
        });
      };

      if (!canUseFirebaseBackend) {
        setError(
          "Firebase sign-in is required to save products. Please sign in and try again.",
        );
        return;
      }

      try {
        const currentUser = auth.currentUser;
        const idToken = currentUser ? await currentUser.getIdToken() : null;
        if (!idToken) throw new Error("Missing auth token");

        let resp: Response;
        try {
          resp = await fetch("/api/products/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(sanitizedProduct),
          });
        } catch (networkError) {
          console.warn(
            "Product API unavailable; using the secure seller fallback.",
            networkError,
          );
          await saveProductDirectly();
          return;
        }

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          if (resp.status >= 500) {
            await saveProductDirectly();
            return;
          }
          throw new Error(body?.error || `Server error: ${resp.status}`);
        }

        const json = await resp.json();
        setConfirmation({
          productId: String(json.id),
          status: json.status === "draft" ? "draft" : "pending",
          message: json.message || (publish
            ? "Your product has been submitted and is currently under verification."
            : "Your product has been saved as a draft."),
        });
        return;
      } catch (apiErr) {
        console.error("Server-side product save failed:", apiErr);
        throw apiErr;
      }
    } catch (err) {
      console.error("Error saving product:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save product";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelected = async (file?: File) => {
    if (!file) return;
    if (!user) {
      setUploadError("You must be logged in to upload images");
      return;
    }

    if (!storage || !auth) {
      setUploadError("Storage is not configured in this environment");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Choose a JPG, PNG, WEBP, or another image file.");
      return;
    }

    if (file.size >= 10 * 1024 * 1024) {
      setUploadError("The image must be smaller than 10 MB.");
      return;
    }

    const isRealAuth = auth?.currentUser && auth.currentUser.uid === user.uid;

    if (!isRealAuth) {
      setUploadError(
        "Image upload requires a real Firebase sign-in. Please sign in and try again.",
      );
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Ensure auth token is fresh before upload
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error(
          "User authentication lost. Please refresh and try again.",
        );
      }

      // Force token refresh to ensure it's valid for Cloud Storage
      const idToken = await currentUser.getIdToken(true);
      if (!idToken) {
        throw new Error(
          "Your upload session could not be refreshed. Sign in again and retry.",
        );
      }

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `product-images/${currentUser.uid}/${Date.now()}_${safeFileName}`;

      // Log for debugging
      console.log("[Image Upload] Path:", path);
      console.log("[Image Upload] Auth UID:", currentUser.uid);
      console.log("[Image Upload] File:", file.name, "|", file.size, "bytes");

      const ref = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(ref, file);

      await new Promise<void>((resolve, reject) => {
        let timedOut = false;
        const timeoutId = window.setTimeout(() => {
          timedOut = true;
          uploadTask.cancel();
        }, 60_000);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            );
            setUploadProgress(percent);
          },
          (err) => {
            window.clearTimeout(timeoutId);
            if (timedOut) {
              reject(
                new Error(
                  "The image upload timed out. Check your connection and try again.",
                ),
              );
              return;
            }
            console.error("[Image Upload] Error during upload:", err);
            setUploadError(err instanceof Error ? err.message : String(err));
            setIsUploading(false);
            reject(err);
          },
          async () => {
            window.clearTimeout(timeoutId);
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("[Image Upload] Success! URL:", url);

              setFormData((prev) => ({
                ...prev,
                thumbnail: url,
                images:
                  prev.images && prev.images.length > 0
                    ? [url, ...prev.images]
                    : [url],
              }));
              setIsUploading(false);
              setUploadProgress(100);
              resolve();
            } catch (getUrlErr) {
              console.error(
                "[Image Upload] Error getting download URL:",
                getUrlErr,
              );
              reject(getUrlErr);
            }
          },
        );
      });
    } catch (err: unknown) {
      console.error("[Image Upload] Caught error:", err);

      const errorCode =
        typeof err === "object" && err !== null && "code" in err
          ? String(err.code)
          : "";
      if (errorCode === "storage/unauthorized") {
        setUploadError(
          "Your upload session could not be verified. Refresh the page and sign in again. Seller approval is not required to upload product images.",
        );
      } else if (errorCode === "storage/object-not-found") {
        setUploadError(
          "Storage bucket not found. Please check your Firebase configuration.",
        );
      } else if (errorCode === "storage/invalid-argument") {
        setUploadError(
          "Invalid file or path. Please try with a different image.",
        );
      } else if (typeof err === "string") {
        setUploadError(err);
      } else if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError("Unable to upload image. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ProtectedRoute
      currentPath="/seller/products/add"
      requiredRoles={[USER_ROLES.SELLER]}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 mb-4 font-semibold"
            >
              ← Back to Products
            </button>
            <h1 style={{ ...AppTextStyles.h1, color: AppColors.textPrimary }}>
              Add New Product
            </h1>
            <p
              style={{
                ...AppTextStyles.bodyLarge,
                color: AppColors.textSecondary,
              }}
            >
              List a new product for sale. Fill in all details below.
            </p>
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <p className="font-bold">All new listings are reviewed before going live.</p>
              <p className="mt-1">
                Submit for Verification sends the listing to the admin review
                queue. Retail products appear to members after approval,
                wholesale products appear to institutional buyers, and listings
                marked both appear in both marketplaces.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {saveNotice && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg">
              {saveNotice}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveProduct(false);
            }}
            className={`${styles.formContainer} space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-8`}
          >
            {/* Product Name */}
            <div className={styles.formGroup}>
              <label
                style={{
                  ...AppTextStyles.labelLarge,
                  color: AppColors.textPrimary,
                }}
              >
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Fresh Tomatoes (1kg)"
                className={`${styles.input} w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 ${
                  fieldErrors.name ? styles.inputError : ""
                }`}
                style={{
                  borderColor: fieldErrors.name ? "#dc2626" : AppColors.border,
                }}
                required
              />
              {fieldErrors.name && (
                <p className={styles.fieldErrorText}>{fieldErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label
                style={{
                  ...AppTextStyles.labelLarge,
                  color: AppColors.textPrimary,
                }}
              >
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your product, quality, origin, uses..."
                className={`${styles.input} w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 h-24 resize-none`}
                style={{
                  borderColor: AppColors.border,
                }}
              />
              {fieldErrors.description && (
                <p className={styles.fieldErrorText}>
                  {fieldErrors.description}
                </p>
              )}
            </div>

            {/* Category */}
            <div className={styles.formGroup}>
              <label
                style={{
                  ...AppTextStyles.labelLarge,
                  color: AppColors.textPrimary,
                }}
              >
                Category *
              </label>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <label className="relative block">
                  <span className="sr-only">Search product categories</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="search"
                    value={categoryQuery}
                    onChange={(event) => setCategoryQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        setCategoryFilter(categoryQuery);
                      }
                    }}
                    placeholder="Search categories"
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setCategoryFilter(categoryQuery)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 active:translate-y-0"
                >
                  <Search size={17} /> Search
                </button>
              </div>
              <div className="relative mt-3">
                <select
                  value={formData.category}
                  onChange={(event) => handleInputChange("category", event.target.value)}
                  className="w-full appearance-none rounded-xl border-2 border-slate-200 bg-white px-4 py-3 pr-10 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {visibleCategories.length > 0 ? visibleCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  )) : (
                    <option value={formData.category}>No matching category</option>
                  )}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">▼</span>
              </div>
              {categoryFilter && (
                <button
                  type="button"
                  onClick={() => { setCategoryFilter(""); setCategoryQuery(""); }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 transition hover:text-emerald-950"
                >
                  <X size={14} /> Clear category search
                </button>
              )}
              {fieldErrors.category && <p className={styles.fieldErrorText}>{fieldErrors.category}</p>}
            </div>

            {/* Product Type */}
            <div className={styles.formGroup}>
              <label
                style={{
                  ...AppTextStyles.labelLarge,
                  color: AppColors.textPrimary,
                }}
              >
                Listing Type *
              </label>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[
                  {
                    id: "retail",
                    label: "Retail",
                    description: "Sell to all consumers",
                  },
                  {
                    id: "wholesale",
                    label: "Wholesale",
                    description: "Bulk buyers only",
                  },
                  {
                    id: "both",
                    label: "Both",
                    description: "Retail + wholesale",
                  },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleInputChange("productType", option.id)}
                    className={`${styles.typeButton} p-4 rounded-lg border-2 text-left transition-all ${
                      formData.productType === option.id
                        ? `${styles.typeButtonSelected} border-emerald-600`
                        : "border-gray-300 dark:border-gray-600 hover:border-emerald-300"
                    }`}
                  >
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Section */}
            <div className={`${styles.formGroup} grid grid-cols-2 gap-4`}>
              <div>
                <label
                  style={{
                    ...AppTextStyles.labelLarge,
                    color: AppColors.textPrimary,
                  }}
                >
                  Price per unit (₦) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="Enter price"
                  min="1"
                  step="1"
                  className={`${styles.input} w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none transition duration-200 focus:ring-2 ${
                    fieldErrors.price
                      ? styles.inputError
                      : "focus:border-blue-500"
                  }`}
                  style={{
                    borderColor: fieldErrors.price
                      ? "#dc2626"
                      : AppColors.border,
                  }}
                  required
                />
                {fieldErrors.price && (
                  <p className={styles.fieldErrorText}>{fieldErrors.price}</p>
                )}
              </div>

              <div>
                <label
                  style={{
                    ...AppTextStyles.labelLarge,
                    color: AppColors.textPrimary,
                  }}
                >
                  Original Price (₦)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.originalPrice}
                  onChange={(e) =>
                    handleInputChange("originalPrice", e.target.value)
                  }
                  placeholder="Leave blank if no discount"
                  min="0"
                  className="w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2"
                  style={{
                    borderColor: AppColors.border,
                  }}
                />
              </div>
            </div>

            {(formData.productType === "wholesale" ||
              formData.productType === "both") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    style={{
                      ...AppTextStyles.labelLarge,
                      color: AppColors.textPrimary,
                    }}
                  >
                    Wholesale Price (₦) *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.wholesalePrice}
                    onChange={(e) =>
                      handleInputChange("wholesalePrice", e.target.value)
                    }
                    placeholder="Enter wholesale price"
                    min="0"
                    className="w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2"
                    style={{
                      borderColor: AppColors.border,
                    }}
                    required
                  />
                  {fieldErrors.wholesalePrice && (
                    <p className="text-red-600 text-sm mt-1">
                      {fieldErrors.wholesalePrice}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    style={{
                      ...AppTextStyles.labelLarge,
                      color: AppColors.textPrimary,
                    }}
                  >
                    Wholesale MOQ *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.wholesaleMinOrder}
                    onChange={(e) =>
                      handleInputChange("wholesaleMinOrder", e.target.value)
                    }
                    placeholder="Minimum order"
                    min="1"
                    className="w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2"
                    style={{
                      borderColor: AppColors.border,
                    }}
                    required
                  />
                  {fieldErrors.wholesaleMinOrder && (
                    <p className="text-red-600 text-sm mt-1">
                      {fieldErrors.wholesaleMinOrder}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Discount Display */}
            {calculateDiscount() > 0 && (
              <div
                className="p-4 rounded-lg text-white font-bold text-center"
                style={{ backgroundColor: "#E53E3E" }}
              >
                🎉 Discount: {calculateDiscount()}% off (Saves ₦
                {(() => {
                  const original = parseFloat(
                    formData.originalPrice || formData.price || "0",
                  );
                  const price = parseFloat(formData.price || "0");
                  const savings =
                    Number.isFinite(original) && Number.isFinite(price)
                      ? original - price
                      : 0;
                  return savings.toLocaleString();
                })()}
                )
              </div>
            )}

            {/* Stock & Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  style={{
                    ...AppTextStyles.labelLarge,
                    color: AppColors.textPrimary,
                  }}
                >
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.stock}
                  onChange={(e) => handleInputChange("stock", e.target.value)}
                  placeholder="Enter quantity"
                  min="1"
                  className="w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 transition duration-200"
                  style={{
                    borderColor: AppColors.border,
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    ...AppTextStyles.labelLarge,
                    color: AppColors.textPrimary,
                  }}
                >
                  Unit *
                </label>
                <div className="relative mt-2">
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange("unit", e.target.value)}
                    className="w-full appearance-none pr-10 bg-white dark:bg-gray-900 mt-0 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 focus:border-blue-500 transition duration-200"
                    style={{
                      borderColor: AppColors.border,
                      color: AppColors.textPrimary,
                    }}
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="liter">Liters (L)</option>
                    <option value="pack">Pack</option>
                    <option value="dozen">Dozen</option>
                    <option value="bundle">Bundle</option>
                    <option value="piece">Piece</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">
                    ▼
                  </span>
                </div>
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label
                style={{
                  ...AppTextStyles.labelLarge,
                  color: AppColors.textPrimary,
                }}
              >
                Product Image URL
              </label>
              <input
                type="url"
                value={formData.thumbnail}
                onChange={(e) => handleInputChange("thumbnail", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2"
                style={{
                  borderColor: AppColors.border,
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Uploaded images are stored with this listing and remain visible while it is under verification.
              </p>

              <div className="mt-3">
                <label
                  className="text-sm font-medium"
                  style={{ color: AppColors.textPrimary }}
                >
                  Or upload an image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) handleFileSelected(file);
                  }}
                  className="mt-2"
                />

                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2 overflow-hidden">
                    <div
                      className="h-3 bg-emerald-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                {uploadError && (
                  <p className="text-red-600 text-sm mt-2">{uploadError}</p>
                )}
              </div>

              <div className="mt-4 rounded-2xl overflow-hidden border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                {formData.thumbnail ? (
                  <img
                    src={formData.thumbnail}
                    alt="Product preview"
                    className="w-full h-56 object-cover"
                    onError={(event) => {
                      const target = event.currentTarget as HTMLImageElement;
                      target.src = "/images/Groceries1.png";
                    }}
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center px-4 text-sm text-gray-500 dark:text-gray-400">
                    Upload an image or paste a valid image URL to preview the exact image buyers will see.
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={() => router.push("/seller/products")}
                disabled={isSaving || isUploading}
                className={`${styles.cancelButton} flex-1 px-4 py-3 rounded-lg border-2 font-bold transition-all`}
                style={{
                  borderColor: AppColors.primary,
                  color: AppColors.primary,
                  opacity: isSaving || isUploading ? 0.5 : 1,
                  cursor: isSaving || isUploading ? "not-allowed" : "pointer",
                }}
              >
                ← Cancel
              </button>
              <button
                type="button"
                onClick={() => saveProduct(false)}
                disabled={isSaving || isUploading}
                className={`${styles.submitButton} flex-1 px-4 py-3 rounded-lg text-white font-bold transition-all`}
                style={{
                  backgroundColor: AppColors.primary,
                  opacity: isSaving || isUploading ? 0.7 : 1,
                  cursor: isSaving || isUploading ? "not-allowed" : "pointer",
                }}
              >
                {isSaving
                  ? "⏳ Saving to Draft…"
                  : isUploading
                    ? "📤 Uploading…"
                    : "✅ Save as Draft"}
              </button>
              <button
                type="button"
                onClick={() => saveProduct(true)}
                disabled={isSaving || isUploading}
                className={`${styles.submitButton} flex-1 px-4 py-3 rounded-lg text-white font-bold transition-all`}
                style={{
                  backgroundColor: "#0ea5a4",
                  opacity: isSaving || isUploading ? 0.7 : 1,
                  cursor: isSaving || isUploading ? "not-allowed" : "pointer",
                }}
              >
                {isSaving
                  ? "Submitting..."
                  : isUploading
                    ? "Uploading..."
                    : "Submit for Verification"}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900 rounded-lg border-2 border-blue-200 dark:border-blue-700">
            <h3
              style={{ ...AppTextStyles.h4, color: AppColors.primary }}
              className="mb-3"
            >
              💡 Tips for Selling Success
            </h3>
            <ul
              className="space-y-2 text-sm"
              style={{ color: AppColors.textSecondary }}
            >
              <li>✓ Use clear, descriptive product names</li>
              <li>✓ Highlight quality, origin, and uses in description</li>
              <li>✓ Set competitive prices compared to market</li>
              <li>✓ Offer discounts to attract more buyers</li>
              <li>✓ Keep stock levels accurate</li>
              <li>✓ Update your products regularly</li>
            </ul>
          </div>
        </div>

        {confirmation && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-confirmation-title"
          >
            <div className={`${styles.successModal} w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-2xl sm:p-8`}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={36} strokeWidth={2.2} />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                {confirmation.status === "pending" ? "Submission received" : "Draft saved"}
              </p>
              <h2 id="product-confirmation-title" className="mt-2 text-2xl font-black text-slate-950">
                {confirmation.status === "pending" ? "Your product is under verification" : "Your product draft is ready"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{confirmation.message}</p>
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
                Reference: {confirmation.productId}
              </p>
              <button
                type="button"
                onClick={() => router.push("/seller/products")}
                className="mt-6 min-h-12 w-full rounded-xl bg-emerald-700 px-5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg active:translate-y-0"
              >
                View My Products
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
