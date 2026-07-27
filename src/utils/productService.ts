import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore';
import { ProductItem, ProductImageItem } from '../types';
import { uploadBase64ToStorage, ensureAllStorageUrls } from './imageUploader';

/**
 * Saves product gallery images as separate documents in the `product_images` collection.
 * Requirements:
 * - productId
 * - imageUrl
 * - order
 * - alt
 * - createdAt
 */
export async function saveProductImages(
  productId: string, 
  images: string[], 
  productTitle: string = 'Product Image'
): Promise<string[]> {
  if (!productId) return [];

  // 1. Ensure all images are clean HTTPS storage URLs (never store base64)
  const cleanUrls = await ensureAllStorageUrls(images, 'products');

  try {
    // 2. Query and remove old product_images for this productId
    const q = query(collection(db, 'product_images'), where('productId', '==', productId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'product_images', d.id));
    }

    // 3. Insert new product_images documents
    for (let i = 0; i < cleanUrls.length; i++) {
      const url = cleanUrls[i];
      if (!url) continue;

      const imgDocId = `pimg_${productId}_${i}_${Date.now()}`;
      const imgPayload: ProductImageItem = {
        id: imgDocId,
        productId: productId,
        imageUrl: url,
        order: i,
        alt: `${productTitle} - View ${i + 1}`,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'product_images', imgDocId), imgPayload);
    }
  } catch (err) {
    console.error(`Error saving product_images for ${productId}:`, err);
  }

  return cleanUrls;
}

/**
 * Retrieves gallery images for a product from the `product_images` collection.
 */
export async function getProductImages(productId: string): Promise<string[]> {
  if (!productId) return [];
  try {
    const q = query(
      collection(db, 'product_images'), 
      where('productId', '==', productId)
    );
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => d.data() as ProductImageItem);
    
    // Sort in memory by order
    docs.sort((a, b) => (a.order || 0) - (b.order || 0));

    return docs.map(d => d.imageUrl).filter(Boolean);
  } catch (err) {
    console.error(`Error getting product_images for ${productId}:`, err);
    return [];
  }
}

/**
 * Sanitizes a product payload before saving to `products/{id}` document.
 * Ensures no Base64 strings and no large embedded image arrays exist in the product document.
 */
export async function prepareCleanProductDoc(productData: Partial<ProductItem>, productId: string): Promise<Record<string, any>> {
  // Ensure primary images are uploaded to Storage
  let mainImg = productData.image || productData.thumbnailUrl || '';
  if (mainImg.startsWith('data:')) {
    mainImg = await uploadBase64ToStorage(mainImg, 'products');
  }

  let coverImg = productData.coverImageUrl || mainImg;
  if (coverImg.startsWith('data:')) {
    coverImg = await uploadBase64ToStorage(coverImg, 'products');
  }

  const title = productData.title || productData.name || 'Untitled Product';
  const generatedSlug = (productData.seo?.urlSlug || productData.slug || title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Construct clean product document containing only required fields
  const cleanDoc: Record<string, any> = {
    id: productId,
    name: title,
    title: title,
    slug: generatedSlug,
    sku: productData.sku || `SKU-${productId}`,
    category: productData.category || 'General',
    description: productData.description || '',
    thumbnailUrl: mainImg,
    coverImageUrl: coverImg,
    image: mainImg, // Retain for legacy components
    price: Number(productData.price) || 0,
    discount: Number(productData.discountPrice) || Number(productData.discount) || 0,
    discountPrice: Number(productData.discountPrice) || Number(productData.discount) || 0,
    stock: Number(productData.stock) || 0,
    GST: Number(productData.gstPercent) || Number(productData.GST) || 0,
    gstPercent: Number(productData.gstPercent) || Number(productData.GST) || 0,
    tags: Array.isArray(productData.tags) ? productData.tags : [productData.category || 'General'],
    status: productData.status || 'Active',
    rating: productData.rating || 5.0,
    reviewsCount: productData.reviewsCount || 1,
    userId: productData.userId || '',
    brand: productData.brand || '',
    unit: productData.unit || 'Piece',
    minStockAlert: productData.minStockAlert !== undefined ? Number(productData.minStockAlert) : 5,
    trackInventory: productData.trackInventory !== false,
    shortDescription: productData.shortDescription || '',
    specifications: productData.specifications || {},
    customization: productData.customization || {},
    delivery: productData.delivery || {},
    labels: productData.labels || {}
  };

  // STRICT RULE: Delete the 'images' array field from the product document!
  delete cleanDoc.images;
  cleanDoc._migrated = true;

  return cleanDoc;
}

let hasRunProductMigration = false;

/**
 * Automatic Migration Helper for existing products.
 * Migrates Base64 images and embedded image arrays out of product documents.
 */
export async function autoMigrateExistingProducts(): Promise<void> {
  if (hasRunProductMigration) return;
  hasRunProductMigration = true;

  try {
    const snap = await getDocs(collection(db, 'products'));
    let migratedCount = 0;

    for (const docSnap of snap.docs) {
      try {
        const data = docSnap.data();
        const prodId = docSnap.id;

        if (data._migrated === true) continue;

        let existingImages: string[] = Array.isArray(data.images) ? data.images : [];

        // Check if document has base64 in main image or images array
        const hasBase64Image = typeof data.image === 'string' && data.image.startsWith('data:');
        const hasBase64Images = existingImages.some(img => typeof img === 'string' && img.startsWith('data:'));
        const hasEmbeddedImagesArray = 'images' in data && Array.isArray(data.images) && data.images.length > 0;

        if (hasBase64Image || hasBase64Images || hasEmbeddedImagesArray) {
          console.log(`Migrating product ${prodId}...`);

          // 1. Move gallery images into product_images collection
          if (existingImages.length > 0) {
            await saveProductImages(prodId, existingImages, data.title || data.name || 'Product');
          }

          // 2. Clean product doc
          const cleanPayload = await prepareCleanProductDoc(data as ProductItem, prodId);
          cleanPayload._migrated = true;
          
          // Save clean product doc without 'images' array
          await setDoc(doc(db, 'products', prodId), cleanPayload);
          migratedCount++;
        } else {
          // Mark clean doc as migrated so it is skipped on future runs
          await setDoc(doc(db, 'products', prodId), { _migrated: true }, { merge: true });
        }
      } catch (prodErr) {
        console.warn(`Notice during product auto-migration for doc ${docSnap.id}:`, prodErr);
      }
    }

    if (migratedCount > 0) {
      console.log(`Successfully migrated ${migratedCount} product documents to clean Firestore structure!`);
    }
  } catch (err) {
    console.warn('Notice during auto-migration of products:', err);
  }
}
