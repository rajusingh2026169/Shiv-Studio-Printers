import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Order, ProofVersion, WeddingCardItem } from '../types';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { ImageField } from './ImageField';
import { StudioImage } from './StudioMedia';
import { isFsMediaUrl } from '../utils/firestoreMediaStore';
import {
  ALL_WEDDING_CARD_CATEGORIES,
  DEFAULT_CARD_COLORS,
  DEFAULT_CARD_FINISHES,
  DIGITAL_INVITATION_TYPES,
  LEGACY_WEDDING_CARD_CATEGORIES,
  getCardPrimaryImage,
  isDigitalWeddingCard
} from '../utils/weddingCardPricing';
import {
  downloadOriginalFile,
  uploadOriginalClientPhoto
} from '../utils/clientPhotoUploader';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  Sparkles,
  X,
  Eye,
  Upload,
  CheckCircle2,
  Clock,
  RotateCcw,
  Download,
  FileText,
  Film,
  Layers,
  Send,
  Wand2
} from 'lucide-react';

const stripUndefined = <T,>(val: T): T => {
  if (Array.isArray(val)) {
    return val.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (val && typeof val === 'object') {
    const out: Record<string, any> = {};
    Object.entries(val as Record<string, any>).forEach(([k, v]) => {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    });
    return out as T;
  }
  return val;
};

const STARTER_CATEGORY_TEMPLATES: Omit<WeddingCardItem, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'wc_tpl_traditional',
    designCode: 'WC-TR101',
    name: 'Subh Vivah Classic Vermilion Gold Card',
    category: 'Traditional Wedding Cards',
    price: 28,
    minOrderQuantity: 100,
    paperType: '300 GSM Textured Art Card',
    paperQuality: '300 GSM Textured Art Card',
    printingType: 'Screen Print & Gold Foil',
    size: '7 x 10 Inches',
    color: 'Crimson Red',
    availableColors: ['Crimson Red', 'Royal Maroon', 'Ivory Cream'],
    availableFinishes: ['Gold Foil Stamping', 'Embossing & UV Spot'],
    customizationAvailable: true,
    estimatedProductionTime: '4-6 Business Days',
    printingCharge: 500,
    customizationCharge: 300,
    shippingCharge: 150,
    quantityOptions: [100, 200, 300, 500],
    isDigital: false,
    enableGst: true,
    gstPercent: 12,
    isAvailable: true,
    isFeatured: true,
    whatsappNumber: '+917905256355',
    mainImage: STUDIO_IMAGES.royalWeddingInvite,
    images: {
      front: STUDIO_IMAGES.royalWeddingInvite,
      inside: STUDIO_IMAGES.luxuryAlbumFrame,
      back: STUDIO_IMAGES.engagementRing
    },
    sampleImages: [STUDIO_IMAGES.royalWeddingInvite, STUDIO_IMAGES.luxuryAlbumFrame],
    description: 'Timeless North Indian vermilion invitation featuring sacred Ganesha motif, embossed borders, and multi-leaf family inserts in Hindi or English.'
  },
  {
    id: 'wc_tpl_royal',
    designCode: 'WC-RY201',
    name: 'Maharaja Velvet Gold Foil Scroll & Gatefold',
    category: 'Royal Wedding Cards',
    price: 95,
    minOrderQuantity: 100,
    paperType: '400 GSM Royal Velvet Metallic Board',
    paperQuality: '400 GSM Royal Velvet Metallic Board',
    printingType: '24K Gold Leaf Foil & Laser Die-Cut',
    size: '8 x 11 Inches',
    color: 'Obsidian Black & Gold',
    availableColors: ['Obsidian Black & Gold', 'Royal Maroon', 'Royal Blue'],
    availableFinishes: ['Gold Foil Stamping', 'Matte Velvet Lamination', 'Wax Seal Accent'],
    customizationAvailable: true,
    estimatedProductionTime: '6-8 Business Days',
    printingCharge: 750,
    customizationCharge: 450,
    shippingCharge: 200,
    quantityOptions: [100, 150, 250, 500],
    isDigital: false,
    enableGst: true,
    gstPercent: 12,
    isAvailable: true,
    isFeatured: true,
    whatsappNumber: '+917905256355',
    mainImage: STUDIO_IMAGES.royalWeddingInvite,
    images: {
      front: STUDIO_IMAGES.royalWeddingInvite,
      inside: STUDIO_IMAGES.heroWedding,
      back: STUDIO_IMAGES.luxuryBoxInvite
    },
    sampleImages: [STUDIO_IMAGES.royalWeddingInvite, STUDIO_IMAGES.luxuryBoxInvite],
    description: 'Palace-inspired gatefold royal invitation crafted on imported matte suede stock with hand-stamped brass monogram seal.'
  },
  {
    id: 'wc_tpl_box',
    designCode: 'WC-BX301',
    name: 'Imperial Padded Gift Box Invitation (4 Inserts + Dry Fruit Jar Slot)',
    category: 'Luxury Box Invitations',
    price: 260,
    minOrderQuantity: 50,
    paperType: 'Heavy Rigids + 350 GSM Pearl Inserts',
    paperQuality: 'Hardbound Velvet Wrapped Box',
    printingType: '3D Raised Gold Foil & Satin Ribbon',
    size: '9.5 x 12 x 2.5 Inches',
    color: 'Obsidian Black & Gold',
    availableColors: ['Obsidian Black & Gold', 'Royal Maroon', 'Champagne Gold'],
    availableFinishes: ['Gold Foil Stamping', 'Matte Velvet Lamination', 'Wax Seal Accent'],
    customizationAvailable: true,
    estimatedProductionTime: '7-10 Business Days',
    printingCharge: 900,
    customizationCharge: 550,
    shippingCharge: 350,
    quantityOptions: [50, 100, 150, 250, 500],
    isDigital: false,
    enableGst: true,
    gstPercent: 12,
    isAvailable: true,
    isFeatured: true,
    whatsappNumber: '+917905256355',
    mainImage: STUDIO_IMAGES.luxuryBoxInvite,
    images: {
      front: STUDIO_IMAGES.luxuryBoxInvite,
      inside: STUDIO_IMAGES.royalWeddingInvite,
      back: STUDIO_IMAGES.luxuryAlbumFrame
    },
    sampleImages: [STUDIO_IMAGES.luxuryBoxInvite, STUDIO_IMAGES.royalWeddingInvite],
    description: 'Luxury hardbound box invitation with velvet cushioning, brass clasp, multi-function golden cards, and compartment for sweets or dry fruits.'
  },
  {
    id: 'wc_tpl_digital_wa',
    designCode: 'WC-DG901',
    name: 'Royal Animated WhatsApp & Video Wedding E-Invite',
    category: 'Digital Wedding Invitations',
    price: 999,
    minOrderQuantity: 1,
    paperType: 'Full HD 1080x1920 Portrait Digital',
    paperQuality: '4K Digital Canvas (MP4 + HD PDF + PNG)',
    printingType: 'Motion Graphics & Personalized Calligraphy',
    size: '1080 x 1920 px (9:16 Reels/WhatsApp)',
    color: 'Obsidian Black & Gold',
    availableColors: ['Obsidian Black & Gold', 'Ivory Cream', 'Emerald Green'],
    availableFinishes: ['Gold Foil Effect + Background Music'],
    customizationAvailable: true,
    estimatedProductionTime: '24-48 Hours',
    printingCharge: 0,
    customizationCharge: 0,
    shippingCharge: 0,
    quantityOptions: [1],
    isDigital: true,
    digitalType: 'Animated Wedding Invitation',
    enableGst: true,
    gstPercent: 18,
    isAvailable: true,
    isFeatured: true,
    whatsappNumber: '+917905256355',
    mainImage: STUDIO_IMAGES.digitalWeddingCard,
    images: {
      front: STUDIO_IMAGES.digitalWeddingCard,
      inside: STUDIO_IMAGES.royalWeddingInvite,
      back: STUDIO_IMAGES.preWedding
    },
    sampleImages: [STUDIO_IMAGES.digitalWeddingCard, STUDIO_IMAGES.royalWeddingInvite],
    description: 'Custom-illustrated digital invitation package with save-the-date card, full event itinerary PDF with Google Map link, and musical WhatsApp video.'
  },
  {
    id: 'wc_tpl_video_invite',
    designCode: 'WC-VD902',
    name: '3D Caricature & Cinematic Wedding Invitation Film',
    category: 'Wedding Invitation Videos',
    price: 1799,
    minOrderQuantity: 1,
    paperType: '4K MP4 Video Deliverable',
    paperQuality: '1080p / 4K Vertical & Landscape Export',
    printingType: '3D Motion Graphics + Custom Score',
    size: '1080 x 1920 px (WhatsApp Ready)',
    color: 'Champagne Gold',
    availableColors: ['Champagne Gold', 'Obsidian Black & Gold', 'Pastel Blush Pink'],
    availableFinishes: ['Custom Caricature & Shehnai Score'],
    customizationAvailable: true,
    estimatedProductionTime: '2-3 Business Days',
    printingCharge: 0,
    customizationCharge: 0,
    shippingCharge: 0,
    quantityOptions: [1],
    isDigital: true,
    digitalType: 'Wedding Invitation Videos',
    enableGst: true,
    gstPercent: 18,
    isAvailable: true,
    isFeatured: true,
    whatsappNumber: '+917905256355',
    mainImage: STUDIO_IMAGES.digitalWeddingCard,
    images: {
      front: STUDIO_IMAGES.digitalWeddingCard,
      inside: STUDIO_IMAGES.heroWedding,
      back: STUDIO_IMAGES.preWedding
    },
    sampleImages: [STUDIO_IMAGES.digitalWeddingCard, STUDIO_IMAGES.heroWedding],
    description: 'Personalized 45–60 second animated wedding invitation video with couple caricature/photos, multi-function slides, and ready-to-share WhatsApp compression.'
  }
];

