const fs = require('fs');
let form = fs.readFileSync('src/components/ProductionOrderForm.tsx', 'utf8');

const oldStr = `  const handleApproveOrder = () => {
    if (isReadOnly && order.status !== "مسودة") return ;
    if (validate()) {
      setConfirmConfig({
        isOpen: true,
        message: "هل أنت متأكد من الاعتماد؟ لن تتمكن من تعديل البيانات الأساسية بعد الاعتماد.",
        onConfirm: 
          const result = Cmd.approveProductionOrder(order);
          if (result.success) {
            setConfirmConfig(null);
            setSuccess("تم الاعتماد بنجاح.");
            setError(null);
            if (result.data) setOrder(result.data);
            onOrderApproved(order.id);
          } else {
            setConfirmConfig(null);
            setError(result.error || "حدث خطأ");
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
  };
    }
  };`;

const newStr = `  const handleApproveOrder = () => {
    if (isReadOnly && order.status !== "مسودة") return ;
    if (validate()) {
      setConfirmConfig({
        isOpen: true,
        message: "هل أنت متأكد من الاعتماد؟ لن تتمكن من تعديل البيانات الأساسية بعد الاعتماد.",
        onConfirm: () => {
          const result = Cmd.approveProductionOrder(order);
          if (result.success) {
            setConfirmConfig(null);
            setSuccess("تم الاعتماد بنجاح.");
            setError(null);
            if (result.data) setOrder(result.data);
            onOrderApproved(order.id);
          } else {
            setConfirmConfig(null);
            setError(result.error || "حدث خطأ");
          }
        },
        onCancel: () => setConfirmConfig(null)
      });
    }
  };`;

form = form.replace(oldStr, newStr);
fs.writeFileSync('src/components/ProductionOrderForm.tsx', form);
