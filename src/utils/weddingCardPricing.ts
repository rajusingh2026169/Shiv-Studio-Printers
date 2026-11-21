import {
  CartItem,
  DigitalInvitationType,
  ProductItem,
  WEDDING_CARD_CATEGORIES,
  WeddingCardCustomization,
  WeddingCardItem
} from '../types';
import { STUDIO_IMAGES } from '../assets/studioAssets';

export const ALL_WEDDING_CARD_CATEGORIES = [...WEDDING_CARD_CATEGORIES];

export const LEGACY_WEDDING_CARD_CATEGORIES = [
  'Royal Laser Cut',
  'Box Invitation',
  'Single Sheet',
  'Acrylic',
  'Floral',
  'Traditional',
  'Multi-fold'
];

export const DIGITAL_INVITATION_TYPES: DigitalInvitationType[] = [
  'Static Wedding Invitation Images',
  'WhatsApp Wedding Invitation',
  'Animated Wedding Invitation',
  'Wedding Invitation Videos'
];

export const DEFAULT_CARD_FINISHES = [
  'Gold Foil Stamping',
  'Matte Velvet Lamination',
  'Laser Cut Filigree',
  'Embossing & UV Spot',
  'Wax Seal Accent'
];

export const DEFAULT_CARD_COLORS = [
  'Royal Maroon',
  'Ivory Cream',
  'Crimson Red',
  'Emerald Green',
  'Royal Blue',
  'Pastel Blush Pink',
  'Champagne Gold',
  'Obsidian Black & Gold'
];

export function isDigitalWeddingCard(card: Partial<WeddingCardItem>): boolean {
  if (card.isDigital === true) return true;
  const cat = (card.category || '').toLowerCase();
  return (
    cat.includes('digital wedding') ||
    cat.includes('invitation video') ||
    Boolean(card.digitalType)
  );
}

export function getEffectiveCardMinQty(card: Partial<WeddingCardItem>): number {
  if (isDigitalWeddingCard(card)) return 1;
  return Math.max(1, Number(card.minOrderQuantity) || 50);
}

export function getCardUnitPrice(card: Partial<WeddingCardItem>): number {
  const discount = Number(card.discountPrice || 0);
  const regular = Number(card.price || 0);
  if (discount > 0 && discount < regular) return discount;
  return regular;
}

export interface WeddingCardPriceBreakdown {
  unitPrice: number;
  quantity: number;
  cardsSubtotal: number;
  printingCharge: number;
  customizationCharge: number;
  shippingCharge: number;
  subtotalBeforeShipping: number;
  totalAmount: number;
}

export function calculateWeddingCardPriceBreakdown(
  card: Partial<WeddingCardItem>,
  requestedQuantity: number
): WeddingCardPriceBreakdown {
  const isDigital = isDigitalWeddingCard(card);
  const moq = getEffectiveCardMinQty(card);
  const quantity = isDigital ? 1 : Math.max(moq, Math.round(requestedQuantity || moq));
  const unitPrice = getCardUnitPrice(card);
  const cardsSubtotal = unitPrice * quantity;
  const printingCharge = isDigital
    ? 0
    : card.printingCharge !== undefined
      ? Math.max(0, Number(card.printingCharge) || 0)
      : 500;
  const customizationCharge =
    card.customizationAvailable === false
      ? 0
      : card.customizationCharge !== undefined
        ? Math.max(0, Number(card.customizationCharge) || 0)
        : isDigital
          ? 0
          : 350;
  const shippingCharge = isDigital
    ? 0
    : card.shippingCharge !== undefined
      ? Math.max(0, Number(card.shippingCharge) || 0)
      : 0;

  const subtotalBeforeShipping = cardsSubtotal + printingCharge + customizationCharge;
  const totalAmount = subtotalBeforeShipping + shippingCharge;

  return {
    unitPrice,
    quantity,
    cardsSubtotal,
    printingCharge,
    customizationCharge,
    shippingCharge,
    subtotalBeforeShipping,
    totalAmount
  };
}