export const AdminWeddingCardManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'orders'>('catalog');
  const [cards, setCards] = useState<WeddingCardItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [proofFilter, setProofFilter] = useState<string>('ALL');
  const [seedingTemplates, setSeedingTemplates] = useState(false);

  // Catalog Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<WeddingCardItem | null>(null);

  // Catalog Form Fields
  const [designCode, setDesignCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(ALL_WEDDING_CARD_CATEGORIES[1]);
  const [price, setPrice] = useState<number | ''>(50);
  const [discountPrice, setDiscountPrice] = useState<number | ''>('');
  const [minOrderQuantity, setMinOrderQuantity] = useState<number | ''>(100);
  const [printingCharge, setPrintingCharge] = useState<number | ''>(500);
  const [customizationCharge, setCustomizationCharge] = useState<number | ''>(350);
  const [shippingCharge, setShippingCharge] = useState<number | ''>(150);
  const [estimatedProductionTime, setEstimatedProductionTime] = useState('5-7 Business Days');
  const [paperType, setPaperType] = useState('350 GSM Velvet Metallic Board');
  const [printingType, setPrintingType] = useState('Gold Foil Stamping & Embossing');
  const [size, setSize] = useState('7.5 x 10.5 Inches');
  const [color, setColor] = useState('Royal Maroon');
  const [availableColorsText, setAvailableColorsText] = useState('Royal Maroon, Ivory Cream, Crimson Red');
  const [availableFinishesText, setAvailableFinishesText] = useState('Gold Foil Stamping, Matte Velvet Lamination');
  const [quantityOptionsText, setQuantityOptionsText] = useState('100, 200, 300, 500, 1000');
  const [customizationAvailable, setCustomizationAvailable] = useState(true);
  const [isDigital, setIsDigital] = useState(false);
  const [digitalType, setDigitalType] = useState<string>(DIGITAL_INVITATION_TYPES[0]);
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('+917905256355');

  // Card Media
  const [frontImage, setFrontImage] = useState('');
  const [insideImage, setInsideImage] = useState('');
  const [backImage, setBackImage] = useState('');
  const [sampleImages, setSampleImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingSampleVideo, setUploadingSampleVideo] = useState(false);

  // Image Lightbox Preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Order Detail / Proof Upload Drawer State
  const [selectedOrderForProof, setSelectedOrderForProof] = useState<Order | null>(null);
  const [proofUrlInput, setProofUrlInput] = useState('');
  const [proofFileType, setProofFileType] = useState<'image' | 'pdf' | 'video'>('image');
  const [proofFileName, setProofFileName] = useState('');
  const [proofDesignerNote, setProofDesignerNote] = useState('');
  const [uploadingProofFile, setUploadingProofFile] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [digitalDeliverableUrlInput, setDigitalDeliverableUrlInput] = useState('');
  const [digitalDeliverableNameInput, setDigitalDeliverableNameInput] = useState('');
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false);

  useEffect(() => {
    const cardsRef = collection(db, 'wedding_cards');
    const unsub = onSnapshot(cardsRef, (snapshot) => {
      const list: WeddingCardItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as WeddingCardItem);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setCards(list);
      setLoading(false);
    }, (err: any) => {
      console.error('Error listening to wedding_cards in Admin:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const unsub = onSnapshot(ordersRef, (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Order;
        if (data.hasWeddingCards || data.orderType === 'wedding_card' || data.orderType === 'mixed' || data.items?.some(i => i.itemType === 'wedding_card')) {
          list.push(data);
        }
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setOrders(list);
      setOrdersLoading(false);

      // Keep modal synced if open
      setSelectedOrderForProof((prev) => {
        if (!prev) return null;
        return list.find(o => o.id === prev.id) || prev;
      });
    }, (err: any) => {
      console.error('Error listening to wedding card orders:', err);
      setOrdersLoading(false);
    });

    return () => unsub();
  }, []);

  const handleOpenModal = (cardToEdit?: WeddingCardItem) => {
    if (cardToEdit) {
      setEditingCard(cardToEdit);
      setDesignCode(cardToEdit.designCode || '');
      setName(cardToEdit.name || cardToEdit.title || '');
      setCategory(cardToEdit.category || ALL_WEDDING_CARD_CATEGORIES[1]);
      setPrice(cardToEdit.price ?? 0);
      setDiscountPrice(cardToEdit.discountPrice ?? '');
      setMinOrderQuantity(cardToEdit.minOrderQuantity ?? (isDigitalWeddingCard(cardToEdit) ? 1 : 100));
      setPrintingCharge(cardToEdit.printingCharge ?? (isDigitalWeddingCard(cardToEdit) ? 0 : 500));
      setCustomizationCharge(cardToEdit.customizationCharge ?? (isDigitalWeddingCard(cardToEdit) ? 0 : 350));
      setShippingCharge(cardToEdit.shippingCharge ?? 0);
      setEstimatedProductionTime(cardToEdit.estimatedProductionTime || (isDigitalWeddingCard(cardToEdit) ? '24-48 Hours' : '5-7 Business Days'));
      setPaperType(cardToEdit.paperQuality || cardToEdit.paperType || '');
      setPrintingType(cardToEdit.printingType || '');
      setSize(cardToEdit.size || '');
      setColor(cardToEdit.color || 'Royal Maroon');
      setAvailableColorsText((cardToEdit.availableColors || (cardToEdit.color ? [cardToEdit.color] : DEFAULT_CARD_COLORS.slice(0, 3))).join(', '));
      setAvailableFinishesText((cardToEdit.availableFinishes || DEFAULT_CARD_FINISHES.slice(0, 2)).join(', '));
      setQuantityOptionsText((cardToEdit.quantityOptions || [100, 200, 300, 500]).join(', '));
      setCustomizationAvailable(cardToEdit.customizationAvailable ?? true);
      const digitalFlag = isDigitalWeddingCard(cardToEdit);
      setIsDigital(digitalFlag);
      setDigitalType(cardToEdit.digitalType || DIGITAL_INVITATION_TYPES[0]);
      setDescription(cardToEdit.description || '');
      setIsAvailable(cardToEdit.isAvailable ?? true);
      setIsFeatured(cardToEdit.isFeatured ?? false);
      setWhatsappNumber(cardToEdit.whatsappNumber || '+917905256355');

      setFrontImage(cardToEdit.images?.front || cardToEdit.mainImage || '');
      setInsideImage(cardToEdit.images?.inside || '');
      setBackImage(cardToEdit.images?.back || '');
      setSampleImages(cardToEdit.sampleImages || []);
      setVideoUrl(cardToEdit.videoUrl || '');
    } else {
      setEditingCard(null);
      setDesignCode(`WC-${Math.floor(10000 + Math.random() * 90000)}`);
      setName('');
      setCategory(ALL_WEDDING_CARD_CATEGORIES[1]);
      setPrice(65);
      setDiscountPrice('');
      setMinOrderQuantity(100);
      setPrintingCharge(500);
      setCustomizationCharge(350);
      setShippingCharge(150);
      setEstimatedProductionTime('5-7 Business Days');
      setPaperType('350 GSM Velvet Metallic Board');
      setPrintingType('Gold Foil Stamping & Embossing');
      setSize('7.5 x 10.5 Inches');
      setColor('Royal Maroon');
      setAvailableColorsText('Royal Maroon, Ivory Cream, Crimson Red, Obsidian Black & Gold');
      setAvailableFinishesText('Gold Foil Stamping, Matte Velvet Lamination');
      setQuantityOptionsText('100, 200, 300, 500, 1000');
      setCustomizationAvailable(true);
      setIsDigital(false);
      setDigitalType(DIGITAL_INVITATION_TYPES[0]);
      setDescription('');
      setIsAvailable(true);
      setIsFeatured(false);
      setWhatsappNumber('+917905256355');

      setFrontImage(STUDIO_IMAGES.royalWeddingInvite);
      setInsideImage(STUDIO_IMAGES.luxuryAlbumFrame);
      setBackImage(STUDIO_IMAGES.engagementRing);
      setSampleImages([STUDIO_IMAGES.royalWeddingInvite]);
      setVideoUrl('');
    }
    setShowModal(true);
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const catLower = newCat.toLowerCase();
    if (catLower.includes('digital wedding') || catLower.includes('invitation video')) {
      setIsDigital(true);
      setMinOrderQuantity(1);
      setPrintingCharge(0);
      setShippingCharge(0);
      setEstimatedProductionTime('24-48 Hours');
      if (catLower.includes('video')) {
        setDigitalType('Wedding Invitation Videos');
      }
    }
  };

  const handleSampleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSampleVideo(true);
    try {
      const rec = await uploadOriginalClientPhoto(file, 'Admin');
      setVideoUrl(rec.originalFileUrl || rec.url || '');
    } catch (err) {
      console.error('Sample video upload failed:', err);
      alert('Video upload failed. You can also paste an MP4 URL directly.');
    } finally {
      setUploadingSampleVideo(false);
      e.target.value = '';
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDesignCode = designCode.trim();
    if (!cleanDesignCode) {
      alert('Design Code is required.');
      return;
    }

    if (!name.trim()) {
      alert('Card Design Name is required.');
      return;
    }

    const duplicate = cards.find(c => c.designCode?.toLowerCase() === cleanDesignCode.toLowerCase() && c.id !== editingCard?.id);
    if (duplicate) {
      alert(`A wedding card with Design Code "${cleanDesignCode}" already exists. Please use a unique design code.`);
      return;
    }

    try {
      const cardId = editingCard ? editingCard.id : `wc_${cleanDesignCode.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      const mainImg = frontImage.trim() || insideImage.trim() || backImage.trim() || sampleImages[0] || STUDIO_IMAGES.royalWeddingInvite;

      const parsedColors = availableColorsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 20);
      const parsedFinishes = availableFinishesText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 20);
      const parsedQuantities = quantityOptionsText
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => !Number.isNaN(n) && n >= 1)
        .slice(0, 20);
      const cleanSamples = sampleImages
        .map(u => u.trim())
        .filter(u => u.length > 0 && u.length <= 2048)
        .slice(0, 20);

      const effectiveDigital = isDigital || category.toLowerCase().includes('digital wedding') || category.toLowerCase().includes('invitation video');

      const rawPayload: WeddingCardItem = {
        id: cardId,
        designCode: cleanDesignCode,
        name: name.trim(),
        title: name.trim(),
        category: category.trim(),
        price: Number(price) || 0,
        ...(discountPrice !== '' && Number(discountPrice) > 0 ? { discountPrice: Number(discountPrice) } : {}),
        minOrderQuantity: effectiveDigital ? 1 : Math.max(1, Number(minOrderQuantity) || 50),
        printingCharge: effectiveDigital ? 0 : Math.max(0, Number(printingCharge) || 0),
        customizationCharge: Math.max(0, Number(customizationCharge) || 0),
        shippingCharge: effectiveDigital ? 0 : Math.max(0, Number(shippingCharge) || 0),
        estimatedProductionTime: estimatedProductionTime.trim() || (effectiveDigital ? '24-48 Hours' : '5-7 Business Days'),
        paperType: paperType.trim(),
        paperQuality: paperType.trim(),
        printingType: printingType.trim(),
        size: size.trim(),
        color: color.trim(),
        availableColors: parsedColors.length > 0 ? parsedColors : [color.trim() || 'Royal Maroon'],
        availableFinishes: parsedFinishes,
        quantityOptions: parsedQuantities,
        customizationAvailable,
        isDigital: effectiveDigital,
        ...(effectiveDigital ? { digitalType } : {}),
        enableGst: true,
        gstPercent: effectiveDigital ? 18 : 12,
        description: description.trim(),
        isAvailable,
        isFeatured,
        whatsappNumber: whatsappNumber.trim() || '+917905256355',
        mainImage: mainImg,
        images: {
          front: frontImage.trim() || mainImg,
          inside: insideImage.trim(),
          back: backImage.trim()
        },
        sampleImages: cleanSamples,
        ...(videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
        createdAt: editingCard?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const payload = stripUndefined(rawPayload);
      await setDoc(doc(db, 'wedding_cards', cardId), payload);
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving wedding card:', err);
      if (err?.code === 'permission-denied') {
        try {
          handleFirestoreError(err, OperationType.WRITE, 'wedding_cards');
        } catch {
          // logged
        }
      }
      alert('Failed to save wedding card. Check console for validation details.');
    }
  };

  const handleAddStarterTemplates = async () => {
    setSeedingTemplates(true);
    let added = 0;
    try {
      const nowIso = new Date().toISOString();
      for (const tpl of STARTER_CATEGORY_TEMPLATES) {
        const exists = cards.some(c => c.id === tpl.id || c.designCode?.toLowerCase() === tpl.designCode?.toLowerCase());
        if (!exists) {
          await setDoc(
            doc(db, 'wedding_cards', tpl.id),
            stripUndefined({
              ...tpl,
              createdAt: nowIso,
              updatedAt: nowIso
            })
          );
          added++;
        }
      }
      alert(added > 0 ? `Added ${added} starter wedding & digital invitation templates without modifying existing designs.` : 'All starter templates already exist in your catalog.');
    } catch (err: any) {
      console.error('Error adding starter templates:', err);
      alert('Could not add starter templates: ' + (err?.message || err));
    } finally {
      setSeedingTemplates(false);
    }
  };

  const handleToggleAvailable = async (card: WeddingCardItem) => {
    try {
      await updateDoc(doc(db, 'wedding_cards', card.id), {
        isAvailable: !card.isAvailable,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  const handleToggleFeatured = async (card: WeddingCardItem) => {
    try {
      await updateDoc(doc(db, 'wedding_cards', card.id), {
        isFeatured: !card.isFeatured,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error toggling featured status:', err);
    }
  };

  const handleDeleteCard = async (card: WeddingCardItem) => {
    if (window.confirm(`Are you sure you want to delete Wedding Card design code "${card.designCode}" (${card.name || card.title})?`)) {
      try {
        await deleteDoc(doc(db, 'wedding_cards', card.id));
      } catch (err) {
        console.error('Error deleting wedding card:', err);
        alert('Failed to delete wedding card.');
      }
    }
  };

  // Proof Workflow Handlers
  const openProofDrawer = (order: Order) => {
    setSelectedOrderForProof(order);
    setProofUrlInput('');
    setProofFileName('');
    setProofDesignerNote('');
    setProofFileType(order.items.some(i => i.isDigital && i.digitalType?.toLowerCase().includes('video')) ? 'video' : 'image');
    setDigitalDeliverableUrlInput(order.digitalDeliverableUrl || '');
    setDigitalDeliverableNameInput(order.digitalDeliverableName || '');
  };

  const handleProofFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProofFile(true);
    try {
      const rec = await uploadOriginalClientPhoto(file, 'Studio Designer');
      setProofUrlInput(rec.originalFileUrl || rec.url || '');
      setProofFileName(rec.originalFileName || file.name);
      if (file.type.startsWith('video/')) setProofFileType('video');
      else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) setProofFileType('pdf');
      else setProofFileType('image');
    } catch (err) {
      console.error('Proof upload error:', err);
      alert('Could not upload proof file. You can paste a direct URL instead.');
    } finally {
      setUploadingProofFile(false);
      e.target.value = '';
    }
  };

  const handleSubmitNewProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForProof) return;
    const cleanUrl = proofUrlInput.trim();
    if (!cleanUrl) {
      alert('Please upload a proof file or paste a proof image/PDF/video URL.');
      return;
    }

    setSubmittingProof(true);
    try {
      const existingVersions = selectedOrderForProof.proofVersions || [];
      const nextVersionNum = existingVersions.length + 1;
      const nowIso = new Date().toISOString();

      const newProofEntry: ProofVersion = stripUndefined({
        version: nextVersionNum,
        proofUrl: cleanUrl,
        fileType: proofFileType,
        fileName: proofFileName || `Proof_v${nextVersionNum}`,
        ...(proofDesignerNote.trim() ? { notes: proofDesignerNote.trim() } : {}),
        uploadedAt: nowIso,
        status: 'Pending Review'
      });

      const updatedVersions = [...existingVersions, newProofEntry];
      const nextOrderStatus: Order['status'] =
        selectedOrderForProof.status === 'Pending' || selectedOrderForProof.status === 'Accepted'
          ? 'Designing'
          : selectedOrderForProof.status;

      await updateDoc(doc(db, 'orders', selectedOrderForProof.id), {
        proofVersions: updatedVersions,
        proofStatus: 'Proof Uploaded',
        status: nextOrderStatus,
        updatedAt: nowIso
      });

      setProofUrlInput('');
      setProofFileName('');
      setProofDesignerNote('');
    } catch (err: any) {
      console.error('Error saving new proof version:', err);
      alert('Failed to attach design proof: ' + (err?.message || err));
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error updating card order status:', err);
      alert('Failed to update order status.');
    }
  };

  const handleDeliverableUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDeliverable(true);
    try {
      const rec = await uploadOriginalClientPhoto(file, 'Studio Designer');
      setDigitalDeliverableUrlInput(rec.originalFileUrl || rec.url || '');
      setDigitalDeliverableNameInput(rec.originalFileName || file.name);
    } catch (err) {
      console.error('Digital deliverable upload error:', err);
      alert('Could not upload final deliverable file.');
    } finally {
      setUploadingDeliverable(false);
      e.target.value = '';
    }
  };

  const handleSaveDigitalDeliverable = async () => {
    if (!selectedOrderForProof || !digitalDeliverableUrlInput.trim()) return;
    setSubmittingProof(true);
    try {
      await updateDoc(doc(db, 'orders', selectedOrderForProof.id), {
        digitalDeliverableUrl: digitalDeliverableUrlInput.trim(),
        digitalDeliverableName: digitalDeliverableNameInput.trim() || `SHIV_STUDIO_${selectedOrderForProof.id}`,
        updatedAt: new Date().toISOString()
      });
      alert('Final Digital Invitation deliverable saved & unlocked in customer portal!');
    } catch (err: any) {
      console.error('Error saving digital deliverable:', err);
      alert('Failed to save digital deliverable.');
    } finally {
      setSubmittingProof(false);
    }
  };

  // Filtered Catalog List
  const existingCategoriesInDb: string[] = Array.from(
    new Set<string>(cards.map(c => c.category).filter((c): c is string => Boolean(c)))
  );
  const categoryFilterButtons = [
    'ALL',
    ...ALL_WEDDING_CARD_CATEGORIES,
    ...existingCategoriesInDb.filter(c => !(ALL_WEDDING_CARD_CATEGORIES as readonly string[]).includes(c))
  ];

  const filteredCards = cards.filter(card => {
    const cardTitle = card.name || card.title || '';
    const matchesSearch =
      card.designCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cardTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.paperType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.paperQuality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.color?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || card.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtered Orders List
  const filteredCardOrders = orders.filter(ord => {
    if (proofFilter === 'ALL') return true;
    if (proofFilter === 'DIGITAL') return ord.items.some(i => i.isDigital);
    return (ord.proofStatus || 'Awaiting Proof') === proofFilter;
  });

  const totalCards = cards.length;
  const availableCards = cards.filter(c => c.isAvailable !== false).length;
  const digitalCards = cards.filter(c => isDigitalWeddingCard(c)).length;
  const featuredCards = cards.filter(c => c.isFeatured).length;
  const awaitingProofCount = orders.filter(o => (o.proofStatus || 'Awaiting Proof') === 'Awaiting Proof').length;
  const revisionRequestedCount = orders.filter(o => o.proofStatus === 'Revision Requested').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Tab Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Wedding Cards &amp; Digital Invitations</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage 11 invitation categories, dynamic printing/customization charges, customer proofs, and digital invitation delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSubTab('catalog')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'catalog'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Card Catalog ({totalCards})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('orders')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'orders'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Card Orders &amp; Proofs ({orders.length})</span>
              {(awaitingProofCount > 0 || revisionRequestedCount > 0) && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px]">
                  {awaitingProofCount + revisionRequestedCount}
                </span>
              )}
            </button>
          </div>

          {activeSubTab === 'catalog' && (
            <>
              <button
                type="button"
                disabled={seedingTemplates}
                onClick={handleAddStarterTemplates}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                title="Safely add sample cards for new Wedding & Digital Invitation categories without touching existing cards"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>{seedingTemplates ? 'Adding...' : 'Add Starter Templates'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-all text-xs shrink-0"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Add New Card / E-Invite</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= TAB 1: CATALOG & PRICING ================= */}
      {activeSubTab === 'catalog' && (
        <>
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <p className="text-xxs text-slate-400 uppercase font-mono">Total Design Codes</p>
              <p className="text-2xl font-bold text-white mt-1">{totalCards}</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <p className="text-xxs text-emerald-400 uppercase font-mono">Available Designs</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{availableCards}</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <p className="text-xxs text-amber-400 uppercase font-mono">Digital &amp; Video Invites</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{digitalCards}</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <p className="text-xxs text-amber-300 uppercase font-mono">Featured Cards</p>
              <p className="text-2xl font-bold text-amber-300 mt-1">{featuredCards}</p>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Design Code, Card Name, Paper..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xxs text-slate-400 font-mono uppercase shrink-0">Category:</span>
              {categoryFilterButtons.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-medium transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading Wedding Cards from Firestore...</div>
          ) : filteredCards.length === 0 ? (
            <div className="py-12 text-center bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
              <p className="text-slate-300 font-semibold text-sm">No Wedding Cards match your criteria</p>
              <p className="text-slate-500 text-xs">Clear filters or add a new design using the button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card) => {
                const digitalCard = isDigitalWeddingCard(card);
                const cardTitle = card.name || card.title || `Design ${card.designCode}`;
                const cardImg = getCardPrimaryImage(card);

                return (
                  <div
                    key={card.id}
                    className={`group bg-slate-900/90 border rounded-2xl overflow-hidden transition-all duration-300 hover:border-amber-500/50 flex flex-col justify-between ${
                      card.isAvailable === false ? 'border-rose-900/30 opacity-75' : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                        <StudioImage
                          src={cardImg}
                          fallback={STUDIO_IMAGES.royalWeddingInvite}
                          alt={cardTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center gap-1">
                          <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-bold font-mono text-xxs tracking-wider shadow-md">
                            {card.designCode || card.id}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {digitalCard && (
                              <span className="px-2 py-1 rounded-md bg-emerald-500 text-slate-950 font-bold text-[10px]">
                                DIGITAL
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(card)}
                              className={`p-1.5 rounded-md backdrop-blur-md transition-colors ${
                                card.isFeatured
                                  ? 'bg-amber-500/90 text-slate-950 font-bold'
                                  : 'bg-slate-950/80 text-slate-400 hover:text-amber-400'
                              }`}
                              title={card.isFeatured ? 'Featured on Website' : 'Click to Feature'}
                            >
                              <Star className="h-3.5 w-3.5 fill-current" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleAvailable(card)}
                              className={`px-2 py-1 rounded-md text-xxs font-bold backdrop-blur-md transition-colors ${
                                card.isAvailable !== false
                                  ? 'bg-emerald-500/80 text-white'
                                  : 'bg-rose-500/80 text-white'
                              }`}
                              title="Toggle Stock Availability"
                            >
                              {card.isAvailable !== false ? 'Available' : 'Out of Stock'}
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewImage(cardImg)}
                          className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 backdrop-blur-sm transition-all"
                          title="Zoom Cover"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-xxs text-amber-400 font-mono uppercase font-semibold">{card.category}</span>
                            <h3 className="font-bold text-white text-base leading-snug line-clamp-1">{cardTitle}</h3>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-lg font-extrabold text-amber-400">₹{card.price}</span>
                            <p className="text-xxs text-slate-400 font-mono">{digitalCard ? 'flat pack' : '/ card'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xxs text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                          <div>
                            <span className="text-slate-500 block">Paper / Format:</span>
                            <span className="text-slate-200 font-semibold truncate block">{card.paperQuality || card.paperType || 'Standard'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">MOQ / Prod:</span>
                            <span className="text-amber-400 font-bold truncate block">
                              {digitalCard ? '1 (Digital)' : `${card.minOrderQuantity || 50} pcs`} • {card.estimatedProductionTime || '5-7d'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Print + Custom Fee:</span>
                            <span className="text-slate-200 block">
                              ₹{card.printingCharge ?? (digitalCard ? 0 : 500)} + ₹{card.customizationCharge ?? (digitalCard ? 0 : 350)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Shipping Fee:</span>
                            <span className="text-slate-200 block">
                              {digitalCard ? '₹0 (Online)' : `₹${card.shippingCharge ?? 0}`}
                            </span>
                          </div>
                        </div>

                        {card.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{card.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center">
                      <div className="flex items-center space-x-1 text-xxs text-slate-500 font-mono truncate max-w-[160px]">
                        <span>Colors:</span>
                        <span className="text-slate-300 font-medium truncate">
                          {card.availableColors?.length ? card.availableColors.join(', ') : (card.color || 'Multi')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(card)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Card"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Delete Card"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ================= TAB 2: ORDERS & PROOF WORKFLOW ================= */}
      {activeSubTab === 'orders' && (
        <div className="space-y-5">
          {/* Proof Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {[
              { id: 'ALL', label: `All Card Orders (${orders.length})` },
              { id: 'Awaiting Proof', label: `Awaiting Proof (${awaitingProofCount})` },
              { id: 'Proof Uploaded', label: 'Proof Uploaded' },
              { id: 'Revision Requested', label: `Revision Requested (${revisionRequestedCount})` },
              { id: 'Approved', label: 'Approved' },
              { id: 'DIGITAL', label: 'Digital Invites' }
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setProofFilter(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  proofFilter === pill.id
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {ordersLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading Wedding Card Orders...</div>
          ) : filteredCardOrders.length === 0 ? (
            <div className="py-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-slate-300 font-semibold text-sm">No customized wedding card orders found in this view.</p>
              <p className="text-slate-500 text-xs">When customers customize and purchase printed cards or digital invitations, they will appear here for proof upload &amp; tracking.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCardOrders.map((ord) => {
                const versions = ord.proofVersions || [];
                const cust = ord.weddingCardCustomization;
                const hasDigitalItem = ord.items.some(i => i.isDigital);

                return (
                  <div key={ord.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">#{ord.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            ord.proofStatus === 'Approved'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : ord.proofStatus === 'Revision Requested'
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                : ord.proofStatus === 'Proof Uploaded'
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            Proof: {ord.proofStatus || 'Awaiting Proof'} (v{versions.length})
                          </span>
                          {hasDigitalItem && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold font-mono">
                              DIGITAL INVITATION
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-white text-sm">
                          {ord.customerName} • <span className="text-slate-400 font-normal">{ord.customerPhone}</span>
                        </h3>
                        {cust && (
                          <p className="text-xs text-amber-300">
                            {cust.groomName} weds {cust.brideName} • {cust.weddingDate} ({cust.language})
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="text-right mr-2">
                          <span className="text-[10px] text-slate-400 font-mono block">TOTAL PAID</span>
                          <span className="text-base font-extrabold text-amber-400">₹{ord.total.toLocaleString('en-IN')}</span>
                        </div>

                        <select
                          value={ord.status}
                          onChange={(e) => handleOrderStatusChange(ord.id, e.target.value as Order['status'])}
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 outline-none focus:border-amber-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Designing">Designing</option>
                          <option value="Printing">Printing</option>
                          <option value="Ready">Ready</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => openProofDrawer(ord)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Manage Details &amp; Proofs</span>
                        </button>
                      </div>
                    </div>

                    {/* Items & Revision Alert */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-500">Ordered Card Designs</span>
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="text-slate-200 flex justify-between gap-2">
                            <span className="truncate">
                              {it.productTitle} × {it.quantity}
                              {it.selectedColor ? ` (${it.selectedColor})` : ''}
                            </span>
                            <span className="text-amber-400 font-mono shrink-0">
                              ₹{(it.price * it.quantity + (it.printingCharge || 0) + (it.customizationCharge || 0)).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-500">Latest Proof &amp; Customer Feedback</span>
                        {ord.revisionNotes ? (
                          <p className="text-rose-300 font-medium">
                            Revision Requested: "{ord.revisionNotes}"
                          </p>
                        ) : ord.proofStatus === 'Approved' ? (
                          <p className="text-emerald-400 font-medium">
                            Approved by customer on {ord.approvedAt ? new Date(ord.approvedAt).toLocaleDateString('en-IN') : 'N/A'} — Ready for final print/delivery.
                          </p>
                        ) : (
                          <p className="text-slate-400">
                            {versions.length > 0
                              ? `Proof v${versions.length} uploaded — waiting for customer approval.`
                              : 'No digital proof uploaded yet. Click "Manage Details & Proofs" to upload.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= ADD / EDIT CARD MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-bold text-white">
                  {editingCard ? `Edit Card (${editingCard.designCode})` : 'Add New Wedding Card / Digital Invite'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Product / Design Code *</label>
                  <input
                    type="text"
                    required
                    value={designCode}
                    onChange={(e) => setDesignCode(e.target.value)}
                    placeholder="e.g. WC-RY201"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Card Design Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Royal Gold Foil Gatefold Invitation"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <optgroup label="Core Invitation Categories">
                      {ALL_WEDDING_CARD_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Legacy Styles">
                      {LEGACY_WEDDING_CARD_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">
                    {isDigital ? 'Digital Package Price (₹)' : 'Price Per Card (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Offer Discount Price (₹ opt)</label>
                  <input
                    type="number"
                    min="0"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Optional"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Dynamic Charges & Production */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-amber-400 mb-1">Min Order Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={isDigital}
                    value={isDigital ? 1 : minOrderQuantity}
                    onChange={(e) => setMinOrderQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-amber-400 mb-1">Printing Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={isDigital}
                    value={isDigital ? 0 : printingCharge}
                    onChange={(e) => setPrintingCharge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-amber-400 mb-1">Customization Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={customizationCharge}
                    onChange={(e) => setCustomizationCharge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-amber-400 mb-1">Shipping Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={isDigital}
                    value={isDigital ? 0 : shippingCharge}
                    onChange={(e) => setShippingCharge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Paper Quality / Format</label>
                  <input
                    type="text"
                    value={paperType}
                    onChange={(e) => setPaperType(e.target.value)}
                    placeholder="e.g. 350 GSM Velvet Metallic"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Printing / Craft Type</label>
                  <input
                    type="text"
                    value={printingType}
                    onChange={(e) => setPrintingType(e.target.value)}
                    placeholder="e.g. Foil Stamping & Embossing"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Card Size</label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. 7.5 x 10.5 Inches"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Estimated Production Time</label>
                  <input
                    type="text"
                    value={estimatedProductionTime}
                    onChange={(e) => setEstimatedProductionTime(e.target.value)}
                    placeholder="e.g. 5-7 Business Days"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Default Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Royal Maroon"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">WhatsApp Order Number</label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+917905256355"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Colors, Finishes & Quick Quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Available Colors (comma sep)</label>
                  <input
                    type="text"
                    value={availableColorsText}
                    onChange={(e) => setAvailableColorsText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Available Finishes (comma sep)</label>
                  <input
                    type="text"
                    value={availableFinishesText}
                    onChange={(e) => setAvailableFinishesText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Quick Qty Presets (comma sep)</label>
                  <input
                    type="text"
                    value={quantityOptionsText}
                    onChange={(e) => setQuantityOptionsText(e.target.value)}
                    placeholder="100, 200, 300, 500"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Digital Options */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDigital}
                      onChange={(e) => {
                        setIsDigital(e.target.checked);
                        if (e.target.checked) {
                          setMinOrderQuantity(1);
                          setPrintingCharge(0);
                          setShippingCharge(0);
                        }
                      }}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-emerald-400">Digital Invitation Product</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customizationAvailable}
                      onChange={(e) => setCustomizationAvailable(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 h-4 w-4"
                    />
                    <span className="text-xs text-slate-200 font-medium">Customization Available</span>
                  </label>
                </div>

                {isDigital && (
                  <select
                    value={digitalType}
                    onChange={(e) => setDigitalType(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-semibold outline-none focus:border-amber-500"
                  >
                    {DIGITAL_INVITATION_TYPES.map((dt) => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sample Images & Video */}
              <div className="space-y-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-xxs font-mono uppercase text-amber-400 font-bold">Sample Photography (Front, Inside, Back + Extra Gallery)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ImageField
                    label="Front Cover Image"
                    value={frontImage}
                    onChange={(url) => setFrontImage(url)}
                    storagePath="wedding_cards"
                    recommendedSize="800x600 px"
                  />
                  <ImageField
                    label="Inside Layout Image"
                    value={insideImage}
                    onChange={(url) => setInsideImage(url)}
                    storagePath="wedding_cards"
                    recommendedSize="800x600 px"
                  />
                  <ImageField
                    label="Back / Envelope Image"
                    value={backImage}
                    onChange={(url) => setBackImage(url)}
                    storagePath="wedding_cards"
                    recommendedSize="800x600 px"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Additional Sample Image URLs (1 per line)</label>
                    <textarea
                      rows={2}
                      value={sampleImages.join('\n')}
                      onChange={(e) => setSampleImages(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                      placeholder="https://..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-mono uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                      <Film className="h-3.5 w-3.5 text-amber-400" />
                      <span>Sample Invitation Video URL / Upload MP4</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://...mp4"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                      />
                      <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs cursor-pointer shrink-0">
                        {uploadingSampleVideo ? 'Uploading...' : 'Upload Video'}
                        <input type="file" accept="video/*" className="hidden" onChange={handleSampleVideoUpload} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Card Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe craftsmanship, insert details, paper weight, digital formats, or motif accents..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center space-x-6 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 h-4 w-4"
                  />
                  <span className="text-xs text-slate-300 font-medium">Available (In Stock)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 h-4 w-4"
                  />
                  <span className="text-xs text-amber-400 font-medium">Featured Card</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20"
                >
                  {editingCard ? 'Update Wedding Card' : 'Save Wedding Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ORDER DETAILS & PROOF UPLOAD MODAL ================= */}
      {selectedOrderForProof && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400">Wedding Card Order Atelier</span>
                <h3 className="text-lg font-bold text-white">
                  Order #{selectedOrderForProof.id} — {selectedOrderForProof.customerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForProof(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto text-xs">
              {/* Customer Customization Sheet */}
              {selectedOrderForProof.weddingCardCustomization ? (
                <div className="bg-slate-950 border border-amber-500/25 rounded-2xl p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-amber-400 uppercase font-mono text-xs flex items-center gap-1.5">
                      <Layers className="h-4 w-4" />
                      <span>Customer Customization Details ({selectedOrderForProof.weddingCardCustomization.language})</span>
                    </h4>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Color: {selectedOrderForProof.weddingCardCustomization.selectedColor || 'Default'} • Finish: {selectedOrderForProof.weddingCardCustomization.selectedFinish || 'Default'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-slate-300">
                    <div><span className="text-slate-500 block text-[10px] uppercase">Groom Name</span><span className="font-semibold text-white">{selectedOrderForProof.weddingCardCustomization.groomName}</span></div>
                    <div><span className="text-slate-500 block text-[10px] uppercase">Bride Name</span><span className="font-semibold text-white">{selectedOrderForProof.weddingCardCustomization.brideName}</span></div>
                    <div><span className="text-slate-500 block text-[10px] uppercase">Wedding Date &amp; Time</span><span className="font-semibold text-white">{selectedOrderForProof.weddingCardCustomization.weddingDate} {selectedOrderForProof.weddingCardCustomization.weddingTime || ''}</span></div>
                    <div><span className="text-slate-500 block text-[10px] uppercase">Groom Parents</span><span>{[selectedOrderForProof.weddingCardCustomization.groomFatherName, selectedOrderForProof.weddingCardCustomization.groomMotherName].filter(Boolean).join(' & ') || '—'}</span></div>
                    <div><span className="text-slate-500 block text-[10px] uppercase">Bride Parents</span><span>{[selectedOrderForProof.weddingCardCustomization.brideFatherName, selectedOrderForProof.weddingCardCustomization.brideMotherName].filter(Boolean).join(' & ') || '—'}</span></div>
                    <div><span className="text-slate-500 block text-[10px] uppercase">Venue</span><span>{selectedOrderForProof.weddingCardCustomization.venueName}</span></div>
                    <div className="sm:col-span-2 lg:col-span-3"><span className="text-slate-500 block text-[10px] uppercase">Venue Address</span><span>{selectedOrderForProof.weddingCardCustomization.venueAddress}</span></div>
                    {selectedOrderForProof.weddingCardCustomization.additionalFunctions && (
                      <div className="sm:col-span-2"><span className="text-slate-500 block text-[10px] uppercase">Additional Functions</span><span>{selectedOrderForProof.weddingCardCustomization.additionalFunctions}</span></div>
                    )}
                    {selectedOrderForProof.weddingCardCustomization.rsvpDetails && (
                      <div><span className="text-slate-500 block text-[10px] uppercase">RSVP</span><span>{selectedOrderForProof.weddingCardCustomization.rsvpDetails}</span></div>
                    )}
                    {selectedOrderForProof.weddingCardCustomization.specialInstructions && (
                      <div className="sm:col-span-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-amber-400 block text-[10px] uppercase font-mono">Special Instructions</span>
                        <p className="text-white mt-0.5">{selectedOrderForProof.weddingCardCustomization.specialInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic">No card customization details attached to this order.</p>
              )}

              {/* Customer Reference Files */}
              {(selectedOrderForProof.uploadedFiles?.length || 0) > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <p className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                    Customer Reference Photos &amp; Designs ({selectedOrderForProof.uploadedFiles!.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedOrderForProof.uploadedFiles!.map((f, idx) => {
                      const fUrl = f.originalFileUrl || f.url || '';
                      const fName = f.originalFileName || f.name || `Reference_${idx + 1}`;
                      return (
                        <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                          <span className="truncate text-white font-medium">{fName}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={isFsMediaUrl(fUrl) ? '#download-ref' : fUrl}
                              target={isFsMediaUrl(fUrl) ? undefined : '_blank'}
                              rel={isFsMediaUrl(fUrl) ? undefined : 'noopener noreferrer'}
                              onClick={(e) => {
                                if (isFsMediaUrl(fUrl)) {
                                  e.preventDefault();
                                  downloadOriginalFile(fUrl, fName);
                                }
                              }}
                              className="px-2 py-1 bg-slate-800 text-slate-200 rounded text-[10px] font-bold"
                            >
                              {isFsMediaUrl(fUrl) ? 'Download' : 'View'}
                            </a>
                            <button
                              type="button"
                              onClick={() => downloadOriginalFile(fUrl, fName)}
                              className="px-2 py-1 bg-amber-500 text-slate-950 rounded text-[10px] font-bold flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Revision Feedback Banner */}
              {selectedOrderForProof.proofStatus === 'Revision Requested' && selectedOrderForProof.revisionNotes && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-200 space-y-1">
                  <span className="font-mono text-[10px] font-bold uppercase text-rose-400 flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Customer Requested Revisions</span>
                  </span>
                  <p className="text-xs font-medium">"{selectedOrderForProof.revisionNotes}"</p>
                </div>
              )}

              {/* Proof History */}
              {(selectedOrderForProof.proofVersions?.length || 0) > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <p className="text-[11px] font-mono uppercase text-amber-400 font-bold">
                    Uploaded Proof History ({selectedOrderForProof.proofVersions!.length})
                  </p>
                  <div className="space-y-2">
                    {selectedOrderForProof.proofVersions!.map((pv) => (
                      <div key={pv.version} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">Proof v{pv.version}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pv.status === 'Approved'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : pv.status === 'Revision Requested'
                                  ? 'bg-rose-500/15 text-rose-300'
                                  : 'bg-amber-500/15 text-amber-300'
                            }`}>
                              {pv.status}
                            </span>
                            <span className="text-slate-500 text-[10px]">{new Date(pv.uploadedAt).toLocaleString('en-IN')}</span>
                          </div>
                          {pv.notes && <p className="text-slate-400 text-[11px]">Designer note: {pv.notes}</p>}
                          {pv.customerFeedback && <p className="text-rose-300 text-[11px]">Client feedback: {pv.customerFeedback}</p>}
                        </div>
                        <a
                          href={isFsMediaUrl(pv.proofUrl) ? '#download-proof' : pv.proofUrl}
                          target={isFsMediaUrl(pv.proofUrl) ? undefined : '_blank'}
                          rel={isFsMediaUrl(pv.proofUrl) ? undefined : 'noopener noreferrer'}
                          onClick={(e) => {
                            if (isFsMediaUrl(pv.proofUrl)) {
                              e.preventDefault();
                              downloadOriginalFile(pv.proofUrl, pv.fileName || `Proof_v${pv.version}`);
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg text-[11px] shrink-0 text-center"
                        >
                          {isFsMediaUrl(pv.proofUrl) ? 'Download Proof File' : 'Open Proof File'}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Proof Form */}
              <form onSubmit={handleSubmitNewProof} className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-amber-400 uppercase font-mono text-xs flex items-center gap-1.5">
                  <Send className="h-4 w-4" />
                  <span>Upload Digital Proof v{(selectedOrderForProof.proofVersions?.length || 0) + 1} for Customer Approval</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Upload Proof (Image / PDF / Video) or Paste URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={proofUrlInput}
                        onChange={(e) => setProofUrlInput(e.target.value)}
                        placeholder="https://... proof URL"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                      />
                      <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs cursor-pointer shrink-0">
                        {uploadingProofFile ? 'Uploading...' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/*,.pdf,video/*"
                          className="hidden"
                          onChange={handleProofFileSelect}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Proof Format</label>
                    <select
                      value={proofFileType}
                      onChange={(e) => setProofFileType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    >
                      <option value="image">Image Proof</option>
                      <option value="pdf">PDF Proof</option>
                      <option value="video">Video Invitation Proof</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Designer Note to Customer (optional)</label>
                  <input
                    type="text"
                    value={proofDesignerNote}
                    onChange={(e) => setProofDesignerNote(e.target.value)}
                    placeholder="e.g. Please verify spelling of both families, auspicious timing, and venue address."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingProof || uploadingProofFile}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider"
                  >
                    {submittingProof ? 'Sending Proof...' : 'Publish Proof to Customer Portal'}
                  </button>
                </div>
              </form>

              {/* Final Digital Invitation Deliverable Section */}
              <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-5 space-y-3">
                <h4 className="font-bold text-emerald-400 uppercase font-mono text-xs flex items-center gap-1.5">
                  <Download className="h-4 w-4" />
                  <span>Final Approved Digital Invitation Deliverable (WhatsApp / HD PDF / Video)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 flex gap-2">
                    <input
                      type="text"
                      value={digitalDeliverableUrlInput}
                      onChange={(e) => setDigitalDeliverableUrlInput(e.target.value)}
                      placeholder="Final downloadable digital invitation file URL"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                    <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-xl text-xs cursor-pointer shrink-0">
                      {uploadingDeliverable ? 'Uploading...' : 'Upload Final File'}
                      <input type="file" accept="image/*,.pdf,video/*,.zip" className="hidden" onChange={handleDeliverableUpload} />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={digitalDeliverableNameInput}
                    onChange={(e) => setDigitalDeliverableNameInput(e.target.value)}
                    placeholder="Display File Name"
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={submittingProof || uploadingDeliverable || !digitalDeliverableUrlInput.trim()}
                    onClick={handleSaveDigitalDeliverable}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider"
                  >
                    Save Final Digital Download for Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-2">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/80 text-slate-300 hover:text-white transition-all"
            >
              <X className="h-6 w-6" />
            </button>
            <StudioImage
              src={previewImage}
              fallback={STUDIO_IMAGES.royalWeddingInvite}
              alt="Zoom Preview"
              className="w-full max-h-[85vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
