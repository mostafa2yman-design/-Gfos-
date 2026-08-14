const fs = require('fs');
let code = fs.readFileSync('src/components/CutOrderForm.tsx', 'utf8');

code = code.replace(`        </div>
        </div>
      </div>
      {fabricSummary && (`, `        </div>
      </div>
      {fabricSummary && (`);

// And we need to make sure the end is correct
const endPart = `      )}
    </div>
  );
}
`;
code = code.replace(`      )}
    </div>
  );
}
`, endPart);

fs.writeFileSync('src/components/CutOrderForm.tsx', code);
