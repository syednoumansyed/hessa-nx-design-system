const fs = require('fs');
const path = require('path');

const DEFAULT_BASE_URL = 'http://127.0.0.1:6006';

const UI_CREATION_CASES = [
  {
    id: 'student-assignment-form',
    goal:
      'Create a student-facing assignment form with title input, notes textarea, attachments, validation, loading submit, and student role styling.',
    requiredComponents: ['input', 'textarea', 'attachment', 'button'],
    desiredStates: ['default', 'error', 'loading', 'disabled', 'student'],
    desiredDevices: ['desktop', 'mobile'],
  },
  {
    id: 'filterable-student-table',
    goal:
      'Create a teacher table page with student selector, search, filters, responsive table, empty/loading/error states, and mobile branch behavior.',
    requiredComponents: [
      'student-selector',
      'search-box',
      'filter-panel',
      'responsive-table',
      'button',
    ],
    desiredStates: ['default', 'loading', 'error', 'empty', 'mobile', 'desktop'],
    desiredDevices: ['desktop', 'mobile'],
  },
  {
    id: 'modal-sheet-sidebar-flow',
    goal:
      'Create a workflow where desktop opens a sidebar and mobile opens a modal-sheet path, with service-backed modal behavior and footer actions.',
    requiredComponents: ['sidebar', 'modal-sheet', 'modal', 'button'],
    desiredStates: [
      'service',
      'interactive',
      'loading',
      'disabled',
      'mobile',
      'desktop',
    ],
    desiredDevices: ['desktop', 'mobile'],
  },
];

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function estimateTokens(text) {
  return Math.ceil(String(text).length / 4);
}

