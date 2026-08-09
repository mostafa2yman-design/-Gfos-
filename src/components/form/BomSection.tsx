import React from 'react';
import { ProductionOrder, MaterialInstance, AccessoryInstance, SizeData } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface BomSectionProps {
  order: ProductionOrder;
  onChange: (field: 'materials' | 'accessories', value: any[]) => void;
  readOnly?: boolean;
}

export function BomSection({ order, onChange, readOnly = false }: BomSectionProps) {
  const { materials = [], accessories = [], sizes = [] } = order;

  const handleAddMaterial = () => {
    if (readOnly) return;
    const newMaterial: MaterialInstance = {
      id: crypto.randomUUID(),
      name: '',
      type: 'خامة مضافة',
      unit: 'كجم',
      standardMethod: 'موحد',
      unifiedStandard: 0,
      sizeStandards: sizes.map(s => ({ size: s.size, standard: 0 }))
    };
    onChange('materials', [...materials, newMaterial]);
  };

  const handleUpdateMaterial = (index: number, field: keyof MaterialInstance, value: any) => {
    if (readOnly) return;
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    onChange('materials', updated);
  };

  const handleRemoveMaterial = (index: number) => {
    if (readOnly) return;
    const updated = materials.filter((_, i) => i !== index);
    onChange('materials', updated);
  };

  const handleAddAccessory = () => {
    if (readOnly) return;
    const newAcc: AccessoryInstance = {
      id: crypto.randomUUID(),
      name: '',
      type: 'إكسسوار مضاف',
      unit: 'قطعة',
      standardMethod: 'موحد',
      unifiedStandard: 1,
      sizeStandards: sizes.map(s => ({ size: s.size, standard: 1 }))
    };
    onChange('accessories', [...accessories, newAcc]);
  };

  const handleUpdateAccessory = (index: number, field: keyof AccessoryInstance, value: any) => {
    if (readOnly) return;
    const updated = [...accessories];
    updated[index] = { ...updated[index], [field]: value };
    onChange('accessories', updated);
  };

  const handleRemoveAccessory = (index: number) => {
    if (readOnly) return;
    const updated = accessories.filter((_, i) => i !== index);
    onChange('accessories', updated);
  };

  const renderStandardInput = (
    item: MaterialInstance | AccessoryInstance,
    updateFn: (field: any, value: any) => void
  ) => {
    if (item.standardMethod === 'موحد') {
      return (
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unifiedStandard || ''}
          onChange={(e) => updateFn('unifiedStandard', parseFloat(e.target.value) || 0)}
          disabled={readOnly}
          className={`w-full px-2 py-1 border rounded text-sm ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
          placeholder="المعيار"
        />
      );
    }

    return (
      <div className="space-y-1">
        {sizes.map(size => {
          const std = item.sizeStandards?.find(s => s.size === size.size)?.standard || 0;
          return (
            <div key={size.size} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-semibold text-slate-600">{size.size}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={std || ''}
                onChange={(e) => {
                  const newStandards = [...(item.sizeStandards || [])];
                  const existingIdx = newStandards.findIndex(s => s.size === size.size);
                  if (existingIdx >= 0) {
                    newStandards[existingIdx].standard = parseFloat(e.target.value) || 0;
                  } else {
                    newStandards.push({ size: size.size, standard: parseFloat(e.target.value) || 0 });
                  }
                  updateFn('sizeStandards', newStandards);
                }}
                disabled={readOnly}
                className={`w-16 px-1.5 py-0.5 border rounded text-xs ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Materials Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">الخامات (BOM)</h3>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddMaterial}
              className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              إضافة خامة
            </button>
          )}
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-semibold w-1/4">الخامة</th>
                <th className="pb-2 font-semibold">النوع</th>
                <th className="pb-2 font-semibold w-20">الوحدة</th>
                <th className="pb-2 font-semibold w-32">طريقة المعيار</th>
                <th className="pb-2 font-semibold w-32">المعيار</th>
                <th className="pb-2 font-semibold w-24">السعر</th>
                {!readOnly && <th className="pb-2 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((mat, idx) => (
                <tr key={mat.id} className="text-sm">
                  <td className="py-2 pr-1">
                    <input
                      type="text"
                      value={mat.name}
                      onChange={(e) => handleUpdateMaterial(idx, 'name', e.target.value)}
                      disabled={readOnly}
                      placeholder="اسم الخامة"
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={mat.type}
                      onChange={(e) => handleUpdateMaterial(idx, 'type', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <select
                      value={mat.unit}
                      onChange={(e) => handleUpdateMaterial(idx, 'unit', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    >
                      <option value="كجم">كجم</option>
                      <option value="متر">متر</option>
                      <option value="قطعة">قطعة</option>
                    </select>
                  </td>
                  <td className="py-2 px-1">
                    <select
                      value={mat.standardMethod}
                      onChange={(e) => handleUpdateMaterial(idx, 'standardMethod', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    >
                      <option value="موحد">موحد</option>
                      <option value="حسب المقاس">حسب المقاس</option>
                    </select>
                  </td>
                  <td className="py-2 px-1 align-top">
                    {renderStandardInput(mat, (field, value) => handleUpdateMaterial(idx, field, value))}
                  </td>
                  <td className="py-2 px-1 align-top">
                    <input
                      type="number"
                      min="0"
                      value={mat.standardPrice || ''}
                      onChange={(e) => handleUpdateMaterial(idx, 'standardPrice', parseFloat(e.target.value))}
                      disabled={readOnly}
                      placeholder="غير محدد"
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    />
                  </td>
                  {!readOnly && (
                    <td className="py-2 pl-1 text-center align-top pt-3">
                      <button
                        onClick={() => handleRemoveMaterial(idx)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? 6 : 7} className="py-6 text-center text-slate-500 text-sm">
                    لا توجد خامات مسجلة في هذا الأمر.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accessories Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">الإكسسوارات (BOM)</h3>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddAccessory}
              className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              إضافة إكسسوار
            </button>
          )}
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-semibold w-1/4">الإكسسوار</th>
                <th className="pb-2 font-semibold">النوع</th>
                <th className="pb-2 font-semibold w-20">الوحدة</th>
                <th className="pb-2 font-semibold w-32">طريقة المعيار</th>
                <th className="pb-2 font-semibold w-32">المعيار</th>
                <th className="pb-2 font-semibold w-24">السعر</th>
                {!readOnly && <th className="pb-2 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accessories.map((acc, idx) => (
                <tr key={acc.id} className="text-sm">
                  <td className="py-2 pr-1">
                    <input
                      type="text"
                      value={acc.name}
                      onChange={(e) => handleUpdateAccessory(idx, 'name', e.target.value)}
                      disabled={readOnly}
                      placeholder="اسم الإكسسوار"
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={acc.type}
                      onChange={(e) => handleUpdateAccessory(idx, 'type', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    />
                  </td>
                  <td className="py-2 px-1">
                    <select
                      value={acc.unit}
                      onChange={(e) => handleUpdateAccessory(idx, 'unit', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    >
                      <option value="قطعة">قطعة</option>
                      <option value="متر">متر</option>
                      <option value="كجم">كجم</option>
                    </select>
                  </td>
                  <td className="py-2 px-1">
                    <select
                      value={acc.standardMethod}
                      onChange={(e) => handleUpdateAccessory(idx, 'standardMethod', e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    >
                      <option value="موحد">موحد</option>
                      <option value="حسب المقاس">حسب المقاس</option>
                    </select>
                  </td>
                  <td className="py-2 px-1 align-top">
                    {renderStandardInput(acc, (field, value) => handleUpdateAccessory(idx, field, value))}
                  </td>
                  <td className="py-2 px-1 align-top">
                    <input
                      type="number"
                      min="0"
                      value={acc.standardPrice || ''}
                      onChange={(e) => handleUpdateAccessory(idx, 'standardPrice', parseFloat(e.target.value))}
                      disabled={readOnly}
                      placeholder="غير محدد"
                      className={`w-full px-2 py-1.5 border rounded ${readOnly ? 'bg-slate-50' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                    />
                  </td>
                  {!readOnly && (
                    <td className="py-2 pl-1 text-center align-top pt-3">
                      <button
                        onClick={() => handleRemoveAccessory(idx)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {accessories.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? 6 : 7} className="py-6 text-center text-slate-500 text-sm">
                    لا توجد إكسسوارات مسجلة في هذا الأمر.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
