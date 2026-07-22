import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Coupon, CouponUsage, CouponValidationResult } from '../types';

/**
 * Helper function to check if a coupon is active and currently within valid date range
 */
export function isCouponActiveAndValid(coupon: Coupon, now: Date = new Date()): boolean {
  // Check active flag (support both isActive and active fields)
  const rawObj = coupon as any;
  const isActive = rawObj.active !== undefined 
    ? rawObj.active 
    : (coupon.isActive !== undefined ? coupon.isActive : true);

  if (!isActive) {
    return false;
  }

  const nowMs = now.getTime();

  // Check validFrom date
  if (coupon.validFrom) {
    const validFromMs = new Date(coupon.validFrom).getTime();
    if (!isNaN(validFromMs) && nowMs < validFromMs) {
      return false; // Valid in the future, not yet active
    }
  }

  // Check validUntil date
  if (coupon.validUntil) {
    let validUntilMs = new Date(coupon.validUntil).getTime();
    if (typeof coupon.validUntil === 'string' && coupon.validUntil.length === 10) {
      validUntilMs = new Date(`${coupon.validUntil}T23:59:59.999`).getTime();
    }
    if (!isNaN(validUntilMs) && nowMs > validUntilMs) {
      return false; // Expired
    }
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usageLimit > 0) {
    if ((coupon.timesUsed || 0) >= coupon.usageLimit) {
      return false; // Fully used
    }
  }

  return true;
}

export interface CartItemForValidation {
  productId: string;
  productTitle: string;
  price: number;
  quantity: number;
  category?: string;
  serviceCategory?: 'Printing' | 'Photography' | string;
}

/**
 * Validates a coupon code against Firestore database and current cart context.
 */
