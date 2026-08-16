with open('src/index.css', 'r') as f:
    content = f.read()

import re

# Update standard print rules to enforce font sizes and table styles
new_print_rules = """
  .gfos-print-document {
    width: 100%;
    padding: 0 !important;
    margin: 0 !important;
    background: white;
    color: black;
    font-size: 11px;
  }

  .gfos-print-document table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 10px;
  }
  
  .gfos-print-document th, .gfos-print-document td {
    border: 1px solid #cbd5e1;
    padding: 4px 6px;
    text-align: right;
  }

  .gfos-print-document th {
    background-color: #f1f5f9 !important;
    font-weight: bold;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .gfos-print-document thead {
    display: table-header-group;
  }

  .gfos-print-document tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }
  
  .print-footer {
    position: fixed;
    bottom: 0;
  }
  
  /* Create some space at the bottom for the fixed footer */
  .print-content {
    padding-bottom: 20px;
  }
"""

# Replace the gfos-print-document part
pattern = re.compile(r'\.gfos-print-document \{.*\.page-break \{[^\}]*\}', re.DOTALL)
content = re.sub(pattern, new_print_rules.strip(), content)

with open('src/index.css', 'w') as f:
    f.write(content)
