import React, { useState, useMemo } from 'react';
import { ProductionOrder, BatchItem } from '../../types';
import { saveOrder } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Boxes,
  Sparkles,
  Shirt,
  CheckCircle2,
  Flame,
  PackageCheck,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Layers,
  Calendar,
  User,
  Eye,
  X,
  RefreshCw,
  SlidersHorizontal,
  Info,
  Check,
  Tag,
  Kanban as KanbanIcon,
  Maximize2,
  Minimize2
} from 'lucide-react';

export type KanbanStageId = 'prep' | 'print' | 'sew' | 'finish' | 'ironing' | 'packing';

export interface KanbanStageConfig {
  id: KanbanStageId;
  name: string;
  orderTab: string;
  stepNumber: number;
  description: string;
  colorTheme: {
    bg: string;
    border: string;
    headerBg: string;
    headerText: string;
    badgeBg: string;
    badgeText: string;
    dropActiveBg: string;
    accent: string;
  };
  icon: React.ComponentType<{ className?: string }>;
}

export const KANBAN_STAGES: KanbanStageConfig[] = [
  {
    id: 'prep',
    name: '1. التجهيز والملحقات',
    orderTab: 'prep',
    stepNumber: 1,
    description: 'تجهيز مستلزمات الخياطة والقص والأكسسوارات',
    colorTheme: {
      bg: 'bg-amber-50/50',
      border: 'border-amber-200',
      headerBg: 'bg-amber-100/90',
      headerText: 'text-amber-900',
      badgeBg: 'bg-amber-200/80',
      badgeText: 'text-amber-900',
      dropActiveBg: 'bg-amber-100/70 border-amber-500 ring-2 ring-amber-400',
      accent: 'text-amber-600'
    },
    icon: Boxes
  },
  {
    id: 'print',
    name: '2. الطباعة والتطريز',
    orderTab: 'print',
    stepNumber: 2,
    description: 'الطباعة سلك سكرين أو التطريز الآلي',
    colorTheme: {
      bg: 'bg-purple-50/50',
      border: 'border-purple-200',
      headerBg: 'bg-purple-100/90',
      headerText: 'text-purple-900',
      badgeBg: 'bg-purple-200/80',
      badgeText: 'text-purple-900',
      dropActiveBg: 'bg-purple-100/70 border-purple-500 ring-2 ring-purple-400',
      accent: 'text-purple-600'
    },
    icon: Sparkles
  },
  {
    id: 'sew',
    name: '3. خطوط الخياطة',
    orderTab: 'sew',
    stepNumber: 3,
    description: 'تجميع وحياكة الأجزاء وخطوط الإنتاج',
    colorTheme: {
      bg: 'bg-blue-50/50',
      border: 'border-blue-200',
      headerBg: 'bg-blue-100/90',
      headerText: 'text-blue-900',
      badgeBg: 'bg-blue-200/80',
      badgeText: 'text-blue-900',
      dropActiveBg: 'bg-blue-100/70 border-blue-500 ring-2 ring-blue-400',
      accent: 'text-blue-600'
    },
    icon: Shirt
  },
  {
    id: 'finish',
    name: '4. التشطيب والتنظيف',
    orderTab: 'finish',
    stepNumber: 4,
    description: 'إزالة الخيوط الزائدة والتشطيب والفحص الأولي',
    colorTheme: {
      bg: 'bg-teal-50/50',
      border: 'border-teal-200',
      headerBg: 'bg-teal-100/90',
      headerText: 'text-teal-900',
      badgeBg: 'bg-teal-200/80',
      badgeText: 'text-teal-900',
      dropActiveBg: 'bg-teal-100/70 border-teal-500 ring-2 ring-teal-400',
      accent: 'text-teal-600'
    },
    icon: CheckCircle2
  },
  {
    id: 'ironing',
    name: '5. المكواة وفحص الجودة',
    orderTab: 'ironing',
    stepNumber: 5,
    description: 'الكي النهائي ومراقبة الجودة (QC)',
    colorTheme: {
      bg: 'bg-orange-50/50',
      border: 'border-orange-200',
      headerBg: 'bg-orange-100/90',
      headerText: 'text-orange-900',
      badgeBg: 'bg-orange-200/80',
      badgeText: 'text-orange-900',
      dropActiveBg: 'bg-orange-100/70 border-orange-500 ring-2 ring-orange-400',
      accent: 'text-orange-600'
    },
    icon: Flame
  },
  {
    id: 'packing',
    name: '6. جاهز للتغليف والتوريد',
    orderTab: 'packing',
    stepNumber: 6,
    description: 'التعبئة والكرتنة والتسليم للمخزن التام',
    colorTheme: {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-200',
      headerBg: 'bg-emerald-100/90',
      headerText: 'text-emerald-900',
      badgeBg: 'bg-emerald-200/80',
      badgeText: 'text-emerald-900',
      dropActiveBg: 'bg-emerald-100/70 border-emerald-500 ring-2 ring-emerald-400',
      accent: 'text-emerald-600'
    },
    icon: PackageCheck
  }
];

