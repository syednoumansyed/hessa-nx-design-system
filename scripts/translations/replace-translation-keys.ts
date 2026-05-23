/**
 * Replace Translation Keys in Codebase
 *
 * Reads "Keys to be replaced" tab from Google Sheets and replaces old keys
 * with new keys throughout the codebase (excluding i18n JSON files).
 *
 * Sheet Structure (Keys to be replaced tab):
 * | Old Key              | New Key              | If Exists in Translations |
 * |----------------------|----------------------|---------------------------|
 * | old.key.name         | new.key.name         | Yes                       |
 * | another.old.key      | another.new.key      | No                        |
 *
 * Only rows with "If Exists in Translations" = "Yes" are processed.
 * Successfully replaced keys are removed from the sheet.
 *
 * Usage:
 *   npx tsx scripts/translations/replace-translation-keys.ts
 *   npx tsx scripts/translations/replace-translation-keys.ts --target /path/to/repo
 *   npx tsx scripts/translations/replace-translation-keys.ts --skip-delete
 *
 * Environment Variables:
 *   I18N_GOOGLE_SHEET_ID - The Google Sheet ID
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ============================================================================
// CLI ARGUMENTS
// ============================================================================

function parseArgs(): { targetPath: string | null; skipDelete: boolean } {
  const args = process.argv.slice(2);
  let targetPath: string | null = null;
  let skipDelete = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      targetPath = args[i + 1];
      i++;
    } else if (args[i] === '--skip-delete') {
      skipDelete = true;
    }
  }

  return { targetPath, skipDelete };
}

const cliArgs = parseArgs();

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  sheetId:
    process.env['I18N_GOOGLE_SHEET_ID'] ||
    '17zDexQQFfqjLmVczgwBoyjLnC21IDoV2U-MrArI9TOk',

  serviceAccountPath: './credentials/google-service-account.json',

  // Sheet tab name
  sheetName: 'Keys to be replaced',

  // Column configuration (0-indexed)
  columns: {
    oldKey: 0, // Column A: Old Key
    newKey: 1, // Column B: New Key
    ifExists: 2, // Column C: If Exists in Translations
  },

  // Source directory to search (uses --target if provided, otherwise ./src)
  srcDirectory: cliArgs.targetPath
    ? path.join(cliArgs.targetPath, 'src')
    : './src',

  // File patterns to search in
  filePatterns: ['**/*.ts', '**/*.tsx', '**/*.html', '**/*.js', '**/*.jsx'],

  // Directories/patterns to exclude
  excludePatterns: [
    '**/node_modules/**',
    '**/assets/i18n/**', // FE translation files
    '**/api/translations/**', // BE translation files
    '**/*.spec.ts',
    '**/*.test.ts',
  ],
};

// ============================================================================
// TYPES
// ============================================================================

interface KeyReplacement {
  oldKey: string;
  newKey: string;
  rowIndex: number; // 0-indexed row in sheet (excluding header)
}

interface ReplacementResult {
  oldKey: string;
  newKey: string;
  rowIndex: number;
  filesModified: string[];
  success: boolean;
}

// ============================================================================
// GOOGLE SHEETS SERVICE
// ============================================================================

async function getGoogleSheetsClient() {
  const credentialsPath = path.resolve(CONFIG.serviceAccountPath);

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      `Service account file not found at: ${credentialsPath}\n` +
        `Please create a service account and download the JSON key file.`,
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client as any });
}

async function fetchKeysToReplace(): Promise<KeyReplacement[]> {
  console.log('Connecting to Google Sheets...');

  const sheets = await getGoogleSheetsClient();
  const range = `${CONFIG.sheetName}!A:C`;

  console.log(`Fetching data from sheet: "${CONFIG.sheetName}"`);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: CONFIG.sheetId,
    range: range,
  });

  const rows = response.data.values || [];
  console.log(`Fetched ${rows.length} rows (including header)`);

  // Skip header row and filter valid entries
  const keysToReplace: KeyReplacement[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const oldKey = row[CONFIG.columns.oldKey]?.trim();
    const newKey = row[CONFIG.columns.newKey]?.trim();
    const ifExists = row[CONFIG.columns.ifExists]?.trim()?.toLowerCase();

    // Only process rows where "If Exists in Translations" is "Yes"
    if (oldKey && newKey && ifExists === 'yes') {
      keysToReplace.push({
        oldKey,
        newKey,
        rowIndex: i, // Store actual row index (1-indexed in sheet, but we track 0-indexed from data)
      });
    }
  }

  console.log(
    `Found ${keysToReplace.length} keys to replace (with "Yes" status)`,
  );
  return keysToReplace;
}