function compactSlug(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function normalizeComponentName(value) {
  return compactSlug(value)
    .replace(/^app-ds-/, '')
    .replace(/^ds-/, '')
    .replace(/-stories$/, '');
}

function storyNameFromExport(exportName) {
  return String(exportName)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function walk(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function extractArrayLiteralValues(source, key) {
  const match = source.match(new RegExp(`${key}\\s*:\\s*\\[([^\\]]*)\\]`, 'm'));
  if (!match) return [];
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((item) => item[1]);
}

function extractMetaBlock(source) {
  const exportDefaultIndex = source.search(/export\s+default\s+meta\s*;/m);
  const metaStartIndex = source.lastIndexOf('const meta', exportDefaultIndex);
  if (metaStartIndex < 0 || exportDefaultIndex < 0) return source;
  return source.slice(metaStartIndex, exportDefaultIndex);
}

function storyBlockForExport(source, exportName) {
  const start = source.indexOf(`export const ${exportName}`);
  if (start < 0) return '';
  const next = source.indexOf('\nexport const ', start + 1);
  return source.slice(start, next >= 0 ? next : source.length);
}

function parseLocalStoryFiles(root) {
  const storiesRoot = path.join(root, 'src/stories/components');
  const files = walk(storiesRoot)
    .filter((file) => file.endsWith('.stories.ts'))
    .sort();
  const entries = {};

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const metaBlock = extractMetaBlock(source);
    const title = metaBlock.match(/title:\s*['"]([^'"]+)['"]/)?.[1];
    if (!title) continue;

    const importPath = `./${toPosix(path.relative(root, file))}`;
    const metaTags = extractArrayLiteralValues(metaBlock, 'tags');
    const exports = [...source.matchAll(/^export const\s+([A-Za-z0-9_]+)/gm)].map(
      (match) => match[1],
    );
    const baseId = compactSlug(title);

    for (const exportName of exports) {
      const block = storyBlockForExport(source, exportName);
      const hasPlay = /\bplay\s*:\s*(async|\()/m.test(block);
      const tags = [
        ...new Set([
          ...metaTags,
          'dev',
          'test',
          ...(hasPlay ? ['play-fn'] : []),
        ]),
      ];
      const id = `${baseId}--${compactSlug(exportName)}`;
      entries[id] = {
        id,
        type: 'story',
        title,
        name: storyNameFromExport(exportName),
        importPath,
        tags,
      };
    }
  }

  return {
    v: 'local-source',
    entries,
  };
}

async function loadStorybookIndex({ root, source }) {
  if (!source || source === 'local-source') {
    const index = parseLocalStoryFiles(root);
    return {
      index,
      rawText: JSON.stringify(index),
      source: 'local-source',
    };
  }

  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source}: HTTP ${response.status}`);
    }
    const rawText = await response.text();
    return {
      index: JSON.parse(rawText),
      rawText,
      source,
    };
  }

  const sourcePath = path.resolve(root, source);
  const rawText = fs.readFileSync(sourcePath, 'utf8');
  return {
    index: JSON.parse(rawText),
    rawText,
    source: sourcePath,
  };
}

function componentFromEntry(entry) {
  const fromImportPath = entry.importPath?.match(
    /src\/stories\/components\/([^/]+)/,
  )?.[1];
  if (fromImportPath) return normalizeComponentName(fromImportPath);

  const titlePart = String(entry.title || '').split('/').pop();
  return normalizeComponentName(titlePart || 'unknown');
}

function priorityFromTitle(title) {
  const match = String(title || '').match(/\bP([0-9])\b/i);
  return match ? `P${match[1]}` : 'unknown';
}

function inferDevice(entry) {
  const haystack = `${entry.id} ${entry.title} ${entry.name} ${(entry.tags || []).join(' ')}`.toLowerCase();
  const tag = (entry.tags || []).find((item) => item.startsWith('device:'));
  if (tag) return tag.split(':')[1];
  if (/\bmobile|bottom-sheet|modal-sheet|phone\b/.test(haystack)) {
    return 'mobile';
  }
  if (/\btablet\b/.test(haystack)) return 'tablet';
  if (/\bdesktop|sidebar-service-path\b/.test(haystack)) return 'desktop';
  if (/\bresponsive\b/.test(haystack)) return 'responsive';
  return 'unspecified';
}

function inferLocale(entry) {
  const haystack = `${entry.id} ${entry.name} ${(entry.tags || []).join(' ')}`.toLowerCase();
  if (haystack.includes('rtl') || haystack.includes('locale:rtl')) return 'rtl';
  if (haystack.includes('ltr') || haystack.includes('locale:ltr')) return 'ltr';
  return 'unspecified';
}

function inferRole(entry) {
  const haystack = `${entry.id} ${entry.name} ${(entry.tags || []).join(' ')}`.toLowerCase();
  if (haystack.includes('student')) return 'student';
  if (haystack.includes('personnel') || haystack.includes('teacher')) {
    return 'personnel';
  }
  return 'unspecified';
}

function inferState(entry) {
  const haystack = `${entry.id} ${entry.name} ${(entry.tags || []).join(' ')}`.toLowerCase();
  const states = [];
  for (const state of [
    'default',
    'disabled',
    'loading',
    'error',
    'empty',
    'interactive',
    'service',
    'mobile',
    'desktop',
    'rtl',
    'ltr',
    'student',
  ]) {
    if (haystack.includes(state)) states.push(state);
  }
  if (haystack.includes('validation') || haystack.includes('invalid')) {
    states.push('error');
  }
  if (haystack.includes('read-only') || haystack.includes('readonly')) {
    states.push('disabled');
  }
  return [...new Set(states.length ? states : ['unspecified'])];
}

function inferContract(entry) {
  const haystack = `${entry.id} ${entry.title} ${entry.name} ${(entry.tags || []).join(' ')}`.toLowerCase();
  const contracts = [];
  if ((entry.tags || []).includes('play-fn')) contracts.push('play');
  if (/\bservice|notification|toast|modal|sheet|sidebar|overlay\b/.test(haystack)) {
    contracts.push('service-or-overlay');
  }
  if (/\binput|textarea|select|checkbox|radio|switch|form|validation|filter\b/.test(haystack)) {
    contracts.push('form');
  }
  if (/\btable|grid|data-source|pagination|sort|filter\b/.test(haystack)) {
    contracts.push('data');
  }
  if (/\binteractive|trigger|click|menu|selector|picker\b/.test(haystack)) {
    contracts.push('interaction');
  }
  return [...new Set(contracts.length ? contracts : ['visual'])];
}

function inferProviderHints(entry) {
  const haystack = `${entry.id} ${entry.title} ${entry.name}`.toLowerCase();
  const hints = [];
  if (/\bmobile|bottom-sheet|modal-sheet\b/.test(haystack)) hints.push('mobile');
  if (/\bmobile|sidebar|responsive-table|search-box\b/.test(haystack)) {
    hints.push('layout');
  }
  if (/\brtl|arabic\b/.test(haystack)) hints.push('locale:ar');
  if (/\btoast|toaster|notification\b/.test(haystack)) hints.push('toaster:mock');
  if (/\battachment|file\b/.test(haystack)) {
    hints.push('fileInteractions:mock');
  }
  return [...new Set(hints)];
}

function absoluteStoryUrl(baseUrl, id) {
  return `${String(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`;
}

function compactStoryRecord(entry, baseUrl) {
  return {
    id: entry.id,
    title: entry.title,
    name: entry.name,
    component: componentFromEntry(entry),
    priority: priorityFromTitle(entry.title),
    device: inferDevice(entry),
    locale: inferLocale(entry),
    role: inferRole(entry),
    states: inferState(entry),
    contracts: inferContract(entry),
    providerHints: inferProviderHints(entry),
    hasPlay: Boolean((entry.tags || []).includes('play-fn')),
    tags: entry.tags || [],
    importPath: entry.importPath,
    url: `/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=story`,
    absoluteUrl: absoluteStoryUrl(baseUrl, entry.id),
  };
}

function namesFromTokenSection(tokens, section) {
  return Object.keys(tokens[section] || {}).filter((key) => !key.startsWith('$'));
}

function buildTokenPack(root) {
  const tokenPath = path.join(root, 'src/app/design-system/design-tokens.json');
  const tokens = fs.existsSync(tokenPath) ? readJson(tokenPath) : {};
  const metadata = tokens.$metadata || {};

  return {
    sourceFiles: [
      'src/app/design-system/design-tokens.json',
      'src/stories/docs/TokenSystem.mdx',
      'src/stories/docs/RTLGuide.mdx',
    ],
    breakpoints: metadata.breakpoints || {
      mobile: 'default below 768px',
      tablet: 'min-width 768px',
      'desktop-typography': 'min-width 1024px',
      'desktop-spacing': 'min-width 1280px',
    },
    fonts: metadata.fonts || {
      ltr: { family: 'Nunito', activation: 'default' },
      rtl: { family: 'Lama Rounded', activation: "html[lang='ar']" },
    },
    theming:
      metadata.themingNote ||
      'Role theming uses data-role. No dark mode token axis.',
    spacing: namesFromTokenSection(tokens, 'spacing').map((token) => ({
      token,
      cssVariable: `--ds-spacing-${token}`,
      tailwind: [`p-ds-${token}`, `px-ds-${token}`, `gap-ds-${token}`],
    })),
    gaps: namesFromTokenSection(tokens, 'gaps').map((token) => ({
      token,
      cssVariable: `--ds-gaps-${token}`,
      tailwind: [`gap-ds-${token}`],
    })),
    radius: namesFromTokenSection(tokens, 'cornerRadius').map((token) => ({
      token,
      cssVariable: `--ds-corner-radius-${token}`,
      tailwind: [`rounded-ds-${token}`],
    })),
    semanticColorNamespaces: Object.keys(tokens.semantic || {}).filter(
      (key) => !key.startsWith('$'),
    ),
    usageRules: [
      'Prefer semantic color classes over primitive colors.',
      'Use p-ds-*, px-ds-*, gap-ds-*, and rounded-ds-* utilities instead of arbitrary spacing.',
      'Use text-ds-* or existing composed DS typography classes; do not scale font size with viewport width.',
      'Use logical spacing for RTL: ps-*, pe-*, ms-*, me-*, start-*, end-*.',
      'Use <div data-role="student"> for student theming when a component supports it.',
      'Typography reaches desktop scale at 1024px; spacing/layout tokens reach desktop scale at 1280px.',
    ],
  };
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function storyScore(story, testCase, component) {
  let score = 0;
  if (story.component === component) score += 20;
  if (story.hasPlay) score += 8;
  if (story.contracts.some((contract) => contract !== 'visual')) score += 5;
  score += story.states.filter((state) => testCase.desiredStates.includes(state)).length * 4;
  if (testCase.desiredDevices.includes(story.device)) score += 4;
  if (story.name.toLowerCase().includes('default')) score += 1;
  return score;
}

function buildContextPacks({ byComponent, tokenPack }) {
  const packs = {};

  for (const testCase of UI_CREATION_CASES) {
    const selectedStories = {};
    for (const component of testCase.requiredComponents) {
      const stories = byComponent[component] || [];
      selectedStories[component] = stories
        .map((story) => ({ story, score: storyScore(story, testCase, component) }))
        .sort((left, right) => right.score - left.score)
        .slice(0, 4)
        .map(({ story }) => story);
    }

    packs[testCase.id] = {
      id: testCase.id,
      goal: testCase.goal,
      usage: [
        'Use these stories as rendered/component references before writing UI.',
        'Read the component source and selected stories if available locally.',
        'Render only the selected device/provider story needed for final validation.',
        'Use tokenPack rules for spacing, typography, semantic colors, RTL, and role theming.',
      ],
      selectedStories,
      tokenPack,
      expectedAgentOutput: {
        shouldReferenceStories: true,
        shouldUseDesignTokens: true,
        shouldAvoidRawHtmlControls: true,
        shouldAvoidRawHexColors: true,
        shouldUseReactiveFormsForForms: true,
        shouldValidateMobileProviderStories: testCase.desiredDevices.includes('mobile'),
      },
    };
  }

  return packs;
}

function buildManifest({ index, baseUrl, source, root }) {
  const entries = Object.values(index.entries || {});
  const storyEntries = entries.filter((entry) => entry.type === 'story');
  const docsEntries = entries.filter((entry) => entry.type === 'docs');
  const stories = storyEntries.map((entry) => compactStoryRecord(entry, baseUrl));
  const byComponent = groupBy(stories, (story) => story.component);
  const tokenPack = buildTokenPack(root);
  const contextPacks = buildContextPacks({ byComponent, tokenPack });

  const components = Object.entries(byComponent)
    .map(([component, componentStories]) => ({
      component,
      storyCount: componentStories.length,
      playCount: componentStories.filter((story) => story.hasPlay).length,
      deviceCoverage: [...new Set(componentStories.map((story) => story.device))].sort(),
      contractCoverage: [
        ...new Set(componentStories.flatMap((story) => story.contracts)),
      ].sort(),
      shard: `components/${component}.json`,
    }))
    .sort((left, right) => left.component.localeCompare(right.component));

  return {
    rootIndex: {
      generatedAt: new Date().toISOString(),
      source,
      baseUrl,
      summary: {
        entries: entries.length,
        stories: stories.length,
        docs: docsEntries.length,
        components: components.length,
        storiesWithPlay: stories.filter((story) => story.hasPlay).length,
      },
      components,
      tokenPack: 'tokens.json',
      allStories: 'stories.json',
      contextPacks: Object.keys(contextPacks)
        .sort()
        .map((id) => ({ id, path: `context-packs/${id}.json` })),
    },
    stories,
    byComponent,
    tokenPack,
    contextPacks,
  };
}

function writeManifest({ manifest, outDir }) {
  ensureDir(outDir);
  ensureDir(path.join(outDir, 'components'));
  ensureDir(path.join(outDir, 'context-packs'));
  writeJson(path.join(outDir, 'index.json'), manifest.rootIndex);
  writeJson(path.join(outDir, 'stories.json'), manifest.stories);
  writeJson(path.join(outDir, 'tokens.json'), manifest.tokenPack);

  for (const [component, stories] of Object.entries(manifest.byComponent)) {
    writeJson(path.join(outDir, 'components', `${component}.json`), {
      component,
      storyCount: stories.length,
      stories,
    });
  }

  for (const [id, pack] of Object.entries(manifest.contextPacks)) {
    writeJson(path.join(outDir, 'context-packs', `${id}.json`), pack);
  }
}

module.exports = {
  DEFAULT_BASE_URL,
  UI_CREATION_CASES,
  absoluteStoryUrl,
  buildManifest,
  buildTokenPack,
  ensureDir,
  estimateTokens,
  loadStorybookIndex,
  parseArgs,
  writeJson,
  writeManifest,
};
