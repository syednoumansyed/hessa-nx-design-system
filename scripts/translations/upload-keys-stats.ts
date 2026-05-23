/**
 * Upload Translation Keys Stats to Google Sheets
 *
 * Extracts translation keys from code (frontend + backend), compares with language files,
 * and uploads the stats to the "Keys Stats" sheet tab.
 *
 * Sheet Structure (Keys Stats tab):
 * | FE Code Keys | BE Code Keys | Auth Code Keys | Socket Code Keys | Un-used keys | Missing Keys | Dynamic Keys                    |
 * |--------------|--------------|----------------|------------------|--------------|--------------|----------------------------------|
 * | fe.key1      | be.key1      | auth.key1      | socket.key1      | unused1      | missing1     | this.translate('enum.' + value) |
 * | fe.key2      | be.key2      | auth.key2      | socket.key2      | unused2      | missing2     | {{ t("global." + type + ".txt") }}|
 *
 * Usage:
 *   npx tsx scripts/translations/upload-keys-stats.ts
 *
 * Environment Variables:
 *   I18N_GOOGLE_SHEET_ID - The Google Sheet ID
 *   FRONTEND_PATH - Path to frontend repository (optional, defaults to cwd)
 *   BACKEND_PATH - Path to backend repository (optional)
 *   AUTH_PATH - Path to auth repository (optional)
 *   SOCKET_PATH - Path to socket repository (optional)
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import {
  extractFrontendKeysV2,
  extractBackendKeysV2,
  extractKeysFromLanguageFilesV2,
  extractDynamicKeysDetailedV2,
} from './translation-key-extractor-v2';

// ============================================================================
// CONFIGURATION
// ============================================================================

const frontendPath = process.env['FRONTEND_PATH'] || process.cwd();
const backendPath = process.env['BACKEND_PATH'];
const authPath = process.env['AUTH_PATH'];
const socketPath = process.env['SOCKET_PATH'];

const CONFIG = {
  sheetId:
    process.env['I18N_GOOGLE_SHEET_ID'] ||
    '17zDexQQFfqjLmVczgwBoyjLnC21IDoV2U-MrArI9TOk',

  serviceAccountPath: './credentials/google-service-account.json',

  // Sheet tab name for stats
  statsSheetName: 'Keys Stats',

  // Frontend source paths
  frontendSrcDirectory: path.join(frontendPath, 'src/app'),
  languageDirectory: path.join(frontendPath, 'src/assets/i18n'),

  // Backend source paths (optional) - all use backend extraction logic
  backendSrcDirectory: backendPath ? path.join(backendPath, 'src') : null,
  authSrcDirectory: authPath ? path.join(authPath, 'src') : null,
  socketSrcDirectory: socketPath ? path.join(socketPath, 'src') : null,
};

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

async function clearAndWriteColumn(
  sheets: any,
  column: string,
  data: string[],
): Promise<void> {
  const range = `${CONFIG.statsSheetName}!${column}2:${column}`;

  // Clear existing data in the column (except header)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: CONFIG.sheetId,
    range: range,
  });

  // Write new data if there's any
  if (data.length > 0) {
    const values = data.map((key) => [key]);
    await sheets.spreadsheets.values.update({
      spreadsheetId: CONFIG.sheetId,
      range: `${CONFIG.statsSheetName}!${column}2`,
      valueInputOption: 'RAW',
      requestBody: {
        values: values,
      },
    });
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function uploadKeysStats(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Upload Translation Keys Stats to Google Sheets');
  console.log('='.repeat(60));
  console.log('');

  // Extract keys from frontend code
  // Frontend uses translation service patterns (t(), translate(), transloco, hesTranslate, etc.)
  console.log('Extracting keys from frontend code...');
  const frontendKeys = extractFrontendKeysV2(CONFIG.frontendSrcDirectory);
  console.log(`  Found ${frontendKeys.size} keys in frontend`);

  // Extract keys from backend repos (if paths provided)
  // All backend repos use simpler logic: find quoted strings with dots that are lowercase
  let backendKeys = new Set<string>();
  let authKeys = new Set<string>();
  let socketKeys = new Set<string>();

  if (CONFIG.backendSrcDirectory) {
    console.log('Extracting keys from backend code...');
    backendKeys = extractBackendKeysV2(CONFIG.backendSrcDirectory);
    console.log(`  Found ${backendKeys.size} keys in backend`);
  }

  if (CONFIG.authSrcDirectory) {
    console.log('Extracting keys from auth code...');
    authKeys = extractBackendKeysV2(CONFIG.authSrcDirectory);
    console.log(`  Found ${authKeys.size} keys in auth`);
  }

  if (CONFIG.socketSrcDirectory) {
    console.log('Extracting keys from socket code...');
    socketKeys = extractBackendKeysV2(CONFIG.socketSrcDirectory);
    console.log(`  Found ${socketKeys.size} keys in socket`);
  }

  // Combine all backend keys (be + auth + socket)
  const allBackendKeys = new Set([...backendKeys, ...authKeys, ...socketKeys]);
  console.log(
    `  Total backend keys (be + auth + socket): ${allBackendKeys.size}`,
  );

  // Combine keys from all repos
  const codeKeys = new Set([...frontendKeys, ...allBackendKeys]);
  console.log(`  Total combined keys: ${codeKeys.size}`);

  // Extract keys from language files
  console.log('Extracting keys from language files...');
  const langKeys = extractKeysFromLanguageFilesV2(CONFIG.languageDirectory);
  console.log(`  Found ${langKeys.size} keys in language files`);

  // Extract dynamic keys from frontend only
  // Backend repos don't use translation services, so no dynamic keys there
  console.log('Extracting dynamic keys from frontend...');
  const dynamicKeysArray = extractDynamicKeysDetailedV2(
    CONFIG.frontendSrcDirectory,
  );
  console.log(`  Found ${dynamicKeysArray.length} dynamic keys in frontend`);

  // Calculate missing and unused keys
  const codeKeysArray = Array.from(codeKeys).sort();
  const missingKeys = codeKeysArray.filter((key) => !langKeys.has(key));
  const unusedKeys = Array.from(langKeys)
    .filter((key) => !codeKeys.has(key))
    .sort();

  // Sort keys for output
  const frontendKeysArray = Array.from(frontendKeys).sort();
  const backendKeysArray = Array.from(backendKeys).sort();
  const authKeysArray = Array.from(authKeys).sort();
  const socketKeysArray = Array.from(socketKeys).sort();

  console.log('');
  console.log('Summary:');
  console.log(`  Frontend Code Keys: ${frontendKeysArray.length}`);
  console.log(`  Backend Code Keys: ${backendKeysArray.length}`);
  console.log(`  Auth Code Keys: ${authKeysArray.length}`);
  console.log(`  Socket Code Keys: ${socketKeysArray.length}`);
  console.log(`  Total Combined Keys: ${codeKeysArray.length}`);
  console.log(`  Missing Keys: ${missingKeys.length}`);
  console.log(`  Unused Keys: ${unusedKeys.length}`);
  console.log(`  Dynamic Keys (code lines): ${dynamicKeysArray.length}`);
  console.log('');

  // Connect to Google Sheets
  console.log('Connecting to Google Sheets...');
  const sheets = await getGoogleSheetsClient();

  // Upload data to each column
  console.log('Uploading data to "Keys Stats" sheet...');

  console.log('  Writing FE Code Keys to column A...');
  await clearAndWriteColumn(sheets, 'A', frontendKeysArray);

  console.log('  Writing BE Code Keys to column B...');
  await clearAndWriteColumn(sheets, 'B', backendKeysArray);

  console.log('  Writing Auth Code Keys to column C...');
  await clearAndWriteColumn(sheets, 'C', authKeysArray);

  console.log('  Writing Socket Code Keys to column D...');
  await clearAndWriteColumn(sheets, 'D', socketKeysArray);

  console.log('  Writing Un-used keys to column E...');
  await clearAndWriteColumn(sheets, 'E', unusedKeys);

  console.log('  Writing Missing Keys to column F...');
  await clearAndWriteColumn(sheets, 'F', missingKeys);

  console.log('  Writing Dynamic Keys to column G...');
  await clearAndWriteColumn(sheets, 'G', dynamicKeysArray);

  console.log('');
  console.log('Done! Stats uploaded successfully.');
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

uploadKeysStats().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

export { uploadKeysStats };