export interface KanbanBatchRecord {
  orderId: string;
  orderNumber: string;
  styleName: string;
  customerName: string;
  category: string;
  orderDate: string;
  batch: BatchItem;
  currentStage: KanbanStageId;
  totalPieces: number;
}

export function getBatchCurrentStage(batch: BatchItem): KanbanStageId {
  // If ironing is completed -> packing
  if (batch.ironingData?.status === 'مكتمل') {
    return 'packing';
  }
  // If ironing is started -> ironing
  if (batch.ironingData?.status === 'جاري') {
    return 'ironing';
  }
  // If finishing is completed -> ready for ironing
  if (batch.finishingData?.status === 'مكتمل') {
    return 'ironing';
  }
  // If finishing is started -> finishing
  if (batch.finishingData?.status === 'جاري') {
    return 'finish';
  }
  // If sewing is completed -> ready for finishing
  if (batch.sewingData?.status === 'مكتمل') {
    return 'finish';
  }
  // If sewing is started -> sewing
  if (batch.sewingData?.status === 'جاري') {
    return 'sew';
  }
  // Print / Embroidery stage
  const hasPrintEmb = batch.executionType && batch.executionType !== 'بدون طباعة / تطريز';
  if (hasPrintEmb && (batch.printEmbroideryStatus === 'مكتمل' || batch.printApprovedBy)) {
    return 'sew';
  }
  if (hasPrintEmb && (batch.printEmbroideryStatus === 'جاري' || batch.printEmbroideryStatus === 'في المطبعة / التطريز' as any)) {
    return 'print';
  }
  // If prep is completed
  if (batch.prepStatus === 'مكتمل' || batch.prepApprovedBy) {
    if (hasPrintEmb) {
      return 'print';
    }
    return 'sew';
  }
  // Default: prep
  return 'prep';
}

export function getBatchTotalQuantity(batch: BatchItem): number {
  let total = 0;
  if (!batch.sizes) return 0;
  for (const size of batch.sizes) {
    if (size.variants) {
      for (const variant of size.variants) {
        total += Number(variant.quantity) || 0;
      }
    }
  }
  return total;
}

interface ProductionBatchesKanbanProps {
  orders: ProductionOrder[];
  onOrdersChanged: () => void;
  onNavigateToOrder?: (orderId: string, tab?: string) => void;
  isCompactMode?: boolean;
}

