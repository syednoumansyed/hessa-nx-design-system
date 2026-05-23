/**
 * Google Sheets Translation Fetcher
 *
 * Fetches translation keys from a Google Sheet and updates en.json/ar.json files.
 *
 * Setup:
 * 1. Install dependencies: npm install googleapis
 * 2. Create a service account in Google Cloud Console
 * 3. Download the service account JSON key file
 * 4. Share your Google Sheet with the service account email
 * 5. Set environment variables or update config below
 *
 * Expected Sheet Structure:
 * | Key                  | en              | ar              |
 * |----------------------|-----------------|-----------------|
 * | global.cancel.btn    | Cancel          | إلغاء           |
 * | global.save.btn      | Save            | حفظ             |
 *
 * Usage:
 *   npx tsx scripts/google-sheets-translations.ts
 *
 * Environment Variables:
 *   GOOGLE_SHEET_ID          - The ID from the Google Sheet URL
 *   GOOGLE_SERVICE_ACCOUNT   - Path to service account JSON file
 *   SHEET_NAME               - Name of the sheet tab (default: "Translations")
 *   OUTPUT_PATH_EN           - Output path for English translations (default: "./src/assets/i18n/en.json")
 *   OUTPUT_PATH_AR           - Output path for Arabic translations (default: "./src/assets/i18n/ar.json")
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Google Sheet ID (from URL: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit)
  sheetId:
    process.env['I18N_GOOGLE_SHEET_ID'] ||
    '17zDexQQFfqjLmVczgwBoyjLnC21IDoV2U-MrArI9TOk',

  // Path to service account credentials JSON file
  serviceAccountPath: './credentials/google-service-account.json',

  // Sheet tab name
  sheetName: process.env['I18N_GOOGLE_SHEET_NAME'] || 'Translations',

  // Column configuration (0-indexed)
  columns: {
    Key: 0, // Column A: Translation key
    English: 1, // Column B: English translation
    Arabic: 2, // Column C: Arabic translation
  },

  // Output paths for translation files (can be overridden via env vars for CI/CD)
  outputPaths: {
    en: './src/assets/i18n/en.json',
    ar: './src/assets/i18n/ar.json',
  },

  // Range to fetch (adjust based on your sheet size)
  range: 'A:C', // Columns A to C (key, en, ar)

  // Skip header row
  skipHeaderRows: 1,
};

// ============================================================================
// TYPES
// ============================================================================

interface TranslationData {
  en: Record<string, string>;
  ar: Record<string, string>;
}

interface FetchResult {
  success: boolean;
  keysCount: number;
  errors: string[];
}

// ============================================================================
// GOOGLE SHEETS SERVICE
// ============================================================================

async function getGoogleSheetsClient() {
  const credentialsPath = path.resolve(CONFIG.serviceAccountPath);

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      `Service account file not found at: ${credentialsPath}\n` +
        `Please create a service account and download the JSON key file.\n` +
        `See: https://cloud.google.com/iam/docs/creating-managing-service-accounts`,
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client as any });
}

async function fetchSheetData(): Promise<string[][]> {
  console.log('Connecting to Google Sheets...');

  const sheets = await getGoogleSheetsClient();
  const range = `${CONFIG.sheetName}!${CONFIG.range}`;

  console.log(`Fetching data from: ${CONFIG.sheetId}`);
  console.log(`Range: ${range}`);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: CONFIG.sheetId,
    range: range,
  });

  const rows = response.data.values || [];
  console.log(`Fetched ${rows.length} rows`);

  return rows;
}

// ============================================================================
// TRANSLATION PROCESSING
// ============================================================================

function processSheetData(rows: string[][]): TranslationData {
  const translations: TranslationData = {
    en: {},
    ar: {},
  };

  const errors: string[] = [];

  // Skip header rows
  const dataRows = rows.slice(CONFIG.skipHeaderRows);

  dataRows.forEach((row, index) => {
    const rowNumber = index + CONFIG.skipHeaderRows + 1;
    const key = row[CONFIG.columns.Key]?.trim();
    const enValue = row[CONFIG.columns.English]?.trim() || '';
    const arValue = row[CONFIG.columns.Arabic]?.trim() || '';

    // Skip empty keys
    if (!key) {
      return;
    }

    // Validate key format
    if (key.includes(' ')) {
      errors.push(`Row ${rowNumber}: Key "${key}" contains spaces`);
      return;
    }

    // Check for duplicate keys
    if (translations.en.hasOwnProperty(key)) {
      errors.push(`Row ${rowNumber}: Duplicate key "${key}"`);
      return;
    }

    translations.en[key] = enValue;
    translations.ar[key] = arValue;
  });

  if (errors.length > 0) {
    console.log('\nWarnings:');
    errors.forEach((err) => console.log(`  - ${err}`));
  }

  return translations;
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

function loadExistingTranslations(filePath: string): Record<string, string> {
  const fullPath = path.resolve(filePath);

  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
  }

  return {};
}

function saveTranslations(
  filePath: string,
  translations: Record<string, string>,
): void {
  const fullPath = path.resolve(filePath);

  // Sort keys alphabetically
  const sorted = Object.keys(translations)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = translations[key];
        return acc;
      },
      {} as Record<string, string>,
    );

  fs.writeFileSync(fullPath, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`Saved: ${fullPath} (${Object.keys(sorted).length} keys)`);
}

function mergeTranslations(
  existing: Record<string, string>,
  fetched: Record<string, string>,
  mode: 'replace' | 'merge' = 'merge',
): Record<string, string> {
  if (mode === 'replace') {
    return fetched;
  }

  // Merge: fetched values override existing, but keep keys not in sheet
  return {
    ...existing,
    ...fetched,
  };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function fetchTranslationsFromGoogleSheets(
  mode: 'replace' | 'merge' = 'merge',
): Promise<FetchResult> {
  console.log('='.repeat(60));
  console.log('Google Sheets Translation Fetcher');
  console.log('='.repeat(60));
  console.log('');

  const errors: string[] = [];

  try {
    // Fetch data from Google Sheets
    const rows = await fetchSheetData();

    if (rows.length <= CONFIG.skipHeaderRows) {
      throw new Error('No data found in the sheet');
    }

    // Process the data
    const translations = processSheetData(rows);

    const enCount = Object.keys(translations.en).length;
    const arCount = Object.keys(translations.ar).length;

    console.log('');
    console.log(`Processed translations:`);
    console.log(`  English: ${enCount} keys`);
    console.log(`  Arabic: ${arCount} keys`);
    console.log('');

    // Load existing translations
    const existingEn = loadExistingTranslations(CONFIG.outputPaths.en);
    const existingAr = loadExistingTranslations(CONFIG.outputPaths.ar);

    console.log(`Existing translations:`);
    console.log(`  English: ${Object.keys(existingEn).length} keys`);
    console.log(`  Arabic: ${Object.keys(existingAr).length} keys`);
    console.log('');

    // Merge or replace
    console.log(`Mode: ${mode}`);
    const finalEn = mergeTranslations(existingEn, translations.en, mode);
    const finalAr = mergeTranslations(existingAr, translations.ar, mode);

    // Save translations
    saveTranslations(CONFIG.outputPaths.en, finalEn);
    saveTranslations(CONFIG.outputPaths.ar, finalAr);

    // Summary
    console.log('');
    console.log('Summary:');
    console.log(`  Final English: ${Object.keys(finalEn).length} keys`);
    console.log(`  Final Arabic: ${Object.keys(finalAr).length} keys`);

    const newEnKeys = Object.keys(translations.en).filter(
      (k) => !existingEn.hasOwnProperty(k),
    );
    const newArKeys = Object.keys(translations.ar).filter(
      (k) => !existingAr.hasOwnProperty(k),
    );

    if (newEnKeys.length > 0) {
      console.log(`  New English keys: ${newEnKeys.length}`);
    }
    if (newArKeys.length > 0) {
      console.log(`  New Arabic keys: ${newArKeys.length}`);
    }

    console.log('');
    console.log('Done!');

    return {
      success: true,
      keysCount: enCount,
      errors,
    };
  } catch (error: any) {
    console.error('');
    console.error('Error:', error.message);

    if (error.message.includes('ENOENT')) {
      console.error('\nMake sure the service account JSON file exists.');
    }

    if (error.message.includes('403') || error.message.includes('permission')) {
      console.error(
        '\nMake sure you have shared the Google Sheet with the service account email.',
      );
    }

    return {
      success: false,
      keysCount: 0,
      errors: [error.message],
    };
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args.includes('--replace') ? 'replace' : 'merge';

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npx tsx scripts/google-sheets-translations.ts [options]

Options:
  --merge     Merge with existing translations (default)
  --replace   Replace all translations with sheet data
  --help      Show this help message

Environment Variables:
  GOOGLE_SHEET_ID          The Google Sheet ID
  GOOGLE_SERVICE_ACCOUNT   Path to service account JSON
  SHEET_NAME               Sheet tab name (default: "Translations")

Example:
  GOOGLE_SHEET_ID=abc123 npx tsx scripts/google-sheets-translations.ts --merge
`);
  process.exit(0);
}

fetchTranslationsFromGoogleSheets(mode as 'replace' | 'merge');

export { fetchTranslationsFromGoogleSheets, CONFIG };
