'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ProductForm {
  name: string;
  category: string;
  price: number;
  minimumOrder: number;
  quantity: number;
  description: string;
  images: File[];
  imagePreview: string[];
}

export default function SellerProductUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [product, setProduct] = useState<ProductForm>({
    name: '',
    category: '',
    price: 0,
    minimumOrder: 1,
    quantity: 0,
    description: '',
    images: [],
    imagePreview: [],
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!product.name.trim()) newErrors.name = 'Product name is required';
    if (!product.category) newErrors.category = 'Category is required';
    if (product.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (product.minimumOrder < 1) newErrors.minimumOrder = 'Minimum order must be at least 1';
    if (product.quantity <= 0) newErrors.quantity = 'Quantity is required';
    if (!product.description.trim()) newErrors.description = 'Description is required';
    if (product.imagePreview.length === 0) newErrors.images = 'At least one image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numValue = ['price', 'minimumOrder', 'quantity'].includes(name)
      ? parseFloat(value) || 0
      : value;

    setProduct((prev) => ({
      ...prev,
      [name]: numValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = 5;

    if (product.images.length + files.length > maxImages) {
      setErrors((prev) => ({
        ...prev,
        images: `Maximum ${maxImages} images allowed`,
      }));
      return;
    }

    const newImages = [...product.images, ...files];
    const previews = newImages.map((file) => URL.createObjectURL(file));

    setProduct((prev) => ({
      ...prev,
      images: newImages,
      imagePreview: previews,
    }));

    if (errors.images) {
      setErrors((prev) => ({
        ...prev,
        images: '',
      }));
    }
  };

  const removeImage = (idx: number) => {
    setProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
      imagePreview: prev.imagePreview.filter((_, i) => i !== idx),
    }));
  };

  const handlePublish = () => {
    if (validateForm()) {
      // TODO: Submit to backend
      alert('Product published! Awaiting approval from COOP team.');
      router.push('/seller/products');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-2xl hover:text-blue-600"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              📦 Upload Product
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Add a new product to sell on COOP Commerce
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          {[
            { num: 1, title: 'Basic Info' },
            { num: 2, title: 'Details' },
            { num: 3, title: 'Images' },
            { num: 4, title: 'Review' },
          ].map((s, idx) => (
            <div key={s.num} className="flex-1 flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s.num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <p
                className={`ml-3 text-sm font-medium ${
                  step >= s.num
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {s.title}
              </p>
              {idx < 3 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    step > s.num ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Basic Product Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Premium Milled Rice (25kg)"
                  className={`w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:text-white ${
                    errors.name
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={product.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:text-white ${
                      errors.category
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select a category</option>
                    <option value="grains">Grains & Cereals</option>
                    <option value="produce">Fresh Produce</option>
                    <option value="processed">Processed Foods</option>
                    <option value="spices">Spices & Seasonings</option>
                    <option value="honey">Honey & Bee Products</option>
                    <option value="textiles">Textiles & Fabrics</option>
                    <option value="crafts">Crafts & Artisan</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.category && (
                    <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price per Unit (₦) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={product.price || ''}
                    onChange={handleInputChange}
                    placeholder="5000"
                    className={`w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:text-white ${
                      errors.price
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.price && (
                    <p className="text-red-600 text-sm mt-1">{errors.price}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Product Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={product.quantity || ''}
                    onChange={handleInputChange}
                    placeholder="100"
                    className={`w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:text-white ${
                      errors.quantity
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.quantity && (
                    <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Order Quantity *
                  </label>
                  <input
                    type="number"
                    name="minimumOrder"
                    value={product.minimumOrder}
                    onChange={handleInputChange}
                    placeholder="1"
                    className={`w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:text-white ${
                      errors.minimumOrder
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.minimumOrder && (
                    <p className="text-red-600 text-sm mt-1">{errors.minimumOrder}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Description *
                </label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product, quality, sourcing, etc."
                  rows={6}
                  className={`w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:text-white ${
                    errors.description
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {product.description.length} / 500 characters
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Product Images
              </h2>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  errors.images
                    ? 'border-red-500 bg-red-50 dark:bg-red-900'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="images"
                />
                <label htmlFor="images" className="cursor-pointer block">
                  <p className="text-3xl mb-2">📸</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Drop images here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Upload up to 5 images. PNG, JPG, WebP. Max 10MB each.
                  </p>
                </label>
              </div>
              {errors.images && (
                <p className="text-red-600 text-sm">{errors.images}</p>
              )}

              {product.imagePreview.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Uploaded Images ({product.imagePreview.length}/5)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {product.imagePreview.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Review & Publish
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Product Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {product.name}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {product.category}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₦{product.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Stock</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {product.quantity} units
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Min Order</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {product.minimumOrder} units
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Description</p>
                  <p className="text-gray-900 dark:text-white">
                    {product.description}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Images ({product.imagePreview.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {product.imagePreview.map((preview, idx) => (
                      <img
                        key={idx}
                        src={preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Next:</strong> Your product will be reviewed by the COOP team within 24 hours. You'll receive an email when it's approved.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                step === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              ← Back
            </button>

            <button
              onClick={step === 4 ? handlePublish : () => setStep(step + 1)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {step === 4 ? '🚀 Publish Product' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