export function ProductionBatchesKanban({
  orders,
  onOrdersChanged,
  onNavigateToOrder,
  isCompactMode = false
}: ProductionBatchesKanbanProps) {
  const { currentUser } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  const [selectedOrderId, setSelectedOrderId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [draggedBatch, setDraggedBatch] = useState<{ orderId: string; batchId: string } | null>(null);
  const [activeDropStage, setActiveDropStage] = useState<KanbanStageId | null>(null);
  const [inspectingBatch, setInspectingBatch] = useState<KanbanBatchRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Flatten all batches from active orders
  const allBatches: KanbanBatchRecord[] = useMemo(() => {
    const list: KanbanBatchRecord[] = [];
    orders.forEach(order => {
      // Ignore drafts or orders without batches
      if (order.status === 'مسودة' || !order.batches || order.batches.length === 0) return;

      order.batches.forEach(batch => {
        list.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          styleName: order.styleName || 'بدون اسم موديل',
          customerName: order.customerName || 'عميل عام',
          category: order.category || 'عام',
          orderDate: order.orderDate || order.createdAt || '',
          batch,
          currentStage: getBatchCurrentStage(batch),
          totalPieces: getBatchTotalQuantity(batch)
        });
      });
    });
    return list;
  }, [orders]);

  // Filter batches based on selection and search
  const filteredBatches = useMemo(() => {
    return allBatches.filter(item => {
      if (selectedOrderId !== 'all' && item.orderId !== selectedOrderId) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesOrder = item.orderNumber.toLowerCase().includes(q);
        const matchesBatch = item.batch.batchNumber.toLowerCase().includes(q);
        const matchesStyle = item.styleName.toLowerCase().includes(q);
        const matchesCustomer = item.customerName.toLowerCase().includes(q);
        if (!matchesOrder && !matchesBatch && !matchesStyle && !matchesCustomer) {
          return false;
        }
      }

      return true;
    });
  }, [allBatches, selectedOrderId, searchTerm]);

  // Group batches by stage
  const stageBatches = useMemo(() => {
    const map: Record<KanbanStageId, KanbanBatchRecord[]> = {
      prep: [],
      print: [],
      sew: [],
      finish: [],
      ironing: [],
      packing: []
    };

    filteredBatches.forEach(item => {
      if (map[item.currentStage]) {
        map[item.currentStage].push(item);
      } else {
        map.prep.push(item);
      }
    });

    return map;
  }, [filteredBatches]);

  // Aggregate stats
  const totalBatchesCount = filteredBatches.length;
  const totalPiecesCount = filteredBatches.reduce((acc, curr) => acc + curr.totalPieces, 0);

  // Transition a batch to a target stage
  const handleMoveBatchToStage = async (orderId: string, batchId: string, targetStage: KanbanStageId) => {
    try {
      setIsUpdating(true);
      const targetOrder = orders.find(o => o.id === orderId);
      if (!targetOrder || !targetOrder.batches) {
        notifyError('تعذر العثور على أمر الإنتاج المطلوب');
        return;
      }

      const batchIndex = targetOrder.batches.findIndex(b => b.id === batchId);
      if (batchIndex === -1) {
        notifyError('تعذر العثور على الباتش المطلوب في الأمر');
        return;
      }

      const currentBatch = targetOrder.batches[batchIndex];
      const previousStage = getBatchCurrentStage(currentBatch);
      if (previousStage === targetStage) {
        return; // Nothing to change
      }

      const now = new Date().toISOString();
      const userName = currentUser?.fullName || currentUser?.username || 'مدير الإنتاج';

      // Clone batch and mutate according to target stage
      const updatedBatch: BatchItem = { ...currentBatch };

      switch (targetStage) {
        case 'prep':
          updatedBatch.prepStatus = 'جاري';
          updatedBatch.printEmbroideryStatus = 'لم يبدأ';
          updatedBatch.sewingData = {
            ...(updatedBatch.sewingData || { actualQuantities: [] }),
            status: 'لم يبدأ'
          };
          updatedBatch.finishingData = {
            ...(updatedBatch.finishingData || { actualQuantities: [] }),
            status: 'لم يبدأ'
          };
          updatedBatch.ironingData = {
            ...(updatedBatch.ironingData || { actualQuantities: [] }),
            status: 'لم يبدأ'
          };
          break;

        case 'print':
          updatedBatch.prepStatus = 'مكتمل';
          if (!updatedBatch.prepApprovedBy) updatedBatch.prepApprovedBy = userName;
          if (!updatedBatch.prepApprovedAt) updatedBatch.prepApprovedAt = now;
          updatedBatch.printEmbroideryStatus = 'جاري';
          updatedBatch.sewingData = {
            ...(updatedBatch.sewingData || { actualQuantities: [] }),
            status: 'لم يبدأ'
          };
          updatedBatch.finishingData = {
            ...(updatedBatch.finishingData || { actualQuantities: [] }),
            status: 'لم يبدأ'
          };
          updatedBatch.ironingData = {
            ...(updatedBatch.ironingData || { actualQuantities: [] }),
            status: 'لم يبدأ'
          };
          break;

        case 'sew':
          updatedBatch.prepStatus = 'مكتمل';
          if (!updatedBatch.prepApprovedBy) updatedBatch.prepApprovedBy = userName;
          if (!updatedBatch.prepApprovedAt) updatedBatch.prepApprovedAt = now;
          if (updatedBatch.executionType && updatedBatch.executionType !== 'بدون طباعة / تطريز') {
            updatedBatch.printEmbroideryStatus = 'مكتمل';
            if (!updatedBatch.printApprovedBy) updatedBatch.printApprovedBy = userName;
            if (!updatedBatch.printApprovedAt) updatedBatch.printApprovedAt = now;
          }
          updatedBatch.sewingData = {
            ...(updatedBatch.sewingData || { actualQuantities: [] }),
            status: 'جاري'
          };
          updatedBatch.finishingData = {
            ...(updatedBatch.finishingData || { actualQuantities: [] }),
            status: 'لم يبدأ'
          };
          updatedBatch.ironingData = {
            ...(updatedBatch.ironingData || { actualQuantities: [] }),
            status: 'لم يبدأ'
          };
          break;

        case 'finish':
          updatedBatch.prepStatus = 'مكتمل';
          if (!updatedBatch.prepApprovedBy) updatedBatch.prepApprovedBy = userName;
          if (updatedBatch.executionType && updatedBatch.executionType !== 'بدون طباعة / تطريز') {
            updatedBatch.printEmbroideryStatus = 'مكتمل';
            if (!updatedBatch.printApprovedBy) updatedBatch.printApprovedBy = userName;
          }
          updatedBatch.sewingData = {
            ...(updatedBatch.sewingData || { actualQuantities: [] }),
            status: 'مكتمل',
            approvedBy: updatedBatch.sewingData?.approvedBy || userName,
            approvedAt: updatedBatch.sewingData?.approvedAt || now
          };
          updatedBatch.finishingData = {
            ...(updatedBatch.finishingData || { actualQuantities: [] }),
            status: 'جاري'
          };
          updatedBatch.ironingData = {
            ...(updatedBatch.ironingData || { actualQuantities: [] }),
            status: 'لم يبدأ'
          };
          break;

        case 'ironing':
          updatedBatch.prepStatus = 'مكتمل';
          if (!updatedBatch.prepApprovedBy) updatedBatch.prepApprovedBy = userName;
          if (updatedBatch.executionType && updatedBatch.executionType !== 'بدون طباعة / تطريز') {
            updatedBatch.printEmbroideryStatus = 'مكتمل';
          }
          updatedBatch.sewingData = {
            ...(updatedBatch.sewingData || { actualQuantities: [] }),
            status: 'مكتمل',
            approvedBy: updatedBatch.sewingData?.approvedBy || userName,
            approvedAt: updatedBatch.sewingData?.approvedAt || now
          };
          updatedBatch.finishingData = {
            ...(updatedBatch.finishingData || { actualQuantities: [] }),
            status: 'مكتمل',
            approvedBy: updatedBatch.finishingData?.approvedBy || userName,
            approvedAt: updatedBatch.finishingData?.approvedAt || now
          };
          updatedBatch.ironingData = {
            ...(updatedBatch.ironingData || { actualQuantities: [] }),
            status: 'جاري'
          };
          break;

        case 'packing':
          updatedBatch.prepStatus = 'مكتمل';
          if (!updatedBatch.prepApprovedBy) updatedBatch.prepApprovedBy = userName;
          if (updatedBatch.executionType && updatedBatch.executionType !== 'بدون طباعة / تطريز') {
            updatedBatch.printEmbroideryStatus = 'مكتمل';
          }
          updatedBatch.sewingData = {
            ...(updatedBatch.sewingData || { actualQuantities: [] }),
            status: 'مكتمل',
            approvedBy: updatedBatch.sewingData?.approvedBy || userName,
            approvedAt: updatedBatch.sewingData?.approvedAt || now
          };
          updatedBatch.finishingData = {
            ...(updatedBatch.finishingData || { actualQuantities: [] }),
            status: 'مكتمل',
            approvedBy: updatedBatch.finishingData?.approvedBy || userName,
            approvedAt: updatedBatch.finishingData?.approvedAt || now
          };
          updatedBatch.ironingData = {
            ...(updatedBatch.ironingData || { actualQuantities: [] }),
            status: 'مكتمل',
            approvedBy: updatedBatch.ironingData?.approvedBy || userName,
            approvedAt: updatedBatch.ironingData?.approvedAt || now
          };
          break;
      }

      // Update batches array
      const updatedBatches = [...targetOrder.batches];
      updatedBatches[batchIndex] = updatedBatch;

      // Check if all batches reached a higher state to synchronize order top-level status
      let newOrderStatus = targetOrder.status;
      if (updatedBatches.every(b => b.ironingData?.status === 'مكتمل')) {
        newOrderStatus = 'المكواة مكتملة';
      } else if (updatedBatches.some(b => b.ironingData?.status === 'جاري')) {
        newOrderStatus = 'المكواة جاري';
      } else if (updatedBatches.every(b => b.finishingData?.status === 'مكتمل')) {
        newOrderStatus = 'التشطيب مكتمل';
      } else if (updatedBatches.some(b => b.finishingData?.status === 'جاري')) {
        newOrderStatus = 'التشطيب جاري';
      } else if (updatedBatches.every(b => b.sewingData?.status === 'مكتمل')) {
        newOrderStatus = 'الخياطة مكتملة';
      }

      const updatedOrder: ProductionOrder = {
        ...targetOrder,
        status: newOrderStatus,
        batches: updatedBatches,
        updatedAt: now
      };

      const result = await saveOrder(updatedOrder);
      if (result.success) {
        const targetStageConfig = KANBAN_STAGES.find(s => s.id === targetStage);
        notifySuccess(
          `تم تحديث الباتش (${currentBatch.batchNumber}) بنجاح ونقله إلى مرحلة "${targetStageConfig?.name || targetStage}"`,
          `أمر الإنتاج ${targetOrder.orderNumber}`,
          {
            action: onNavigateToOrder ? {
              label: 'فتح شاشة الأمر',
              onClick: () => onNavigateToOrder(targetOrder.id, targetStageConfig?.orderTab || 'batches')
            } : undefined
          }
        );
        window.dispatchEvent(new CustomEvent('production_order_updated', { detail: { orderId: targetOrder.id } }));
        onOrdersChanged();
      } else {
        notifyError(result.error || 'فشل حفظ التحديث في النظام');
      }
    } catch (err: any) {
      console.error('Failed to move batch in kanban:', err);
      notifyError(err?.message || 'حدث خطأ أثناء نقل الباتش');
    } finally {
      setIsUpdating(false);
      setDraggedBatch(null);
      setActiveDropStage(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, orderId: string, batchId: string) => {
    setDraggedBatch({ orderId, batchId });
    e.dataTransfer.setData('text/plain', JSON.stringify({ orderId, batchId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedBatch(null);
    setActiveDropStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: KanbanStageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropStage !== stageId) {
      setActiveDropStage(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: KanbanStageId) => {
    // Only clear if leaving the stage container
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      if (activeDropStage === stageId) {
        setActiveDropStage(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, stageId: KanbanStageId) => {
    e.preventDefault();
    setActiveDropStage(null);

    let data = draggedBatch;
    if (!data) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse dropped data:', err);
      }
    }

    if (data && data.orderId && data.batchId) {
      handleMoveBatchToStage(data.orderId, data.batchId, stageId);
    }
  };

  // Advance to next stage helper
  const handleAdvanceNext = (record: KanbanBatchRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentIdx = KANBAN_STAGES.findIndex(s => s.id === record.currentStage);
    if (currentIdx < KANBAN_STAGES.length - 1) {
      const nextStage = KANBAN_STAGES[currentIdx + 1].id;
      handleMoveBatchToStage(record.orderId, record.batch.id, nextStage);
    }
  };

  // Revert to previous stage helper
  const handleRevertPrev = (record: KanbanBatchRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentIdx = KANBAN_STAGES.findIndex(s => s.id === record.currentStage);
    if (currentIdx > 0) {
      const prevStage = KANBAN_STAGES[currentIdx - 1].id;
      handleMoveBatchToStage(record.orderId, record.batch.id, prevStage);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Top Bar: Title, Filters & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <KanbanIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  لوحة تحكم كانبان للباتشات الميدانية (Kanban Board)
                </h3>
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {totalBatchesCount} باتش نشط ({totalPiecesCount.toLocaleString('ar-EG')} قطعة)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                اسحب بطاقة الباتش وأفلتها في مرحلة الإنتاج التالية لتحديث حالتها الفورية بدون الحاجة لفتح كل أمر
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
          {/* Order Selector */}
          <div className="relative flex-1 sm:w-64">
            <select
              value={selectedOrderId}
              onChange={e => setSelectedOrderId(e.target.value)}
              className="w-full text-xs font-bold pl-3 pr-8 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">جميع أوامر الإنتاج النشطة</option>
              {orders
                .filter(o => o.batches && o.batches.length > 0 && o.status !== 'مسودة')
                .map(o => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} - {o.styleName} ({o.batches?.length || 0} باتش)
                  </option>
                ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالباتش، الموديل..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-3 pr-8 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Refresh / Sync */}
          <button
            onClick={() => onOrdersChanged()}
            title="تحديث البيانات الميدانية"
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Kanban Board Horizontal Track */}
      <div className="overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex gap-4 min-w-[1380px] items-start">
          {KANBAN_STAGES.map((stage, stageIndex) => {
            const Icon = stage.icon;
            const batchesInStage = stageBatches[stage.id] || [];
            const piecesInStage = batchesInStage.reduce((acc, b) => acc + b.totalPieces, 0);
            const isDropActive = activeDropStage === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={e => handleDragOver(e, stage.id)}
                onDragLeave={e => handleDragLeave(e, stage.id)}
                onDrop={e => handleDrop(e, stage.id)}
                className={`flex-1 flex flex-col rounded-xl border transition-all duration-200 select-none ${
                  stage.colorTheme.bg
                } ${
                  isDropActive
                    ? stage.colorTheme.dropActiveBg
                    : stage.colorTheme.border
                } min-w-[220px] max-w-[250px] shadow-2xs`}
              >
                {/* Stage Header */}
                <div
                  className={`p-3 rounded-t-xl border-b ${stage.colorTheme.border} ${stage.colorTheme.headerBg} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-white/80 shadow-2xs ${stage.colorTheme.accent}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-black ${stage.colorTheme.headerText}`}>
                        {stage.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {batchesInStage.length} باتش · {piecesInStage.toLocaleString('ar-EG')} ق
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stage.colorTheme.badgeBg} ${stage.colorTheme.badgeText}`}
                  >
                    #{stage.stepNumber}
                  </span>
                </div>

                {/* Drop Zone Placeholder when dragging */}
                {isDropActive && (
                  <div className="m-2.5 p-3 rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50/70 text-indigo-700 text-center animate-pulse text-xs font-bold">
                    أفلت الباتش هنا للترحيل إلى {stage.name}
                  </div>
                )}

                {/* Cards Container */}
                <div className="p-2.5 space-y-2.5 min-h-[320px] max-h-[620px] overflow-y-auto scrollbar-thin">
                  {batchesInStage.length === 0 && !isDropActive ? (
                    <div className="h-44 border border-dashed border-slate-200/80 rounded-xl flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <Icon className="w-7 h-7 mb-1.5 opacity-30 stroke-1" />
                      <p className="text-xs font-bold text-slate-400">لا توجد باتشات حالياً</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        اسحب أي باتش إلى هنا لنقله
                      </p>
                    </div>
                  ) : (
                    batchesInStage.map(record => {
                      const isBeingDragged =
                        draggedBatch?.orderId === record.orderId &&
                        draggedBatch?.batchId === record.batch.id;

                      const colors = Array.from(
                        new Set(
                          record.batch.sizes.flatMap(s =>
                            (s.variants || []).map(v => v.color).filter(Boolean)
                          )
                        )
                      );

                      return (
                        <div
                          key={`${record.orderId}_${record.batch.id}`}
                          draggable={!isUpdating}
                          onDragStart={e => handleDragStart(e, record.orderId, record.batch.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setInspectingBatch(record)}
                          className={`group bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing hover:border-indigo-400 relative ${
                            isBeingDragged ? 'opacity-40 scale-95 ring-2 ring-indigo-400' : ''
                          }`}
                        >
                          {/* Top Row: Batch Number & Order Link */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="inline-flex items-center gap-1 font-black text-xs text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/80">
                              <Layers className="w-3 h-3 text-indigo-600" />
                              {record.batch.batchNumber || 'باتش'}
                            </span>

                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                if (onNavigateToOrder) {
                                  onNavigateToOrder(record.orderId, stage.orderTab);
                                }
                              }}
                              className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 bg-slate-50 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-colors"
                              title="فتح أمر الإنتاج في هذه المرحلة"
                            >
                              <span>{record.orderNumber}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          {/* Style Name & Customer */}
                          <div className="mb-2">
                            <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                              {record.styleName}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {record.customerName}
                            </p>
                          </div>

                          {/* Quantity & Colors Pill */}
                          <div className="flex items-center justify-between gap-1 py-1.5 px-2 bg-slate-50 rounded-lg text-slate-700 text-xs mb-2.5 font-bold border border-slate-100">
                            <span className="text-slate-600 text-[11px]">الكمية:</span>
                            <span className="text-indigo-700 font-black">
                              {record.totalPieces.toLocaleString('ar-EG')} قطعة
                            </span>
                          </div>

                          {/* Color tags */}
                          {colors.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2.5">
                              {colors.slice(0, 3).map((col, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium border border-slate-200/60"
                                >
                                  {col}
                                </span>
                              ))}
                              {colors.length > 3 && (
                                <span className="text-[9px] text-slate-400 font-bold self-center">
                                  +{colors.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Quick Action Navigation Bar */}
                          <div
                            onClick={e => e.stopPropagation()}
                            className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs"
                          >
                            {/* Revert Button (RTL: ArrowRight points to next, ArrowLeft to prev) */}
                            <button
                              type="button"
                              disabled={stageIndex === 0 || isUpdating}
                              onClick={e => handleRevertPrev(record, e)}
                              className={`p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer`}
                              title="إرجاع للمرحلة السابقة"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>

                            {/* Direct Jump Menu */}
                            <select
                              value={record.currentStage}
                              onChange={e =>
                                handleMoveBatchToStage(
                                  record.orderId,
                                  record.batch.id,
                                  e.target.value as KanbanStageId
                                )
                              }
                              className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                              title="تحديد المرحلة مباشرة"
                            >
                              {KANBAN_STAGES.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.stepNumber}. {s.name.split('.')[1] || s.name}
                                </option>
                              ))}
                            </select>

                            {/* Advance Button */}
                            <button
                              type="button"
                              disabled={stageIndex === KANBAN_STAGES.length - 1 || isUpdating}
                              onClick={e => handleAdvanceNext(record, e)}
                              className={`p-1 rounded text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer font-bold`}
                              title="ترحيل للمرحلة التالية"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Batch Details Modal (Quick Inspection) */}
      {inspectingBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    تفاصيل {inspectingBatch.batch.batchNumber} - {inspectingBatch.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {inspectingBatch.styleName} · العميل: {inspectingBatch.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingBatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Current Stage Indicator */}
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-900">المرحلة الحالية للباتش:</span>
                  <p className="text-sm font-black text-indigo-700 mt-0.5">
                    {KANBAN_STAGES.find(s => s.id === inspectingBatch.currentStage)?.name}
                  </p>
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-500">إجمالي قطع الباتش:</span>
                  <p className="text-base font-black text-slate-900">
                    {inspectingBatch.totalPieces.toLocaleString('ar-EG')} قطعة
                  </p>
                </div>
              </div>

              {/* Sizes and Quantities breakdown */}
              <div>
                <h4 className="text-xs font-black text-slate-700 mb-2">توزيع المقاسات والألوان:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">المقاس</th>
                        <th className="py-2 px-3">اللون</th>
                        <th className="py-2 px-3 text-left">الكمية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspectingBatch.batch.sizes.flatMap((s, sIdx) =>
                        (s.variants || []).map((v, vIdx) => (
                          <tr key={`${sIdx}_${vIdx}`} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 font-bold text-slate-900">{s.size}</td>
                            <td className="py-2 px-3 text-slate-600">{v.color}</td>
                            <td className="py-2 px-3 text-left font-black text-indigo-700">
                              {Number(v.quantity) || 0}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stage Progress Pills */}
              <div>
                <h4 className="text-xs font-black text-slate-700 mb-2">حالة المحطات التشغيلية:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {KANBAN_STAGES.map(s => {
                    const isCurrent = inspectingBatch.currentStage === s.id;
                    const stageIdx = KANBAN_STAGES.findIndex(x => x.id === s.id);
                    const currentIdx = KANBAN_STAGES.findIndex(x => x.id === inspectingBatch.currentStage);
                    const isPast = stageIdx < currentIdx;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          handleMoveBatchToStage(inspectingBatch.orderId, inspectingBatch.batch.id, s.id);
                          setInspectingBatch(prev => prev ? { ...prev, currentStage: s.id } : null);
                        }}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : isPast
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black opacity-80">#{s.stepNumber}</span>
                          {isPast && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-xs font-bold leading-tight line-clamp-1">{s.name}</p>
                        <span className="text-[10px] opacity-75 mt-1 block">
                          {isCurrent ? 'المرحلة الحالية' : isPast ? 'مكتملة' : 'بالانتظار'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setInspectingBatch(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                إغلاق
              </button>

              {onNavigateToOrder && (
                <button
                  type="button"
                  onClick={() => {
                    const currentStageConfig = KANBAN_STAGES.find(s => s.id === inspectingBatch.currentStage);
                    onNavigateToOrder(inspectingBatch.orderId, currentStageConfig?.orderTab || 'batches');
                    setInspectingBatch(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>فتح أمر الإنتاج بالكامل</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductionBatchesKanban;
