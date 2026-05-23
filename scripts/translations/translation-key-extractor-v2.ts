import * as fsV2 from 'fs';
import * as globV2 from 'glob';

// Helper function to validate translation keys
// Returns 'valid', 'dynamic', or 'invalid'
function classifyTranslationKey(key: string): 'valid' | 'dynamic' | 'invalid' {
  // Key ending with dot is a dynamic key prefix (e.g., 'enum.', 'reports.')
  if (key.endsWith('.')) return 'dynamic';

  // Key must have at least 2 segments (e.g., 'namespace.key')
  const segments = key.split('.');
  if (segments.length < 2) return 'invalid';

  // Each segment must have content (no empty segments from double dots)
  if (segments.some((s) => s.length === 0)) return 'invalid';

  return 'valid';
}

// Legacy function for backward compatibility
function isValidTranslationKey(key: string): boolean {
  return classifyTranslationKey(key) === 'valid';
}

// Function to extract keys from frontend TypeScript and HTML files
// Uses translation service patterns (t(), translate(), transloco, hesTranslate, etc.)
function extractFrontendKeysV2(directory: string): Set<string> {
  const keys = new Set<string>();
  const files = globV2.sync(`${directory}/**/*.{ts,html}`);

  // Updated regex patterns to catch all translation usages
  // Note: Patterns capture the key and ignore any additional arguments (like interpolation objects)
  const regexPatterns = [
    // t('key') or t("key") - structural directive pattern (may have additional args)
    /(?<![a-zA-Z0-9])t\(\s*['"]([^'"]+)['"]/g,

    // {{ t('key') }} or {{ t("key") }} - template with t function
    /\{\{\s*t\(\s*['"]([^'"]+)['"]/g,

    // translate('key') or translate("key") - service method (may have additional args)
    /(?<![a-zA-Z0-9])translate\(\s*['"]([^'"]+)['"]/g,

    // {{ 'key' | transloco }} or {{ "key" | transloco }} - transloco pipe (both quote types)
    /\{\{\s*['"](.+?)['"]\s*\|\s*transloco/g,

    // [innerHTML]="'key' | transloco" - innerHTML binding with transloco pipe
    /\[innerHTML\]\s*=\s*["']'([^']+)'\s*\|\s*transloco/g,

    // {{ 'key' | dsTranslate }} or {{ "key" | dsTranslate }} - design system pipe
    /\{\{\s*['"](.+?)['"]\s*\|\s*dsTranslate/g,

    // enumT('key') - enum translation helper (will be prefixed with 'enum.')
    /enumT\(\s*['"]([^'"]+)['"]/g,

    // this.t('key') or this.t("key") - method call on this (may have additional args)
    /this\.t\(\s*['"]([^'"]+)['"]/g,

    // hesTranslate.t('key') - HesTranslateService usage (may have additional args)
    /hesTranslate\.t\(\s*['"]([^'"]+)['"]/g,

    // this.hesTranslateService.t('key') - HesTranslateService via this (may have additional args)
    /this\.hesTranslateService\.t\(\s*['"]([^'"]+)['"]/g,

    // translocoService.translate('key') - direct service usage (may have additional args)
    /translocoService\.translate\(\s*['"]([^'"]+)['"]/g,

    // transloco.translate('key') - injected service (may have additional args)
    /transloco\.translate\(\s*['"]([^'"]+)['"]/g,

    // this.translate.t('key') - HesTranslateService aliased as translate
    /this\.translate\.t\(\s*['"]([^'"]+)['"]/g,

    // this.translateService.t('key') - HesTranslateService aliased as translateService
    /this\.translateService\.t\(\s*['"]([^'"]+)['"]/g,

    // Ternary expressions inside translation functions - captures keys after ? or :
    // e.g., t(condition ? 'key1' : 'key2')
    /\?\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,
    /:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"],?\s*\)/g,

    // Object property patterns - keys containing dots (like 'namespace.key.suffix')
    // breadcrumb: 'key' - route data breadcrumbs
    /breadcrumb:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // label: 'key' - labels in component configs
    /label:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // title: 'key' - titles in configs
    /(?<!page)title:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // message: 'key' - messages in mascot/dialog configs
    /message:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // subMessage: 'key' - sub-messages in mascot configs
    /subMessage:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // description: 'key' - descriptions in configs
    /description:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // text: 'key' - text properties in configs
    /(?<!btn)text:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // header: 'key' - header properties
    /header:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // placeholder: 'key' - placeholder properties
    /placeholder:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // btnText: 'key' - button text properties
    /btnText:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // *Key: 'key' - properties ending with Key suffix (titleKey, descriptionKey, etc.)
    /titleKey:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,
    /descriptionKey:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,
    /textKey:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,
    /messageKey:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,
    /labelKey:\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // this.property = 'key' - direct property assignment patterns
    /this\.title\s*=\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,
    /this\.description\s*=\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,
    /this\.message\s*=\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,
    /this\.label\s*=\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // Enum values with translation keys: ENUM_VALUE = 'key'
    /^\s*[A-Z_]+\s*=\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/gm,

    // Custom translation methods: this.xxxTranslation('key') or xxxTranslation('key')
    /Translation\(\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,

    // Angular signal inputs with translation key defaults: input<string>('key')
    /input<string>\(\s*['"]([a-zA-Z_]+\.[a-zA-Z_.]+)['"]/g,
  ];

  // Separate pattern for enumT to track enum keys
  const enumTPattern = /enumT\(\s*['"]([^'"]+)['"]/g;

  files.forEach((file: any) => {
    const content = fsV2.readFileSync(file, 'utf8');

    regexPatterns.forEach((regex) => {
      // Reset regex lastIndex for each file
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        if (key && !key.includes('/') && isValidTranslationKey(key)) {
          keys.add(key);
        }
      }
    });

    // Handle enumT separately - these keys need 'enum.' prefix
    enumTPattern.lastIndex = 0;
    let enumMatch;
    while ((enumMatch = enumTPattern.exec(content)) !== null) {
      const key = enumMatch[1];
      if (key) {
        // Add both the raw key and the prefixed version
        keys.add(`enum.${key.toUpperCase()}`);
      }
    }
  });

  return keys;
}

// Function to extract keys from backend code using simple dot-based matching
// Backend doesn't use translate services - just finds quoted strings with dots that are lowercase
function extractBackendKeysV2(directory: string): Set<string> {
  const keys = new Set<string>();
  const files = globV2.sync(`${directory}/**/*.{ts,js}`, {
    ignore: [
      '**/node_modules/**',
      '**/api/translations/**', // Exclude BE translation files
      '**/api/i18n/**', // Exclude auth/socket i18n files
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.d.ts',
    ],
  });

  // Simple pattern: find any quoted string containing at least one dot
  // Matches: 'key.name' or "key.name" or `key.name`
  const quotedStringPattern =
    /['"`]([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+)['"`]/g;

  files.forEach((file: any) => {
    const content = fsV2.readFileSync(file, 'utf8');

    quotedStringPattern.lastIndex = 0;
    let match;
    while ((match = quotedStringPattern.exec(content)) !== null) {
      const key = match[1];
      if (key) {
        // Validate it's a translation key:
        // - Must be all lowercase (already enforced by regex)
        // - Must have at least 2 segments
        // - Must not contain file paths or URLs
        const segments = key.split('.');
        if (
          segments.length >= 2 &&
          !key.includes('/') &&
          !key.includes('http') &&
          !key.endsWith('.ts') &&
          !key.endsWith('.js') &&
          !key.endsWith('.json') &&
          !key.endsWith('.html') &&
          !key.endsWith('.css') &&
          !key.endsWith('.env')
        ) {
          keys.add(key);
        }
      }
    }
  });

  return keys;
}

// Function to extract dynamic keys (incomplete key prefixes from string concatenation)
function extractDynamicKeysV2(directory: string): Set<string> {
  const dynamicKeys = new Set<string>();
  const files = globV2.sync(`${directory}/**/*.{ts,html}`);

  // Same patterns as extractKeysFromFilesV2
  const regexPatterns = [
    /(?<![a-zA-Z0-9])t\(\s*['"]([^'"]+)['"]/g,
    /\{\{\s*t\(\s*['"]([^'"]+)['"]/g,
    /(?<![a-zA-Z0-9])translate\(\s*['"]([^'"]+)['"]/g,
    /\{\{\s*['"](.+?)['"]\s*\|\s*transloco/g,
    /\[innerHTML\]\s*=\s*["']'([^']+)'\s*\|\s*transloco/g,
    /\{\{\s*['"](.+?)['"]\s*\|\s*dsTranslate/g,
    /enumT\(\s*['"]([^'"]+)['"]/g,
    /this\.t\(\s*['"]([^'"]+)['"]/g,
    /hesTranslate\.t\(\s*['"]([^'"]+)['"]/g,
    /this\.hesTranslateService\.t\(\s*['"]([^'"]+)['"]/g,
    /translocoService\.translate\(\s*['"]([^'"]+)['"]/g,
    /transloco\.translate\(\s*['"]([^'"]+)['"]/g,
    /this\.translate\.t\(\s*['"]([^'"]+)['"]/g,
    /this\.translateService\.t\(\s*['"]([^'"]+)['"]/g,
  ];

  files.forEach((file: any) => {
    const content = fsV2.readFileSync(file, 'utf8');

    regexPatterns.forEach((regex) => {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        if (
          key &&
          !key.includes('/') &&
          classifyTranslationKey(key) === 'dynamic'
        ) {
          dynamicKeys.add(key);
        }
      }
    });
  });

  return dynamicKeys;
}

// Function to extract dynamic keys - returns only the code lines containing dynamic key usage
function extractDynamicKeysDetailedV2(directory: string): string[] {
  const dynamicKeysCode: Set<string> = new Set();
  const files = globV2.sync(`${directory}/**/*.{ts,html}`);

  // Patterns that capture more context for dynamic keys
  const regexPatterns = [
    /(?<![a-zA-Z0-9])t\(\s*['"]([^'"]+)['"]/g,
    /\{\{\s*t\(\s*['"]([^'"]+)['"]/g,
    /(?<![a-zA-Z0-9])translate\(\s*['"]([^'"]+)['"]/g,
    /\{\{\s*['"](.+?)['"]\s*\|\s*transloco/g,
    /\[innerHTML\]\s*=\s*["']'([^']+)'\s*\|\s*transloco/g,
    /\{\{\s*['"](.+?)['"]\s*\|\s*dsTranslate/g,
    /enumT\(\s*['"]([^'"]+)['"]/g,
    /this\.t\(\s*['"]([^'"]+)['"]/g,
    /hesTranslate\.t\(\s*['"]([^'"]+)['"]/g,
    /this\.hesTranslateService\.t\(\s*['"]([^'"]+)['"]/g,
    /translocoService\.translate\(\s*['"]([^'"]+)['"]/g,
    /transloco\.translate\(\s*['"]([^'"]+)['"]/g,
    /this\.translate\.t\(\s*['"]([^'"]+)['"]/g,
    /this\.translateService\.t\(\s*['"]([^'"]+)['"]/g,
  ];

  files.forEach((file: any) => {
    const content = fsV2.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    regexPatterns.forEach((regex) => {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        if (
          key &&
          !key.includes('/') &&
          classifyTranslationKey(key) === 'dynamic'
        ) {
          // Find line number
          const matchIndex = match.index;
          let lineNumber = 1;
          let charCount = 0;
          for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].length + 1; // +1 for newline
            if (charCount > matchIndex) {
              lineNumber = i + 1;
              break;
            }
          }

          // Get the full line of code (trimmed)
          const codeLine = lines[lineNumber - 1]?.trim() || '';

          // Add to set to avoid duplicates
          if (codeLine) {
            dynamicKeysCode.add(codeLine);
          }
        }
      }
    });
  });

  return Array.from(dynamicKeysCode).sort();
}

// Function to extract keys from language files
function extractKeysFromLanguageFilesV2(directory: string): Set<string> {
  const keys = new Set<string>();
  const files = globV2.sync(`${directory}/**/*.json`);

  files.forEach((file: any) => {
    const content = JSON.parse(fsV2.readFileSync(file, 'utf8'));
    Object.keys(content).forEach((key) => keys.add(key));
  });

  return keys;
}

// Function to write keys to a JSON file
function writeKeysToFileV2(keys: Set<string>, filename: string) {
  const keysArray = Array.from(keys).sort();
  fsV2.writeFileSync(filename, JSON.stringify(keysArray, null, 2));
  console.log(`Keys written to ${filename} (${keysArray.length} keys)`);
}

// Function to categorize keys by pattern
function categorizeKeysV2(directory: string): Map<string, Set<string>> {
  const categories = new Map<string, Set<string>>();
  categories.set('t()', new Set());
  categories.set('translate()', new Set());
  categories.set('transloco pipe', new Set());
  categories.set('dsTranslate pipe', new Set());
  categories.set('enumT()', new Set());

  const files = globV2.sync(`${directory}/**/*.{ts,html}`);

  const patterns: { name: string; regex: RegExp; isEnum?: boolean }[] = [
    { name: 't()', regex: /(?<![a-zA-Z0-9])t\(\s*['"]([^'"]+)['"]/g },
    {
      name: 'translate()',
      regex: /(?<![a-zA-Z0-9])translate\(\s*['"]([^'"]+)['"]/g,
    },
    { name: 'transloco pipe', regex: /\{\{\s*['"](.+?)['"]\s*\|\s*transloco/g },
    {
      name: 'dsTranslate pipe',
      regex: /\{\{\s*['"](.+?)['"]\s*\|\s*dsTranslate/g,
    },
    { name: 'enumT()', regex: /enumT\(\s*['"]([^'"]+)['"]/g, isEnum: true },
  ];

  files.forEach((file: any) => {
    const content = fsV2.readFileSync(file, 'utf8');

    patterns.forEach(({ name, regex, isEnum }) => {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        if (key && !key.includes('/')) {
          const finalKey = isEnum ? `enum.${key.toUpperCase()}` : key;
          categories.get(name)?.add(finalKey);
        }
      }
    });
  });

  return categories;
}

// Main function
function findMissingTranslationKeysV2(srcDir: string, langDir: string) {
  console.log('='.repeat(60));
  console.log('Translation Key Extractor v2');
  console.log('='.repeat(60));
  console.log('');

  const codeKeys = extractFrontendKeysV2(srcDir);
  const langKeys = extractKeysFromLanguageFilesV2(langDir);

  console.log(`Keys used in code: ${codeKeys.size}`);
  console.log(`Keys in language files: ${langKeys.size}`);
  console.log('');

  // Categorize keys for detailed report
  const categories = categorizeKeysV2(srcDir);
  console.log('Keys by pattern:');
  categories.forEach((keys, pattern) => {
    console.log(`  ${pattern}: ${keys.size} keys`);
  });
  console.log('');

  // Write code keys to JSON file
  writeKeysToFileV2(codeKeys, 'code-keys-v2.json');

  // Find missing keys
  const missingKeys = Array.from(codeKeys).filter((key) => !langKeys.has(key));
  const missingSet = new Set(missingKeys);
  writeKeysToFileV2(missingSet, 'missing-keys-v2.json');

  // Find unused keys (in language files but not in code)
  const unusedKeys = Array.from(langKeys).filter((key) => !codeKeys.has(key));
  const unusedSet = new Set(unusedKeys);
  writeKeysToFileV2(unusedSet, 'unused-keys-v2.json');

  // Extract and write dynamic keys (incomplete key prefixes) with detailed info
  const dynamicKeys = extractDynamicKeysV2(srcDir);
  const dynamicKeysDetailed = extractDynamicKeysDetailedV2(srcDir);
  fsV2.writeFileSync(
    'dynamic-keys-v2.json',
    JSON.stringify(dynamicKeysDetailed, null, 2),
  );
  console.log(
    `Keys written to dynamic-keys-v2.json (${dynamicKeysDetailed.length} occurrences)`,
  );

  console.log('');
  console.log('Summary:');
  console.log(
    `  Missing keys (in code but not in translations): ${missingKeys.length}`,
  );
  console.log(
    `  Unused keys (in translations but not in code): ${unusedKeys.length}`,
  );
  console.log(`  Dynamic keys (incomplete prefixes): ${dynamicKeys.size}`);
  console.log('');

  if (missingKeys.length > 0) {
    console.log('Missing keys (first 20):');
    missingKeys.slice(0, 20).forEach((key) => console.log(`  - ${key}`));
    if (missingKeys.length > 20) {
      console.log(`  ... and ${missingKeys.length - 20} more`);
    }
  }
}

// Only run when executed directly (not when imported)
const isMainModule =
  require.main === module ||
  process.argv[1]?.includes('translation-key-extractor-v2');

if (isMainModule) {
  const srcDirectoryV2 = './src/app';
  const languageDirectoryV2 = './src/assets/i18n';
  findMissingTranslationKeysV2(srcDirectoryV2, languageDirectoryV2);
}

export {
  findMissingTranslationKeysV2,
  extractFrontendKeysV2,
  extractBackendKeysV2,
  extractKeysFromLanguageFilesV2,
  extractDynamicKeysV2,
  extractDynamicKeysDetailedV2,
  categorizeKeysV2,
};
