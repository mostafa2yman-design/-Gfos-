import re
import glob

def remove_style_tag(content):
    # This regex handles dangerouslySetInnerHTML style tags
    pattern = r'<style dangerouslySetInnerHTML={{__html: `.*?`}}\s*/>'
    return re.sub(pattern, '', content, flags=re.DOTALL)

def update_root_div(content):
    # Update the root div to include gfos-print-document and remove padding/min-height properties
    # Let's target the root div specifically.
    
    # BatchPreparationWorkOrder.tsx
    if '<div className="print-only hidden print:block text-black bg-white" dir="rtl">' in content:
        content = content.replace('<div className="print-only hidden print:block text-black bg-white" dir="rtl">', 
                                 '<div className="gfos-print-document print-only hidden print:block text-black bg-white" dir="rtl">')
    
    # PrintEmbroideryWorkOrder.tsx
    if '<div className="print-only hidden print:block text-black bg-white" dir="rtl">' in content:
        content = content.replace('<div className="print-only hidden print:block text-black bg-white" dir="rtl">', 
                                 '<div className="gfos-print-document print-only hidden print:block text-black bg-white" dir="rtl">')
                                 
    # CutWorkOrderPrint.tsx
    if '<div ref={ref} className="print-only hidden print:block text-black bg-white" dir="rtl">' in content:
         content = content.replace('<div ref={ref} className="print-only hidden print:block text-black bg-white" dir="rtl">', 
                                   '<div ref={ref} className="gfos-print-document print-only hidden print:block text-black bg-white" dir="rtl">')
                                   
    # PrepWorkOrderPrint.tsx and SewingWorkOrder.tsx have this:
    # <div ref={ref} className="p-8 bg-white text-black w-full" dir="rtl" style={{ minHeight: '297mm' }}>
    content = re.sub(
        r'<div ref={ref} className="([^"]*)" dir="rtl" style={{ minHeight: \'297mm\' }}>',
        r'<div ref={ref} className="gfos-print-document \1" dir="rtl">',
        content
    )
    
    content = content.replace('className="gfos-print-document p-8 bg-white text-black w-full"', 'className="gfos-print-document bg-white text-black w-full"')
    
    return content

files = [
    'src/components/print/CutWorkOrderPrint.tsx',
    'src/components/print/PrepWorkOrderPrint.tsx',
    'src/components/workorders/BatchPreparationWorkOrder.tsx',
    'src/components/workorders/PrintEmbroideryWorkOrder.tsx',
    'src/components/workorders/SewingWorkOrder.tsx'
]

for f_path in files:
    try:
        with open(f_path, 'r') as f:
            content = f.read()
        
        content = remove_style_tag(content)
        content = update_root_div(content)
        
        # Also clean up "page-break" or "break-inside-avoid" logic if needed.
        # But actually they already use standard classes which I added to index.css
        
        with open(f_path, 'w') as f:
            f.write(content)
            
        print(f"Fixed {f_path}")
    except Exception as e:
        print(f"Error on {f_path}: {e}")