export function getCardPrimaryImage(card: Partial<WeddingCardItem>): string {
  const isDigital = isDigitalWeddingCard(card);
  const isBox = (card.category || '').toLowerCase().includes('box');
  return (
    card.mainImage ||
    card.images?.front ||
    card.sampleImages?.[0] ||
    card.image ||
    (isDigital
      ? STUDIO_IMAGES.digitalWeddingCard
      : isBox
        ? STUDIO_IMAGES.luxuryBoxInvite
        : STUDIO_IMAGES.royalWeddingInvite)
  );
}

export function getAllCardSampleImages(card: Partial<WeddingCardItem>): { label: string; url: string }[] {
  const list: { label: string; url: string }[] = [];
  const seen = new Set<string>();

  const pushUnique = (label: string, url?: string) => {
    const clean = (url || '').trim();
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    list.push({ label, url: clean });
  };

  pushUnique('Front Cover', card.images?.front || card.mainImage);
  pushUnique('Inside Layout', card.images?.inside);
  pushUnique('Back / Envelope', card.images?.back);
  (card.sampleImages || []).forEach((imgUrl, idx) => {
    pushUnique(`Sample ${idx + 1}`, imgUrl);
  });

  if (list.length === 0) {
    pushUnique('Preview', getCardPrimaryImage(card));
  }
  return list;
}

export function buildWeddingCardCartItem(
  card: WeddingCardItem,
  quantity: number,
  customization: WeddingCardCustomization
): CartItem {
  const breakdown = calculateWeddingCardPriceBreakdown(card, quantity);
  const isDigital = isDigitalWeddingCard(card);
  const primaryImage = getCardPrimaryImage(card);
  const cardName = card.name || card.title || `Design #${card.designCode || card.id}`;
  const finish = customization.selectedFinish || card.availableFinishes?.[0] || card.printingType || '';
  const color = customization.selectedColor || card.availableColors?.[0] || card.color || '';

  const syntheticProduct: ProductItem = {
    id: card.id,
    title: `${cardName}${card.designCode ? ` (#${card.designCode})` : ''}`,
    name: cardName,
    category: isDigital ? 'Digital Invitations' : 'Wedding Cards & Printing',
    price: breakdown.unitPrice,
    discountPrice: undefined,
    image: primaryImage,
    stock: card.isAvailable === false ? 0 : 9999,
    description: card.description || '',
    rating: 5,
    reviewsCount: 0,
    enableGst: card.enableGst ?? true,
    gstPercent: card.gstPercent ?? 12,
    enableShipping: !isDigital,
    freeShipping: isDigital || breakdown.shippingCharge === 0,
    shippingCharge: breakdown.shippingCharge
  };

  const uniqueSuffix = Date.now().toString(36);
  const variantLabel = [color, finish].filter(Boolean).join(' • ') || card.size || 'Custom Card';

  return {
    id: `wc_${card.id}_${uniqueSuffix}`,
    productId: card.id,
    product: syntheticProduct,
    selectedVariantId: `${color}_${finish}`.replace(/\s+/g, '_') || 'custom',
    selectedVariantName: variantLabel,
    selectedVariantPrice: breakdown.unitPrice,
    quantity: breakdown.quantity,
    itemType: 'wedding_card',
    weddingCardId: card.id,
    designCode: card.designCode || '',
    selectedColor: color,
    selectedFinish: finish,
    printingCharge: breakdown.printingCharge,
    customizationCharge: breakdown.customizationCharge,
    cardShippingCharge: breakdown.shippingCharge,
    minOrderQuantity: getEffectiveCardMinQty(card),
    isDigital,
    digitalType: card.digitalType || (isDigital ? 'Static Wedding Invitation Images' : undefined),
    estimatedProductionTime: card.estimatedProductionTime || (isDigital ? '24-48 Hours' : '5-7 Business Days'),
    weddingCardCustomization: customization
  };
}
