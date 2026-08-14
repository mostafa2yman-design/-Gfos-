const fs = require('fs');
let code = fs.readFileSync('src/components/CutOrderForm.tsx', 'utf8');

const badPart = `    </div>
    </div>
  );
}
      {fabricSummary && (
        <div className="mt-8 space-y-6">`;

const goodPart = `        </div>
      </div>
      {fabricSummary && (
        <div className="mt-8 space-y-6">`;

code = code.replace(badPart, goodPart);

// And we need to add the closing tags back at the end
code = code.replace(`        </div>
      )}
`, `        </div>
      )}
    </div>
  );
}
`);

fs.writeFileSync('src/components/CutOrderForm.tsx', code);
