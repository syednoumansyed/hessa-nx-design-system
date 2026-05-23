const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to extract keys from TypeScript and HTML files
function extractKeysFromFiles(directory: string): Set<string> {
  const keys = new Set<string>();
  const files = glob.sync(`${directory}/**/*.{ts,html}`);

  // Updated regex patterns
  const regexPatterns = [
    /(?<![a-zA-Z0-9])t\(\s*['"](.+?)['"]\s*\)/g, // t('key') or t("key")
    /\{\{\s*t\(\s*['"](.+?)['"]\s*\)\s*\}\}/g, // {{ t('key') }} or {{ t("key") }}
    /(?<![a-zA-Z0-9])translate\(\s*['"](.+?)['"]\s*\)/g, // translate('key') or translate("key")
    /\{\{['"](.+?)['"](?:\s*\|\s*transloco(?:\s*:\s*\{[^}]*\}\s*)?(?:\s*:\s*\w+(?:\.\w+)*!?)?)\s*\}\}/g, // {{'key' | transloco:{}:languageCtrl.value!}}
  ];

  files.forEach((file: any) => {
    const content = fs.readFileSync(file, 'utf8');
    regexPatterns.forEach((regex) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        if (key && !key.includes('/')) {
          // Exclude potential routes
          keys.add(key);
        }
      }
    });
  });

  return keys;
}

// Function to extract keys from language files
function extractKeysFromLanguageFiles(directory: string): Set<string> {
  const keys = new Set<string>();
  const files = glob.sync(`${directory}/**/*(en|ar).json`);

  files.forEach((file: any) => {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    Object.keys(content).forEach((key) => keys.add(key));
  });

  return keys;
}

// Function to write keys to a JSON file
function writeKeysToFile(keys: Set<string>, filename: string) {
  const keysArray = Array.from(keys);
  fs.writeFileSync(filename, JSON.stringify(keysArray, null, 2));
  console.log(`Keys written to ${filename}`);
}

// Main function
function findMissingTranslationKeys(srcDir: string, langDir: string) {
  const codeKeys = extractKeysFromFiles(srcDir);
  const langKeys = extractKeysFromLanguageFiles(langDir);

  console.log('Keys used in code:', codeKeys.size);
  console.log('Keys in language files:', langKeys.size);

  // Write code keys to JSON file
  writeKeysToFile(codeKeys, 'code-keys.json');

  const missingKeys = Array.from(codeKeys).filter((key) => !langKeys.has(key));
  const missingSet = new Set(missingKeys);
  writeKeysToFile(missingSet, 'missing-keys.json');

  console.log('\nMissing keys:');
  missingKeys.forEach((key) => console.log(key));
}

// Usage
const srcDirectory = './src/app';
const languageDirectory = './src/assets/i18n';
const outputFile = 'code-keys.json';

findMissingTranslationKeys(srcDirectory, languageDirectory);

module.exports = {
  findMissingTranslationKeys,
};
