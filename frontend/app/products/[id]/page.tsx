"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import CustomerHeader from "@/components/CustomerHeader";
import { useCartStore } from "@/lib/cartStore";
import {
  Heart,
  ShoppingCart,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  MessageSquare,
  Tag,
  Share2,
  Info,
  X,
  Plus,
  Minus,
  Check,
  AlertCircle
} from "lucide-react";

interface Variant {
  id: string;
  sku?: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stock?: number;
  active?: boolean;
  attributes?: Record<string, string>;
  image?: string;
}

interface Product {
  id: string;
  sku?: string;
  title: string;
  name?: string;
  brand?: string;
  category: string;
  subcategory?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  mrp?: number;
  discount?: number;
  stock?: number;
  inStock?: boolean;
  stockStatus?: string;
  image?: string;
  images?: string[];
  specs?: Record<string, any>;
  attributes?: Record<string, any>;
  variants?: Variant[];
  hasVariants?: boolean;
  rating?: number;
  reviewsCount?: number;
  warrantyText?: string;
  warrantyDuration?: string;
  returnPolicyText?: string;
  deliveryEstimate?: string;
  sellerName?: string;
  sellerId?: string;
  sellerRating?: number;
  offers?: any[];
  condition?: string;
}

export default function ProductDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();
  const pathname = usePathname() || "";
  const isCustomerRoute = pathname.startsWith("/customer");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Gallery state
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Variant state
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedRam, setSelectedRam] = useState<string>("");
  const [selectedStorage, setSelectedStorage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Purchase state
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCustomerAuthenticated, setIsCustomerAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);

  // Offer code state
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [availableOffers, setAvailableOffers] = useState<any[]>([]);
  const [protectionPlans, setProtectionPlans] = useState<any[]>([]);

  // Ask Seller Modal
  const [isAskSellerOpen, setIsAskSellerOpen] = useState(false);
  const [sellerMessage, setSellerMessage] = useState("");
  const [sellerMsgSent, setSellerMsgSent] = useState(false);
  const [sellerMsgError, setSellerMsgError] = useState("");

  // Reviews state
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(4.5);
  const [totalReviewsCount, setTotalReviewsCount] = useState(12);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState("");
  const [reviewCity, setReviewCity] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Service / Protection Plans
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Similar Products
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  const addItemToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const setCartOfferCode = useCartStore((s) => s.setAppliedOfferCode);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/offers")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load offers.");
        if (!cancelled) setAvailableOffers(data.offers || []);
      })
      .catch((error) => console.error("Failed to load product offers:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/protection-plans")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load protection plans.");
        if (!cancelled) setProtectionPlans(data.plans || []);
      })
      .catch((error) => console.error("Failed to load protection plans:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  const redirectToSignIn = () => {
    const next = `${pathname}${window.location.search}`;
    router.push(`/customer/signin?next=${encodeURIComponent(next)}`);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadCustomerFavorites() {
      try {
        const res = await fetch("/api/customer/favorites");
        if (cancelled) return;
        setIsCustomerAuthenticated(res.ok);
        if (res.ok) {
          const data = await res.json();
          setIsWishlisted(
            Array.isArray(data.favorites) &&
              data.favorites.some((favorite: Product) => favorite.id === productId)
          );
        }
      } catch (err) {
        console.error("Failed to check customer sign-in status.", err);
        if (!cancelled) setIsCustomerAuthenticated(false);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    }

    loadCustomerFavorites();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // 1. Load Product Data
  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/products/${productId}`);
        const data = await res.json();

        if (!res.ok || !data.product) {
          setError(data.error || "Product not found or currently unavailable.");
          setLoading(false);
          return;
        }

        const prod: Product = data.product;
        const configuredVariants = Array.isArray(prod.variants) ? prod.variants : [];
        const activeVariants = configuredVariants.filter((variant) => variant.active !== false);
        const customerProduct: Product = {
          ...prod,
          variants: activeVariants,
          hasVariants: configuredVariants.length > 0,
        };
        setProduct(customerProduct);

        // Images set
        const imagesList = Array.isArray(customerProduct.images) && customerProduct.images.length > 0
          ? customerProduct.images
          : [customerProduct.image || "/images/poster-products.png"];
        setSelectedImage(imagesList[0]);

        // Variants initialization
        if (activeVariants.length > 0) {
          const first = activeVariants[0];
          setSelectedVariant(first);
          if (first.name) {
            if (first.name.includes("GB") || first.name.includes("TB")) {
              if (first.name.includes("RAM")) setSelectedRam(first.name);
              else setSelectedStorage(first.name);
            }
          }
        }

        // Fetch Similar Products
        try {
          const listRes = await fetch("/api/public/products");
          const listData = await listRes.json();
          const allProds: Product[] = Array.isArray(listData) ? listData : (listData.products || []);
          const matched = allProds.filter(
            (p) => p.id !== customerProduct.id && p.category === customerProduct.category
          ).slice(0, 4);
          setSimilarProducts(matched);
        } catch (err) {
          // Graceful fallback
        }

        // Fetch Reviews
        try {
          const revRes = await fetch("/api/reviews");
          const revData = await revRes.json();
          if (revData.reviews) {
            setReviewsList(revData.reviews);
            setTotalReviewsCount(revData.totalCount || revData.reviews.length);
            setAverageRating(revData.averageRating || 4.5);
          }
        } catch (err) {
          // Graceful fallback
        }

      } catch (err: any) {
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  // Wishlist Toggle
  const toggleWishlist = async () => {
    if (!product) return;
    if (!authChecked) return;
    if (!isCustomerAuthenticated) {
      redirectToSignIn();
      return;
    }

    const nextState = !isWishlisted;

    try {
      const res = await fetch("/api/customer/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.status === 401) {
        redirectToSignIn();
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to update your wishlist.");
      }
      setIsWishlisted(nextState);
    } catch (err) {
      console.error("Wishlist update failed.", err);
    }
  };

  // Pincode Check
  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length < 6) {
      setPincodeStatus("Please enter a valid 6-digit pincode.");
      return;
    }
    const clean = pincode.trim();
    if (clean.startsWith("56") || clean.startsWith("57") || clean.startsWith("58")) {
      setPincodeStatus("⚡ Express Delivery Available (1–2 Days in Karnataka)");
    } else {
      setPincodeStatus("✓ Standard Delivery Available (3–5 Business Days)");
    }
  };

  // Coupon Code Validation
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const currentPrice = selectedVariant ? selectedVariant.price : (product?.price || 0);
      const res = await fetch("/api/offers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerCode: couponCode.trim(),
          cartItems: [{ productId: product?.id, price: currentPrice }],
          subtotalAmount: currentPrice * quantity,
        }),
      });

      const data = await res.json();
      if (data.valid) {
        const discountAmount = Number(data.discountAmount) || 0;
        const appliedCode = data.offer?.code || couponCode.trim().toUpperCase();
        setCartOfferCode(appliedCode);
        setAppliedDiscount(discountAmount);
        setCouponMessage({
          type: "success",
          text: `Coupon ${appliedCode} validated and saved for checkout. Current savings: ₹${discountAmount.toLocaleString("en-IN")}.`,
        });
      } else {
        setCartOfferCode("");
        setAppliedDiscount(0);
        setCouponMessage({
          type: "error",
          text: data.error || "Invalid or expired coupon code.",
        });
      }
    } catch (err) {
      setCartOfferCode("");
      setCouponMessage({ type: "error", text: "Failed to validate coupon code." });
    }
  };

  // Ask Seller Form Submit
  const handleAskSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerMessage.trim()) return;
    if (!authChecked) return;
    if (!isCustomerAuthenticated) {
      redirectToSignIn();
      return;
    }

    try {
      setSellerMsgError("");
      const res = await fetch("/api/customer/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Enquiry for ${product?.title}`,
          message: `[Product ID: ${product?.id}] ${sellerMessage.trim()}`,
          recipient: product?.sellerId || "seller",
        }),
      });

      if (res.ok) {
        setSellerMsgSent(true);
        setTimeout(() => {
          setIsAskSellerOpen(false);
          setSellerMsgSent(false);
          setSellerMessage("");
        }, 2000);
      } else {
        if (res.status === 401) {
          redirectToSignIn();
          return;
        }
        const d = await res.json();
        setSellerMsgError(d.error || "Failed to send seller enquiry.");
      }
    } catch (err) {
      setSellerMsgError("Network error. Please try again.");
    }
  };

  // Add Review Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewText.trim()) return;

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: reviewName.trim(),
          city: reviewCity.trim() || "Bengaluru",
          rating: reviewRating,
          review_message: reviewText.trim(),
          product_purchased: product?.title,
          source: "product_page",
        }),
      });

      if (res.ok) {
        setReviewSuccess(true);
        setTimeout(() => {
          setShowReviewForm(false);
          setReviewSuccess(false);
          setReviewName("");
          setReviewText("");
        }, 2000);
      }
    } catch (err) {
      // Graceful error handle
    }
  };

  // Add to Cart Action
  const handleAddToCart = () => {
    if (!product) return false;
    if (product.hasVariants && !selectedVariant) {
      alert(product.variants?.length
        ? "Choose an active product configuration before adding it to your cart."
        : "This product has no active configurations available.");
      return false;
    }
    const availableStock = selectedVariant?.stock ?? product.stock ?? 10;
    if (availableStock < 1 || quantity > availableStock) {
      alert("The selected configuration does not have enough stock for this quantity.");
      return false;
    }
    const finalPrice = selectedVariant ? selectedVariant.price : product.price;
    const variantTitle = selectedVariant ? ` (${selectedVariant.name})` : "";

    addItemToCart({
      id: product.id,
      title: `${product.title}${variantTitle}`,
      price: finalPrice,
      image: selectedImage || product.image || "/images/poster-products.png",
      category: product.category,
      variantId: selectedVariant?.id,
      variantSku: selectedVariant?.sku,
      variantName: selectedVariant?.name,
    });
    openCart();
    return true;
  };

  // Buy Now Action
  const handleBuyNow = () => {
    if (!product) return;
    if (product.hasVariants && !selectedVariant) {
      alert(product.variants?.length
        ? "Choose an active product configuration before purchasing."
        : "This product has no active configurations available.");
      return;
    }
    const availableStock = selectedVariant?.stock ?? product.stock ?? 10;
    if (availableStock < 1 || quantity > availableStock) {
      alert("The selected configuration does not have enough stock for this quantity.");
      return;
    }
    const finalPrice = selectedVariant ? selectedVariant.price : product.price;
    const variantTitle = selectedVariant ? ` (${selectedVariant.name})` : "";

    addItemToCart({
      id: product.id,
      title: `${product.title}${variantTitle}`,
      price: finalPrice,
      image: selectedImage || product.image || "/images/poster-products.png",
      category: product.category,
      variantId: selectedVariant?.id,
      variantSku: selectedVariant?.sku,
      variantName: selectedVariant?.name,
    });

    if (!isCustomerAuthenticated) {
      router.push(`/customer/signin?next=${encodeURIComponent("/checkout")}`);
    } else {
      router.push("/checkout");
    }
  };

  const handleAskSellerClick = () => {
    if (!authChecked) return;
    if (!isCustomerAuthenticated) {
      redirectToSignIn();
      return;
    }
    setIsAskSellerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB]">
        {!isCustomerRoute && <CustomerHeader />}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 space-y-4">
                <div className="h-96 bg-slate-200 rounded-2xl"></div>
                <div className="flex space-x-3">
                  <div className="h-20 w-20 bg-slate-200 rounded-xl"></div>
                  <div className="h-20 w-20 bg-slate-200 rounded-xl"></div>
                  <div className="h-20 w-20 bg-slate-200 rounded-xl"></div>
                </div>
              </div>
              <div className="lg:col-span-6 space-y-6">
                <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                <div className="h-12 bg-slate-200 rounded w-1/3"></div>
                <div className="h-24 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F5F7FB]">
        {!isCustomerRoute && <CustomerHeader />}
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Unavailable</h1>
          <p className="text-slate-600 mb-6">{error || "The product you are looking for could not be found."}</p>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Price calculations
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayMrp = selectedVariant?.compareAtPrice || product.compareAtPrice || product.mrp || Math.round(displayPrice * 1.35);
  const discountPercent = product.discount || Math.round(((displayMrp - displayPrice) / displayMrp) * 100);
  const displayStock = product.hasVariants && product.variants?.length === 0
    ? 0
    : selectedVariant?.stock ?? product.stock ?? 10;

  // Gallery list
  const galleryImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image || "/images/poster-products.png"];

  // Specs map
  const specMap: Record<string, any> = product.specs || product.attributes || {};
  const isLaptop = product.category.toLowerCase().includes("laptop");
  const isSsd = product.category.toLowerCase().includes("storage") || product.category.toLowerCase().includes("ssd");

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900 pb-20">
      {!isCustomerRoute && <CustomerHeader />}

      {/* BREADCRUMB */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500 overflow-x-auto whitespace-nowrap">
          <Link href="/customer" className="hover:text-[#2563EB] transition">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
          <Link href="/products" className="hover:text-[#2563EB] transition">Products</Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
          <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-[#2563EB] transition capitalize">
            {product.category}
          </Link>
          {product.brand && (
            <>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              <span className="text-slate-600 font-medium">{product.brand}</span>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
          <span className="text-slate-900 font-medium truncate max-w-[200px] sm:max-w-xs">{product.title}</span>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: GALLERY */}
          <div className="lg:col-span-6 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm sticky top-24">
            <div className="relative aspect-square w-full bg-slate-50 rounded-xl overflow-hidden mb-4 group flex items-center justify-center border border-slate-100">
              <Image
                src={selectedImage || "/images/poster-products.png"}
                alt={product.title || product.name || "Product"}
                fill
                priority
                className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                onError={() => setSelectedImage("/images/poster-products.png")}
              />

              {/* Wishlist Floating Button */}
              <button
                onClick={toggleWishlist}
                aria-label="Toggle Wishlist"
                className={`absolute top-4 right-4 p-3 rounded-full shadow-md transition-all z-10 ${
                  isWishlisted
                    ? "bg-red-50 text-red-500 scale-110"
                    : "bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white"
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-500" : ""}`} />
              </button>

              {/* Zoom Lightbox Trigger */}
              <button
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-4 right-4 p-2.5 bg-white/90 rounded-xl shadow text-slate-600 hover:text-[#2563EB] transition opacity-0 group-hover:opacity-100"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>

            {/* Gallery Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 flex-shrink-0 overflow-hidden bg-slate-50 p-1 transition ${
                      selectedImage === img
                        ? "border-[#2563EB] ring-2 ring-blue-100"
                        : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: PURCHASE PANEL */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              {/* Brand & Stock Pill */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-blue-50 text-[#2563EB] text-xs font-bold uppercase tracking-wider rounded-md">
                  {product.brand || "NexLapTech Original"}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 ${
                    displayStock > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    displayStock > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                  }`}></span>
                  <span>{displayStock > 0 ? `${displayStock} In Stock` : "Out of Stock"}</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {product.title}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center bg-emerald-600 text-white px-2.5 py-0.5 rounded-md font-bold text-xs space-x-1">
                  <span>{averageRating}</span>
                  <Star className="w-3 h-3 fill-white" />
                </div>
                <span className="text-slate-500 font-medium">
                  {totalReviewsCount} Ratings & Verified Reviews
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-600 text-xs font-semibold flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  NexLapTech Assured
                </span>
              </div>

              {/* PRICE DISPLAY */}
              <div className="pt-2 border-t border-slate-100 flex items-baseline space-x-3">
                <span className="text-3xl font-extrabold text-slate-900">
                  ₹{displayPrice.toLocaleString("en-IN")}
                </span>
                {displayMrp > displayPrice && (
                  <>
                    <span className="text-base text-slate-400 line-through">
                      ₹{displayMrp.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500">Inclusive of all taxes & GST invoice options available</p>

              {/* VARIANTS PICKER */}
              {product.hasVariants && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Configuration Options
                  </label>
                  {product.variants?.length === 0 && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">No active configurations are currently available.</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(product.variants || []).map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const isAvailable = (variant.stock ?? product.stock ?? 10) > 0;

                      return (
                        <button
                          key={variant.id}
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedVariant(variant);
                              setQuantity(1);
                              setSelectedImage(variant.image || product.image || "/images/poster-products.png");
                            }
                          }}
                          disabled={!isAvailable}
                          className={`p-3 rounded-xl text-left border transition relative flex flex-col justify-between ${
                            isSelected
                              ? "border-[#2563EB] bg-blue-50/50 ring-2 ring-blue-500/20"
                              : isAvailable
                              ? "border-slate-200 bg-white hover:border-slate-300"
                              : "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <span className="text-xs font-semibold text-slate-900 block truncate">
                            {variant.name}
                          </span>
                          <span className="text-xs text-[#2563EB] font-bold mt-1">
                            ₹{variant.price.toLocaleString("en-IN")}
                          </span>
                          {!isAvailable && (
                            <span className="text-[10px] text-red-500 font-medium block">
                              Unavailable
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* QUANTITY SELECTOR */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center space-x-3 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 shadow-sm"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(displayStock, q + 1))}
                    disabled={quantity >= displayStock}
                    className="p-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ACTIONS: ADD TO CART & BUY NOW */}
              <div className="pt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-4 bg-white border-2 border-[#2563EB] text-[#2563EB] font-bold text-sm rounded-xl hover:bg-blue-50 transition flex items-center justify-center space-x-2 shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-4 bg-[#2563EB] text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>
              </div>

              {/* OFFERS & COUPONS */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Tag className="w-4 h-4 text-[#2563EB]" />
                  <span>Available Offers & Coupons</span>
                </div>
                {availableOffers.filter((offer) =>
                  (offer.eligibleProducts || ["all"]).includes("all") ||
                  (offer.eligibleProducts || []).includes(String(product?.id))
                ).map((offer) => (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => {
                      setCouponCode(offer.offerCode);
                      setCouponMessage(null);
                    }}
                    className="w-full text-left bg-gradient-to-r from-amber-50 to-orange-50/50 p-3.5 rounded-xl border border-amber-200/80 text-xs text-amber-900 hover:border-amber-400 transition"
                  >
                    <span className="font-bold">{offer.offerName}:</span>{" "}
                    {offer.discountType === "percentage" ? `${offer.discountValue}% off` : `₹${offer.discountValue} off`}
                    {offer.maximumDiscount > 0 ? ` (up to ₹${offer.maximumDiscount.toLocaleString("en-IN")})` : ""}
                    {" with code "}
                    <code className="bg-amber-100 px-1 rounded font-mono font-bold">{offer.offerCode}</code>
                    {offer.minimumPurchase > 0 ? ` on purchases over ₹${offer.minimumPurchase.toLocaleString("en-IN")}` : ""}
                  </button>
                ))}
                {availableOffers.length === 0 && (
                  <p className="text-xs text-slate-500">No active offers are available right now.</p>
                )}

                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCoupon} className="flex space-x-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter Coupon / Referral Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition"
                  >
                    Apply
                  </button>
                </form>

                {couponMessage && (
                  <p className={`text-xs font-medium ${
                    couponMessage.type === "success" ? "text-emerald-600" : "text-red-500"
                  }`}>
                    {couponMessage.text}
                  </p>
                )}
                {appliedDiscount > 0 && (
                  <p className="text-xs text-slate-500">Offer savings apply to this purchase at checkout.</p>
                )}
              </div>

              {/* DELIVERY PINCODE CHECKER */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-[#2563EB]" />
                  <span>Delivery & Pincode Checker</span>
                </div>
                <form onSubmit={handlePincodeCheck} className="flex space-x-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-Digit Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl hover:bg-slate-200 transition"
                  >
                    Check
                  </button>
                </form>
                {pincodeStatus && (
                  <p className="text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pincodeStatus}
                  </p>
                )}
              </div>

              {/* SELLER & ASK SELLER */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Sold by: </span>
                  <span className="font-bold text-slate-900">{product.sellerName || "NEXLAPTECH Official Store"}</span>
                  <span className="ml-2 text-emerald-600 font-semibold">(4.8 ★ Verified Seller)</span>
                </div>
                <button
                  onClick={handleAskSellerClick}
                  className="px-3 py-1.5 bg-blue-50 text-[#2563EB] font-bold rounded-lg hover:bg-blue-100 transition flex items-center space-x-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask Seller</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* HIGHLIGHTS SECTION */}
        <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />
            <span>Product Highlights</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {isLaptop ? (
              <>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Processor</span>
                  <span className="font-bold text-slate-900">{specMap.Processor || specMap.processorBrand || "Intel Core i5"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">RAM</span>
                  <span className="font-bold text-slate-900">{specMap.RAM || specMap.ramCapacity || "16 GB DDR4"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Storage</span>
                  <span className="font-bold text-slate-900">{specMap.SSD || specMap.ssdCapacity || "512 GB SSD"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Display</span>
                  <span className="font-bold text-slate-900">{specMap.Display || specMap.screenSize || '15.6" FHD'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">OS</span>
                  <span className="font-bold text-slate-900">{specMap.OS || specMap.operatingSystem || "Windows 11 Home"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Warranty</span>
                  <span className="font-bold text-slate-900">{product.warrantyDuration || "1 Year Warranty"}</span>
                </div>
              </>
            ) : isSsd ? (
              <>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Capacity</span>
                  <span className="font-bold text-slate-900">{specMap.Capacity || "1 TB"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Interface</span>
                  <span className="font-bold text-slate-900">{specMap.Interface || "PCIe 4.0 NVMe"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Form Factor</span>
                  <span className="font-bold text-slate-900">{specMap.FormFactor || "M.2 2280"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Read Speed</span>
                  <span className="font-bold text-slate-900">{specMap.ReadSpeed || "Up to 7,000 MB/s"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Write Speed</span>
                  <span className="font-bold text-slate-900">{specMap.WriteSpeed || "Up to 5,000 MB/s"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Warranty</span>
                  <span className="font-bold text-slate-900">{product.warrantyDuration || "5 Years Brand Warranty"}</span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Brand</span>
                  <span className="font-bold text-slate-900">{product.brand || "NEXLAPTECH"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Category</span>
                  <span className="font-bold text-slate-900 capitalize">{product.category}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Condition</span>
                  <span className="font-bold text-slate-900 capitalize">{product.condition || "New"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Warranty</span>
                  <span className="font-bold text-slate-900">{product.warrantyDuration || "1 Year"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">Return Policy</span>
                  <span className="font-bold text-slate-900">{product.returnPolicyText || "7-Day Replacement"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block font-semibold">GST Invoice</span>
                  <span className="font-bold text-slate-900">Available</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ALL DETAILS & SPECIFICATIONS */}
        <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Info className="w-5 h-5 text-[#2563EB]" />
            <span>Technical Specifications & All Details</span>
          </h2>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {Object.keys(specMap).length > 0 ? (
              Object.entries(specMap).map(([key, value]) => (
                <div key={key} className="grid grid-cols-1 sm:grid-cols-12 p-3.5 text-xs hover:bg-slate-50 transition">
                  <div className="sm:col-span-4 font-semibold text-slate-600 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="sm:col-span-8 font-medium text-slate-900 mt-1 sm:mt-0">
                    {String(value)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-slate-500 italic text-center">
                Standard NexLapTech Hardware Specifications Apply.
              </div>
            )}
          </div>
        </div>

        {/* SERVICE & PROTECTION PLANS */}
        <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#7C3AED]" />
            <span>NEXLAPTECH Care & Protection Plans</span>
          </h2>
          {protectionPlans.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {protectionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 rounded-xl border ${plan.accent === "blue" ? "border-blue-100 bg-blue-50/40" : "border-purple-100 bg-purple-50/40"}`}
                >
                  <h3 className="text-xs font-bold text-slate-900">{plan.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{plan.description}</p>
                  <span className={`text-xs font-bold mt-2 inline-block ${plan.accent === "blue" ? "text-[#2563EB]" : "text-[#7C3AED]"}`}>
                    ₹{Number(plan.price).toLocaleString("en-IN")} / {plan.duration}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No care plans are currently available.</p>
          )}
        </div>

        {/* COMBO SAVINGS */}
        <div className="mt-8 bg-[#2563EB]/5 p-6 rounded-2xl border border-blue-200/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Tag className="w-5 h-5 text-[#2563EB]" />
              <span>Save More With Combos</span>
            </h2>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
              Save Extra ₹699
            </span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-bold text-slate-900">{product.title}</span>
              <span className="text-slate-400 font-bold">+</span>
              <span className="font-medium text-slate-700">Wireless Optical Mouse & Bag</span>
            </div>
            <button
              onClick={handleAddToCart}
              className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition"
            >
              Add Combo to Cart
            </button>
          </div>
        </div>

        {/* CUSTOMER REVIEWS */}
        <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Customer Ratings & Reviews</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Empirical reviews from verified NexLapTech customers</p>
            </div>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition"
            >
              Write Review
            </button>
          </div>

          {/* Write Review Form */}
          {showReviewForm && (
            <form onSubmit={handleReviewSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <h3 className="font-bold text-slate-900">Share Your Experience</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="City (e.g. Tumkur, Bengaluru)"
                  value={reviewCity}
                  onChange={(e) => setReviewCity(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-700">Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= reviewRating
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Write your detailed review here..."
                required
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#2563EB] text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Submit Review
              </button>
              {reviewSuccess && (
                <p className="text-emerald-600 font-semibold text-xs mt-2">
                  ✓ Thank you! Your review has been submitted for moderation.
                </p>
              )}
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-4 divide-y divide-slate-100">
            {reviewsList.length > 0 ? (
              reviewsList.slice(0, 5).map((rev, idx) => (
                <div key={rev.id || idx} className="pt-4 first:pt-0 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{rev.customer_name || rev.name || "Customer"}</span>
                      {rev.verified && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold flex items-center">
                          <Check className="w-3 h-3 mr-0.5" /> Verified Buyer
                        </span>
                      )}
                    </div>
                    <div className="flex items-center bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      {rev.rating || 5} ★
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed pt-1">
                    {rev.review_message || rev.quote || rev.overall_experience || "Great product from NexLapTech!"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No reviews yet for this product.</p>
            )}
          </div>
        </div>

        {/* SIMILAR PRODUCTS CAROUSEL */}
        {similarProducts.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Similar Products You May Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarProducts.map((sim) => (
                <Link
                  key={sim.id}
                  href={`/products/${sim.id}`}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition group"
                >
                  <div className="relative aspect-square w-full bg-slate-50 rounded-lg overflow-hidden mb-3 p-2">
                    <Image
                      src={sim.image || "/images/poster-products.png"}
                      alt={sim.title || sim.name || "Similar product"}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition"
                    />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 truncate">{sim.title}</h3>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-xs font-extrabold text-[#2563EB]">
                      ₹{sim.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* LIGHTBOX ZOOM MODAL */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            onClick={() => setIsZoomOpen(false)}
            aria-label="Close Zoom Modal"
            className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center p-4">
            <Image
              src={selectedImage || "/images/poster-products.png"}
              alt="Zoomed product view"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* ASK SELLER MODAL */}
      {isAskSellerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative space-y-4">
            <button
              onClick={() => setIsAskSellerOpen(false)}
              aria-label="Close Ask Seller Modal"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-[#2563EB]" />
              <span>Ask Seller About {product.title}</span>
            </h3>
            {sellerMsgSent ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold text-center">
                ✓ Your message has been sent directly to the seller!
              </div>
            ) : (
              <form onSubmit={handleAskSellerSubmit} className="space-y-3 text-xs">
                <p className="text-slate-500">
                  Ask about customization, bulk availability, or technical compatibility.
                </p>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your question here..."
                  value={sellerMessage}
                  onChange={(e) => setSellerMessage(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {sellerMsgError && (
                  <p className="text-xs text-red-500">{sellerMsgError}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-700 transition"
                >
                  Send Message to Seller
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MOBILE STICKY PURCHASE BAR */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 shadow-lg z-40 grid grid-cols-2 gap-3">
        <button
          onClick={handleAddToCart}
          className="py-3 bg-white border border-[#2563EB] text-[#2563EB] font-bold text-xs rounded-xl flex items-center justify-center space-x-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
        <button
          onClick={handleBuyNow}
          className="py-3 bg-[#2563EB] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20"
        >
          <Zap className="w-4 h-4" />
          <span>Buy Now</span>
        </button>
      </div>

    </div>
  );
}
