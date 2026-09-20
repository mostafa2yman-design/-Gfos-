import { PurchaseInvoice } from '../types';

const PURCHASES_KEY = 'accounting_purchases_v1';

function getItems<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Failed to parse ${key}:`, error);
    return [];
  }
}

function saveItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

const getDefaultPurchases = (): PurchaseInvoice[] => {
  return [
    {
      id: 'pur_1',
      invoiceNumber: 'PUR-2026-001',
      date: '2026-09-20',
      supplierId: 'supp_1',
      supplierName: 'شركة النيل للغزل والمنسوجات',
      supplierPhone: '01012345678',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      referenceNumber: 'REF-7890',
      notes: 'توريد دفعة قماش قطن سنجل جيرسي مع خيوط خياطة خاصة بأمر الإنتاج الجديد',
      receiptStatus: 'received',
      items: [
        {
          id: 'item_1_1',
          materialId: 'mat_1',
          materialName: 'قماش قطن سنجل جيرسي 100%',
          materialType: 'fabric',
          unit: 'كجم',
          quantity: 350,
          unitPrice: 220,
          discount: 1000,
          total: 76000,
          notes: 'صبغة ناصعة البياض درجة أولى',
        },
        {
          id: 'item_1_2',
          materialId: 'mat_6',
          materialName: 'خيط خياطة سبان 40/2 بكرة 5000 ياردة',
          materialType: 'accessory',
          unit: 'بكرة',
          quantity: 40,
          unitPrice: 45,
          discount: 0,
          total: 1800,
          notes: 'لون أبيض وأسود',
        },
      ],
      subtotal: 78800,
      discountTotal: 1000,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: 77800,
      paidAmount: 77800,
      remainingAmount: 0,
      createdAt: '2026-09-20T09:30:00.000Z',
    },
    {
      id: 'pur_2',
      invoiceNumber: 'PUR-2026-002',
      date: '2026-09-18',
      supplierId: 'supp_2',
      supplierName: 'مؤسسة الأهرام لمستلزمات الخياطة والتطريز',
      supplierPhone: '01123456789',
      paymentMethod: 'credit',
      paymentStatus: 'partial',
      referenceNumber: 'INV-4412',
      notes: 'مستلزمات إكسسوارات وسوست وأزرار شتوية - سداد جزئي والباقي آجل 30 يوم',
      receiptStatus: 'received',
      items: [
        {
          id: 'item_2_1',
          materialId: 'mat_7',
          materialName: 'سوستة نحاس معدنية 20 سم بنطلون',
          materialType: 'accessory',
          unit: 'دزينة',
          quantity: 50,
          unitPrice: 120,
          discount: 200,
          total: 5800,
          notes: 'نحاس عتيق ممتاز',
        },
        {
          id: 'item_2_2',
          materialId: 'mat_9',
          materialName: 'أزرار بوليستر قميص 18 ليني (1000 زر)',
          materialType: 'accessory',
          unit: 'باكو',
          quantity: 30,
          unitPrice: 85,
          discount: 100,
          total: 2450,
        },
        {
          id: 'item_2_3',
          materialId: 'mat_13',
          materialName: 'شريط مطاط كمر 4 سم عالي المرونة',
          materialType: 'accessory',
          unit: 'لفة (50 متر)',
          quantity: 25,
          unitPrice: 110,
          discount: 0,
          total: 2750,
        },
      ],
      subtotal: 11300,
      discountTotal: 300,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: 11000,
      paidAmount: 5000,
      remainingAmount: 6000,
      createdAt: '2026-09-18T11:15:00.000Z',
    },
    {
      id: 'pur_3',
      invoiceNumber: 'PUR-2026-003',
      date: '2026-09-12',
      supplierId: 'supp_3',
      supplierName: 'مصنع الإسكندرية للغزول والميلتون',
      supplierPhone: '01234567890',
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      referenceNumber: 'TRF-9021',
      notes: 'خامات موسم الشتاء: ميلتون مبطن وجينز - تحويل بنكي فوري من حساب الشركة',
      receiptStatus: 'received',
      items: [
        {
          id: 'item_3_1',
          materialId: 'mat_2',
          materialName: 'قماش ميلتون مبطن شتوي ثقيل',
          materialType: 'fabric',
          unit: 'كجم',
          quantity: 500,
          unitPrice: 280,
          discount: 4000,
          total: 136000,
          notes: 'ألوان كحلي وأسود وزيتي',
        },
        {
          id: 'item_3_2',
          materialId: 'mat_4',
          materialName: 'قماش جينز قطن 12 أوقية',
          materialType: 'fabric',
          unit: 'متر',
          quantity: 400,
          unitPrice: 165,
          discount: 2000,
          total: 64000,
        },
      ],
      subtotal: 206000,
      discountTotal: 6000,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: 200000,
      paidAmount: 200000,
      remainingAmount: 0,
      createdAt: '2026-09-12T14:20:00.000Z',
    },
    {
      id: 'pur_4',
      invoiceNumber: 'PUR-2026-004',
      date: '2026-09-05',
      supplierId: 'supp_4',
      supplierName: 'شركة الشرق الأوسط للكرتون والتغليف',
      supplierPhone: '01098765432',
      paymentMethod: 'credit',
      paymentStatus: 'unpaid',
      referenceNumber: 'DEL-338',
      notes: 'مستلزمات تعبئة وتغليف لشحن الطلبيات الجاهزة - استحقاق السداد نهاية الشهر',
      receiptStatus: 'received',
      items: [
        {
          id: 'item_4_1',
          materialId: 'mat_11',
          materialName: 'أكياس تغليف بولي بروبلين لاصق ذاتي',
          materialType: 'accessory',
          unit: 'باكو (100 كيس)',
          quantity: 100,
          unitPrice: 60,
          discount: 200,
          total: 5800,
        },
        {
          id: 'item_4_2',
          materialId: 'mat_12',
          materialName: 'كرتون شحن وتصدير 5 طبقات مقوى',
          materialType: 'accessory',
          unit: 'كرتونة',
          quantity: 300,
          unitPrice: 35,
          discount: 300,
          total: 10200,
        },
        {
          id: 'item_4_3',
          materialId: 'mat_10',
          materialName: 'تكت رقبة منسوج ساتان براند',
          materialType: 'accessory',
          unit: '1000 قطعة',
          quantity: 20,
          unitPrice: 350,
          discount: 0,
          total: 7000,
        },
      ],
      subtotal: 23500,
      discountTotal: 500,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: 23000,
      paidAmount: 0,
      remainingAmount: 23000,
      createdAt: '2026-09-05T16:00:00.000Z',
    },
    {
      id: 'pur_5',
      invoiceNumber: 'PUR-2026-005',
      date: '2026-08-25',
      supplierId: 'supp_1',
      supplierName: 'شركة النيل للغزل والمنسوجات',
      supplierPhone: '01012345678',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      referenceNumber: 'INV-7721',
      notes: 'توريدات أقمشة رياضية وبوليستر لشهر أغسطس',
      receiptStatus: 'received',
      items: [
        {
          id: 'item_5_1',
          materialId: 'mat_3',
          materialName: 'قماش بوليستر رياضي معالج ضد العرق',
          materialType: 'fabric',
          unit: 'كجم',
          quantity: 200,
          unitPrice: 190,
          discount: 500,
          total: 37500,
        },
        {
          id: 'item_5_2',
          materialId: 'mat_5',
          materialName: 'قماش ريب ليكرا للأساور والياقات',
          materialType: 'fabric',
          unit: 'كجم',
          quantity: 50,
          unitPrice: 240,
          discount: 0,
          total: 12000,
        },
      ],
      subtotal: 50000,
      discountTotal: 500,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: 49500,
      paidAmount: 49500,
      remainingAmount: 0,
      createdAt: '2026-08-25T10:00:00.000Z',
    },
  ];
};

export const getPurchases = (): PurchaseInvoice[] => {
  const items = getItems<PurchaseInvoice>(PURCHASES_KEY);
  if (items.length === 0) {
    const defaults = getDefaultPurchases();
    saveItems(PURCHASES_KEY, defaults);
    return defaults;
  }
  return items;
};

export const savePurchases = (items: PurchaseInvoice[]): void => {
  saveItems(PURCHASES_KEY, items);
  window.dispatchEvent(new CustomEvent('purchases_updated'));
};

export const addPurchase = (invoice: PurchaseInvoice): void => {
  const current = getPurchases();
  const updated = [invoice, ...current];
  savePurchases(updated);
};

export const updatePurchase = (invoice: PurchaseInvoice): void => {
  const current = getPurchases();
  const updated = current.map(item => item.id === invoice.id ? invoice : item);
  savePurchases(updated);
};

export const deletePurchase = (id: string): void => {
  const current = getPurchases();
  const updated = current.filter(item => item.id !== id);
  savePurchases(updated);
};

export const generateNextPurchaseInvoiceNumber = (): string => {
  const purchases = getPurchases();
  const year = new Date().getFullYear();
  const pattern = new RegExp(`PUR-${year}-(\\d+)`);
  let maxSeq = 0;
  for (const p of purchases) {
    const match = p.invoiceNumber?.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  }
  return `PUR-${year}-${String(maxSeq + 1).padStart(3, '0')}`;
};