async function deleteRowsFromSheet(rowIndices: number[]): Promise<void> {
  if (rowIndices.length === 0) {
    console.log('No rows to delete from sheet.');
    return;
  }

  const sheets = await getGoogleSheetsClient();

  // Get sheet ID (not spreadsheet ID, but the individual sheet/tab ID)
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: CONFIG.sheetId,
  });

  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === CONFIG.sheetName,
  );

  if (!sheet?.properties?.sheetId) {
    throw new Error(`Sheet "${CONFIG.sheetName}" not found`);
  }

  const sheetId = sheet.properties.sheetId;

  // Sort row indices in descending order to delete from bottom to top
  // This prevents index shifting issues
  const sortedIndices = [...rowIndices].sort((a, b) => b - a);

  console.log(`Deleting ${sortedIndices.length} rows from sheet...`);

  // Create delete requests for each row
  const requests = sortedIndices.map((rowIndex) => ({
    deleteDimension: {
      range: {
        sheetId: sheetId,
        dimension: 'ROWS',
        startIndex: rowIndex, // 0-indexed
        endIndex: rowIndex + 1,
      },
    },
  }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: CONFIG.sheetId,
    requestBody: {
      requests: requests,
    },
  });

  console.log(`Successfully deleted ${sortedIndices.length} rows from sheet.`);
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

async function findAllSourceFiles(): Promise<string[]> {
  const allFiles: string[] = [];

  for (const pattern of CONFIG.filePatterns) {
    const files = await glob(path.join(CONFIG.srcDirectory, pattern), {
      ignore: CONFIG.excludePatterns,
      nodir: true,
    });
    allFiles.push(...files);
  }

  // Remove duplicates
  return [...new Set(allFiles)];
}

function escapeRegExp(string: string): string {
  // Escape special regex characters
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceKeyInFile(
  filePath: string,
  oldKey: string,
  newKey: string,
): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Create patterns for exact key matches in various contexts:
  // - In quotes: "old.key" or 'old.key'
  // - As template literal: `old.key`
  const escapedOldKey = escapeRegExp(oldKey);

  // Pattern matches the key in quotes or backticks, ensuring exact match
  const patterns = [
    // Double quotes: "key"
    new RegExp(`"${escapedOldKey}"`, 'g'),
    // Single quotes: 'key'
    new RegExp(`'${escapedOldKey}'`, 'g'),
    // Backticks (only if it's the complete content): `key`
    new RegExp(`\`${escapedOldKey}\``, 'g'),
  ];

  let modified = false;
  let newContent = content;

  for (const pattern of patterns) {
    if (pattern.test(newContent)) {
      // Replace while preserving the quote style
      newContent = newContent.replace(pattern, (match) => {
        const quoteChar = match[0];
        return `${quoteChar}${newKey}${quoteChar}`;
      });
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function replaceTranslationKeys(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Replace Translation Keys in Codebase');
  console.log('='.repeat(60));
  if (cliArgs.targetPath) {
    console.log(`Target: ${cliArgs.targetPath}`);
  }
  console.log(`Source directory: ${CONFIG.srcDirectory}`);
  console.log('');

  // Fetch keys to replace from Google Sheets
  const keysToReplace = await fetchKeysToReplace();

  if (keysToReplace.length === 0) {
    console.log('No keys to replace. Exiting.');
    return;
  }

  // Find all source files
  console.log('');
  console.log('Scanning source files...');
  const sourceFiles = await findAllSourceFiles();
  console.log(`Found ${sourceFiles.length} source files to search`);

  // Process each key replacement
  const results: ReplacementResult[] = [];

  console.log('');
  console.log('Processing replacements...');

  for (const replacement of keysToReplace) {
    const filesModified: string[] = [];

    for (const filePath of sourceFiles) {
      const wasModified = replaceKeyInFile(
        filePath,
        replacement.oldKey,
        replacement.newKey,
      );

      if (wasModified) {
        filesModified.push(filePath);
      }
    }

    const success = filesModified.length > 0;

    results.push({
      ...replacement,
      filesModified,
      success,
    });

    if (success) {
      console.log(
        `  ✓ "${replacement.oldKey}" → "${replacement.newKey}" (${filesModified.length} files)`,
      );
    } else {
      console.log(`  ✗ "${replacement.oldKey}" not found in codebase`);
    }
  }

  // Summary
  const successfulReplacements = results.filter((r) => r.success);
  const failedReplacements = results.filter((r) => !r.success);

  console.log('');
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total keys processed: ${results.length}`);
  console.log(`Successfully replaced: ${successfulReplacements.length}`);
  console.log(`Not found in codebase: ${failedReplacements.length}`);

  if (successfulReplacements.length > 0) {
    console.log('');
    console.log('Files modified:');
    const allModifiedFiles = new Set<string>();
    successfulReplacements.forEach((r) =>
      r.filesModified.forEach((f) => allModifiedFiles.add(f)),
    );
    allModifiedFiles.forEach((f) => console.log(`  - ${f}`));
  }

  // Delete successful rows from sheet (unless --skip-delete flag is set)
  if (successfulReplacements.length > 0 && !cliArgs.skipDelete) {
    console.log('');
    console.log('Removing successful replacements from Google Sheet...');
    const rowIndicesToDelete = successfulReplacements.map((r) => r.rowIndex);
    await deleteRowsFromSheet(rowIndicesToDelete);
  } else if (successfulReplacements.length > 0 && cliArgs.skipDelete) {
    console.log('');
    console.log('Skipping row deletion (--skip-delete flag set)');
  }

  if (failedReplacements.length > 0) {
    console.log('');
    console.log('Keys not found (keeping in sheet for review):');
    failedReplacements.forEach((r) => console.log(`  - ${r.oldKey}`));
  }

  console.log('');
  console.log('Done!');
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

replaceTranslationKeys().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

export { replaceTranslationKeys };
