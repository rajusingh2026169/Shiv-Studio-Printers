# SHIV STUDIO Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default-Deny Safety Net**: Every unlisted Firestore path is denied (`allow read, write: if false`).
2. **Trusted Admin Identity**: Admin access is granted ONLY if `request.auth != null` AND either:
   - `request.auth.token.email == 'arvindmaurya212655@gmail.com'` **with `request.auth.token.email_verified == true`**, OR
   - `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`, OR
   - `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'Admin', 'Super Admin']`.
3. **No Self-Assigned Role Escalation**: Customers registering in `users/{uid}` may ONLY create their own profile with `role in ['customer', 'Customer']` and cannot mutate `role`, `uid`, or `createdAt` during profile updates.
4. **PII Isolation**: Collections holding client emails, phones, or shipping addresses (`users`, `orders`, `bookings`, `inquiries`, `messages`, `coupon_usages`, `notifications`, `mail`) NEVER permit unauthenticated or non-owner `get` or `list` reads.
5. **Catalog Write Lockdown**: Public storefront collections (`services`, `packages`, `gallery`, `products`, `product_images`, `wedding_cards`, `offers`, `offer_banners`, `blogs`, `reviews`, `settings`, `website_settings`) allow public `get`/`list` for browsing, and restrict `create`/`update`/`delete` strictly to Admins.
6. **Coupon & Order Integrity**: Public checkout orders start in `'Pending'`; `coupon_usages` creation requires existing `coupons/$(couponId)` and `orders/$(orderId)` documents; public `coupons` updates are restricted strictly to incrementing `timesUsed` by `+1` on active coupons; public `videos` updates are restricted strictly to incrementing `views` by `+1`.
7. **Immutable & Terminal Guards**: `createdAt`, `customerId`, and `uid` remain immutable after creation; non-admin updates cannot mutate completed/cancelled orders or bookings.
8. **Size & Schema Bounds**: Every document write validates `isValidId(docId)` (`^[a-zA-Z0-9_\-]+$`, `<= 128`), `keys().hasAll(...)` / `keys().hasOnly(...)` to block ghost fields, and string `.size()` / list `.size()` limits to prevent storage exhaustion.

## 2. The "Dirty Dozen" Attack Payloads (All Must Yield PERMISSION_DENIED)
1. **Privilege Escalation on Registration**: Customer sets `{ "uid": "<uid>", "role": "Super Admin" }` in `users/{uid}` -> DENIED.
2. **Privilege Escalation via Profile Update**: Customer updates `users/{uid}` changing `{ "role": "admin" }` -> DENIED.
3. **Email Spoofing Admin Bypass**: Unverified Auth token (`email: "arvindmaurya212655@gmail.com"`, `email_verified: false`) attempting catalog write -> DENIED.
4. **Cross-User PII Read**: Customer A calls `get()` on `users/{customerB}` or `orders/{orderB}` -> DENIED.
5. **Blanket Order List Scraping**: Attacker or signed-in non-admin calls `list` on `orders` without `customerId == request.auth.uid` -> DENIED.
6. **Unauthorized Catalog Price Manipulation**: Non-admin attempts `update` on `products/{id}` to set `{ "price": 1 }` -> DENIED.
7. **Ghost Field Injection (Shadow Update)**: Attacker adds `{ "isVerified": true, "backdoor": "x" }` to an `inquiries` or `orders` create payload -> DENIED by `keys().hasOnly(...)`.
8. **ID Poisoning**: Creating document with 500-char ID or invalid characters `../admin` -> DENIED by `isValidId(id)`.
9. **Inquiry Status Spoofing**: Guest creates `inquiries/{id}` with `{ "status": "Confirmed" }` instead of `'New'` -> DENIED.
10. **Order Terminal State Tampering**: Staff/customer attempts to mutate an order after `status == 'Delivered'` or `'Cancelled'` -> DENIED.
11. **Coupon TimesUsed Arbitrary Reset**: Non-admin attempts `update` on `coupons/{id}` setting `timesUsed: 0` or changing `discountValue` -> DENIED.
12. **Orphaned Order Message**: Attacker creates `messages/{id}` referencing non-existent `orderId` or impersonating `senderType: 'admin'` -> DENIED.