export async function validateCoupon(
  inputCode: string,
  cartItems: CartItemForValidation[],
  subtotal: number,
  customerEmail?: string,
  customerId?: string,
  customerPhone?: string
): Promise<CouponValidationResult> {
  const cleanCode = inputCode.trim().toUpperCase();

  if (!cleanCode) {
    return {
      isValid: false,
      message: 'Please enter a coupon code.',
      calculatedDiscount: 0,
      applicableSubtotal: subtotal
    };
  }

  try {
    // 1. Fetch coupon by code
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where('code', '==', cleanCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        isValid: false,
        message: 'Invalid coupon code.',
        calculatedDiscount: 0,
        applicableSubtotal: subtotal
      };
    }

    const docSnap = snapshot.docs[0];
    const coupon = { id: docSnap.id, ...docSnap.data() } as Coupon;

    // 2. Active status check
    if (!coupon.isActive) {
      return {
        isValid: false,
        message: 'Coupon is not active.',
        coupon,
        calculatedDiscount: 0,
        applicableSubtotal: subtotal
      };
    }

    // 3. Date & Time validity
    const now = new Date();
    if (coupon.validFrom) {
      const validFromDate = new Date(coupon.validFrom);
      if (!isNaN(validFromDate.getTime()) && now < validFromDate) {
        return {
          isValid: false,
          message: 'Coupon is not yet valid.',
          coupon,
          calculatedDiscount: 0,
          applicableSubtotal: subtotal
        };
      }
    }

    if (coupon.validUntil) {
      const validUntilDate = new Date(coupon.validUntil);
      if (!isNaN(validUntilDate.getTime()) && now > validUntilDate) {
        return {
          isValid: false,
          message: 'Coupon has expired.',
          coupon,
          calculatedDiscount: 0,
          applicableSubtotal: subtotal
        };
      }
    }

    // 4. Total Usage Limit check
    if (coupon.usageLimit && coupon.usageLimit > 0) {
      if ((coupon.timesUsed || 0) >= coupon.usageLimit) {
        return {
          isValid: false,
          message: 'Coupon usage limit exceeded.',
          coupon,
          calculatedDiscount: 0,
          applicableSubtotal: subtotal
        };
      }
    }

    // 5. Customer Usage Limit check
    if (coupon.usageLimitPerCustomer && coupon.usageLimitPerCustomer > 0) {
      if (customerEmail || customerId || customerPhone) {
        const usagesRef = collection(db, 'coupon_usages');
        const usageSnap = await getDocs(usagesRef);
        
        let customerUsageCount = 0;
        usageSnap.forEach((uDoc) => {
          const uData = uDoc.data();
          if (uData.couponCode === cleanCode) {
            const matchEmail = customerEmail && uData.customerEmail?.toLowerCase() === customerEmail.toLowerCase();
            const matchId = customerId && uData.customerId === customerId;
            const matchPhone = customerPhone && uData.customerPhone === customerPhone;
            if (matchEmail || matchId || matchPhone) {
              customerUsageCount++;
            }
          }
        });

        if (customerUsageCount >= coupon.usageLimitPerCustomer) {
          return {
            isValid: false,
            message: 'Coupon usage limit exceeded for your account.',
            coupon,
            calculatedDiscount: 0,
            applicableSubtotal: subtotal
          };
        }
      }
    }

    // 6. First Order Only check
    if (coupon.firstOrderOnly) {
      if (!customerEmail && !customerId) {
        return {
          isValid: false,
          message: 'Please sign in or enter billing email to verify first order eligibility.',
          coupon,
          calculatedDiscount: 0,
          applicableSubtotal: subtotal
        };
      }

      const ordersRef = collection(db, 'orders');
      const orderSnap = await getDocs(ordersRef);
      let previousOrderCount = 0;

      orderSnap.forEach((oDoc) => {
        const oData = oDoc.data();
        if (oData.status !== 'Cancelled') {
          const matchEmail = customerEmail && oData.customerEmail?.toLowerCase() === customerEmail.toLowerCase();
          const matchId = customerId && oData.customerId === customerId;
          if (matchEmail || matchId) {
            previousOrderCount++;
          }
        }
      });

      if (previousOrderCount > 0) {
        return {
          isValid: false,
          message: 'Coupon is restricted to first-time orders only.',
          coupon,
          calculatedDiscount: 0,
          applicableSubtotal: subtotal
        };
      }
    }

    // 7. Customer Specific check
    if (coupon.customerSpecificEmail && coupon.customerSpecificEmail.trim()) {
      const targetEmail = coupon.customerSpecificEmail.trim().toLowerCase();
      const currentEmail = customerEmail ? customerEmail.trim().toLowerCase() : '';

      if (!currentEmail || currentEmail !== targetEmail) {
        return {
          isValid: false,
          message: 'Coupon is reserved for a specific customer.',
          coupon,
          calculatedDiscount: 0,
          applicableSubtotal: subtotal
        };
      }
    }

    // 8. Eligibility & Applicable items calculation
    let eligibleSubtotal = 0;
    let isEligible = false;

    if (coupon.applicableOn === 'ALL') {
      isEligible = cartItems.length > 0;
      eligibleSubtotal = subtotal;
    } else if (coupon.applicableOn === 'CATEGORIES') {
      const categories = coupon.applicableCategoryIds || [];
      cartItems.forEach((item) => {
        if (item.category && categories.includes(item.category)) {
          isEligible = true;
          eligibleSubtotal += item.price * item.quantity;
        }
      });
    } else if (coupon.applicableOn === 'PRODUCTS') {
      const productIds = coupon.applicableProductIds || [];
      cartItems.forEach((item) => {
        if (productIds.includes(item.productId)) {
          isEligible = true;
          eligibleSubtotal += item.price * item.quantity;
        }
      });
    } else if (coupon.applicableOn === 'PRINTING') {
      cartItems.forEach((item) => {
        if (
          item.serviceCategory?.toLowerCase() === 'printing' ||
          item.category?.toLowerCase().includes('print') ||
          item.productTitle?.toLowerCase().includes('print') ||
          item.productTitle?.toLowerCase().includes('frame') ||
          item.productTitle?.toLowerCase().includes('mug') ||
          item.productTitle?.toLowerCase().includes('album')
        ) {
          isEligible = true;
          eligibleSubtotal += item.price * item.quantity;
        }
      });
    } else if (coupon.applicableOn === 'PHOTOGRAPHY') {
      cartItems.forEach((item) => {
        if (
          item.serviceCategory?.toLowerCase() === 'photography' ||
          item.category?.toLowerCase().includes('shoot') ||
          item.category?.toLowerCase().includes('photo') ||
          item.productTitle?.toLowerCase().includes('shoot') ||
          item.productTitle?.toLowerCase().includes('wedding')
        ) {
          isEligible = true;
          eligibleSubtotal += item.price * item.quantity;
        }
      });
    }

    if (!isEligible || eligibleSubtotal <= 0) {
      return {
        isValid: false,
        message: 'Coupon is not applicable to the items in your cart.',
        coupon,
        calculatedDiscount: 0,
        applicableSubtotal: subtotal
      };
    }

    // 9. Minimum Order Amount check
    if (coupon.minOrderAmount && coupon.minOrderAmount > 0) {
      if (subtotal < coupon.minOrderAmount) {
        return {
          isValid: false,
          message: `Minimum order amount of ₹${coupon.minOrderAmount.toLocaleString('en-IN')} not reached.`,
          coupon,
          calculatedDiscount: 0,
          applicableSubtotal: subtotal
        };
      }
    }

    // 10. Discount Calculation
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = eligibleSubtotal * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      // FIXED
      discount = Math.min(coupon.discountValue, eligibleSubtotal);
    }

    discount = Math.max(0, Math.round(discount));

    return {
      isValid: true,
      message: `Coupon "${coupon.code}" applied successfully! You saved ₹${discount.toLocaleString('en-IN')}`,
      coupon,
      calculatedDiscount: discount,
      applicableSubtotal: eligibleSubtotal
    };
  } catch (err) {
    console.error('Error validating coupon:', err);
    return {
      isValid: false,
      message: 'Error validating coupon. Please try again.',
      calculatedDiscount: 0,
      applicableSubtotal: subtotal
    };
  }
}

