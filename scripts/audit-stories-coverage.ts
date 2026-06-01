const fs = require('fs') as typeof import('fs');
const path = require('path') as typeof import('path');

type MatrixExpectation =
  | 'Default'
  | 'LTR'
  | 'RTL'
  | 'Disabled'
  | 'Loading'
  | 'Error'
  | 'StudentRole';

interface StoryFileAudit {
  file: string;
  title: string | null;
  exports: string[];
  missingMatrix: MatrixExpectation[];
  hasArgTypes: boolean;
  hasPlay: boolean;
  interactiveCandidate: boolean;
}

const root = process.cwd();
const designSystemDir = path.join(root, 'src/app/design-system');
const storiesDir = path.join(root, 'src/stories');
const componentStoriesDir = path.join(storiesDir, 'components');

const walk = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
};

const toPosix = (filePath: string): string =>
  path.relative(root, filePath).split(path.sep).join('/');

const canonical = (name: string): string =>
  name
    .replace(/^ds-/, '')
    .replace(/^app-ds-/, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const read = (filePath: string): string => fs.readFileSync(filePath, 'utf8');

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const topLevelComponentFolders = fs
  .readdirSync(designSystemDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((folder) =>
    walk(path.join(designSystemDir, folder)).some((file) =>
      /\.component\.ts$/.test(file),
    ),
  )
  .sort();

const storyFiles = walk(storiesDir)
  .filter((file) => /\.stories\.ts$/.test(file))
  .sort();

const componentStoryFiles = storyFiles.filter((file) =>
  file.startsWith(componentStoriesDir + path.sep),
);

const storyFolderNames = new Set(
  componentStoryFiles.map((file) =>
    canonical(
      path.relative(componentStoriesDir, path.dirname(file)).split(path.sep)[0],
    ),
  ),
);

const componentSourceByFolder = new Map<string, string>();
for (const folder of topLevelComponentFolders) {
  const componentSource = walk(path.join(designSystemDir, folder))
    .filter((file) => /\.(component|directive)\.ts$/.test(file))
    .map(read)
    .join('\n');
  componentSourceByFolder.set(canonical(folder), componentSource);
}

const componentForStory = (file: string): string | null => {
  if (!file.startsWith(componentStoriesDir + path.sep)) return null;
  const storyFolder = canonical(
    path.relative(componentStoriesDir, path.dirname(file)).split(path.sep)[0],
  );
  return (
    topLevelComponentFolders.find(
      (folder) => canonical(folder) === storyFolder,
    ) ?? null
  );
};

const extractExports = (source: string): string[] =>
  [...source.matchAll(/^export const\s+([A-Za-z0-9_]+)/gm)].map(
    (match) => match[1],
  );

const storyNameKey = (name: string): string =>
  name.replace(/[^a-z0-9]/gi, '').toLowerCase();

const matrixExportAliases: Record<MatrixExpectation, string[]> = {
  Default: ['Default', 'Primary', 'Basic', 'Info', 'Single', 'SingleSelect'],
  LTR: ['LTR', 'LeftToRight'],
  RTL: ['RTL', 'RightToLeft'],
  Disabled: ['Disabled', 'Readonly', 'ReadOnly'],
  Loading: ['Loading', 'IsLoading'],
  Error: ['Error', 'Invalid', 'Validation'],
  StudentRole: ['StudentRole', 'Student', 'StudentTheme'],
};

const hasExportLike = (
  exports: string[],
  expectation: MatrixExpectation,
): boolean => {
  const exportKeys = exports.map(storyNameKey);
  return matrixExportAliases[expectation].some((alias) => {
    const aliasKey = storyNameKey(alias);
    return exportKeys.some(
      (name) => name === aliasKey || name.includes(aliasKey),
    );
  });
};

const expectedMatrixFor = (componentSource: string): MatrixExpectation[] => {
  const sourceWithoutComments = stripComments(componentSource);
  const expectations: MatrixExpectation[] = ['Default', 'LTR', 'RTL'];
  if (/\b(disabled|isreadonly|readOnly)\b/i.test(sourceWithoutComments)) {
    expectations.push('Disabled');
  }
  if (/\b(isLoading|loading)\b/i.test(sourceWithoutComments)) {
    expectations.push('Loading');
  }
  if (
    /\b(errorMessage|error|invalid|validation)\b/i.test(sourceWithoutComments)
  ) {
    expectations.push('Error');
  }
  if (
    /(["'`\s])student:[^\s"'`]+|data-role=["']student["']/i.test(
      sourceWithoutComments,
    )
  ) {
    expectations.push('StudentRole');
  }
  return expectations;
};

const isInteractiveCandidate = (
  componentSource: string,
  storySource: string,
): boolean =>
  /ControlValueAccessor|EventEmitter|@Output\s*\(|\boutput\s*\(|\bemit\s*\(|\([a-z][\w-]*\)\s*=|ToastrService|HesToasterService|ModalController|PopoverController|ActionSheetController|DsFileInteractionService/i.test(
    stripComments(`${componentSource}\n${storySource}`),
  );

const storyAudits: StoryFileAudit[] = componentStoryFiles.map((file) => {
  const source = read(file);
  const exports = extractExports(source);
  const componentFolder = componentForStory(file);
  const componentSource = componentFolder
    ? (componentSourceByFolder.get(canonical(componentFolder)) ?? '')
    : '';
  const expectedMatrix = componentFolder
    ? expectedMatrixFor(componentSource)
    : [];
  const missingMatrix = expectedMatrix.filter(
    (expectation) => !hasExportLike(exports, expectation),
  );

  return {
    file: toPosix(file),
    title: source.match(/title:\s*['"]([^'"]+)['"]/)?.[1] ?? null,
    exports,
    missingMatrix,
    hasArgTypes: /\bargTypes\s*:/.test(source),
    hasPlay: /\bplay\s*:\s*(async|\()/m.test(source),
    interactiveCandidate: isInteractiveCandidate(componentSource, source),
  };
});

const missingComponentStories = topLevelComponentFolders
  .filter((folder) => !storyFolderNames.has(canonical(folder)))
  .map((folder) => ({
    folder,
    path: `src/app/design-system/${folder}`,
  }));

const filesMissingArgTypes = storyAudits
  .filter((audit) => !audit.hasArgTypes)
  .map((audit) => audit.file);

const interactiveWithoutPlay = storyAudits
  .filter((audit) => audit.interactiveCandidate && !audit.hasPlay)
  .map((audit) => audit.file);

const matrixGaps = storyAudits
  .filter((audit) => audit.missingMatrix.length > 0)
  .map((audit) => ({
    file: audit.file,
    title: audit.title,
    missing: audit.missingMatrix,
  }));

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    componentFolders: topLevelComponentFolders.length,
    componentStoryFiles: componentStoryFiles.length,
    missingComponentStories: missingComponentStories.length,
    storyFilesMissingArgTypes: filesMissingArgTypes.length,
    interactiveStoriesMissingPlay: interactiveWithoutPlay.length,
    storyFilesWithMatrixGaps: matrixGaps.length,
  },
  missingComponentStories,
  filesMissingArgTypes,
  interactiveWithoutPlay,
  matrixGaps,
};

const outIndex = process.argv.indexOf('--out');
const outFile =
  outIndex >= 0 && process.argv[outIndex + 1]
    ? process.argv[outIndex + 1]
    : 'tmp/storybook-coverage-report.json';
const outPath = path.resolve(root, outFile);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

console.log('Storybook coverage audit');
console.log('------------------------');
console.log(`Component folders: ${report.summary.componentFolders}`);
console.log(`Component story files: ${report.summary.componentStoryFiles}`);
console.log(
  `Missing component story folders: ${report.summary.missingComponentStories}`,
);
console.log(
  `Story files missing argTypes: ${report.summary.storyFilesMissingArgTypes}`,
);
console.log(
  `Interactive candidates missing play(): ${report.summary.interactiveStoriesMissingPlay}`,
);
console.log(
  `Story files with matrix gaps: ${report.summary.storyFilesWithMatrixGaps}`,
);
console.log(`JSON report: ${toPosix(outPath)}`);

if (missingComponentStories.length) {
  console.log('\nMissing component story folders:');
  for (const item of missingComponentStories) {
    console.log(`- ${item.folder} (${item.path})`);
  }
}