/**
 * Redeems an applied coupon upon successful order placement:
 * 1. Increments coupon.timesUsed in Firestore `coupons`
 * 2. Creates a record in Firestore `coupon_usages`
 */
export async function redeemCoupon(
  coupon: Coupon,
  orderId: string,
  customerEmail: string,
  customerId?: string,
  customerPhone?: string,
  discountAmount?: number
): Promise<void> {
  try {
    // 1. Increment usage count in `coupons` collection
    const couponRef = doc(db, 'coupons', coupon.id);
    await updateDoc(couponRef, {
      timesUsed: increment(1),
      updatedAt: new Date().toISOString()
    });

    // 2. Add usage history entry in `coupon_usages` collection
    const usagesRef = collection(db, 'coupon_usages');
    await addDoc(usagesRef, {
      couponId: coupon.id,
      couponCode: coupon.code,
      couponName: coupon.name,
      orderId,
      customerId: customerId || 'anonymous',
      customerEmail: customerEmail || 'anonymous',
      customerPhone: customerPhone || '',
      discountAmount: discountAmount || 0,
      usedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to record coupon redemption:', err);
  }
}

/**
 * Checks for eligible auto-apply coupons in Firestore and returns the best matching valid coupon.
 */
export async function findAutoApplyCoupon(
  cartItems: CartItemForValidation[],
  subtotal: number,
  customerEmail?: string,
  customerId?: string,
  customerPhone?: string
): Promise<CouponValidationResult | null> {
  try {
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where('autoApply', '==', true), where('isActive', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    let bestResult: CouponValidationResult | null = null;

    for (const docSnap of snapshot.docs) {
      const coupon = { id: docSnap.id, ...docSnap.data() } as Coupon;
      const res = await validateCoupon(coupon.code, cartItems, subtotal, customerEmail, customerId, customerPhone);
      
      if (res.isValid && res.calculatedDiscount > 0) {
        if (!bestResult || res.calculatedDiscount > bestResult.calculatedDiscount) {
          bestResult = res;
        }
      }
    }

    return bestResult;
  } catch (err) {
    console.error('Error finding auto apply coupon:', err);
    return null;
  }
}
