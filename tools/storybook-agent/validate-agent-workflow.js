#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_BASE_URL,
  UI_CREATION_CASES,
  buildManifest,
  estimateTokens,
  loadStorybookIndex,
  parseArgs,
  writeJson,
  writeManifest,
} = require('./common');

function addCheck(checks, name, passed, details = '') {
  checks.push({ name, passed: Boolean(passed), details });
}

async function checkIframes(stories, limit) {
  const checks = [];
  for (const story of stories.slice(0, limit)) {
    try {
      const response = await fetch(story.absoluteUrl, {
        signal: AbortSignal.timeout(5000),
      });
      checks.push({
        id: story.id,
        url: story.absoluteUrl,
        status: response.status,
        ok: response.ok,
      });
    } catch (error) {
      checks.push({
        id: story.id,
        url: story.absoluteUrl,
        status: 'unreachable',
        ok: false,
        error: error.message,
      });
    }
  }
  return checks;
}

async function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(__dirname, '../..');
  const source = args.source || 'local-source';
  const baseUrl = args['base-url'] || process.env.STORYBOOK_BASE_URL || DEFAULT_BASE_URL;
  const outRoot = path.resolve(root, args.out || 'tmp/storybook-agent');
  const manifestDir = path.join(outRoot, 'agent-manifest');
  const renderLimit = Number(args['render-limit'] || 0);
  const checks = [];

  const loaded = await loadStorybookIndex({ root, source });
  const manifest = buildManifest({
    index: loaded.index,
    baseUrl,
    source: loaded.source,
    root,
  });
  writeManifest({ manifest, outDir: manifestDir });

  const rootManifestTokens = estimateTokens(JSON.stringify(manifest.rootIndex));
  const rawTokens = estimateTokens(loaded.rawText);

  addCheck(
    checks,
    'manifest has stories',
    manifest.rootIndex.summary.stories >= 20,
    `${manifest.rootIndex.summary.stories} stories discovered`,
  );
  addCheck(
    checks,
    'root manifest is cheaper than raw Storybook index',
    rootManifestTokens < rawTokens,
    `${rootManifestTokens} estimated tokens vs ${rawTokens} raw-index tokens`,
  );
  addCheck(
    checks,
    'token pack is generated',
    Boolean(
      manifest.tokenPack.breakpoints &&
        manifest.tokenPack.semanticColorNamespaces.length,
    ),
    `${manifest.tokenPack.semanticColorNamespaces.length} semantic namespaces`,
  );
  addCheck(
    checks,
    'token pack includes breakpoint mismatch rule',
    manifest.tokenPack.usageRules.some((rule) => rule.includes('1024px')) &&
      manifest.tokenPack.usageRules.some((rule) => rule.includes('1280px')),
    manifest.tokenPack.usageRules.join(' | '),
  );

  for (const testCase of UI_CREATION_CASES) {
    const pack = manifest.contextPacks[testCase.id];
    const missing = testCase.requiredComponents.filter(
      (component) => !pack?.selectedStories?.[component]?.length,
    );
    addCheck(
      checks,
      `context pack resolves stories: ${testCase.id}`,
      missing.length === 0,
      missing.length
        ? `missing ${missing.join(', ')}`
        : `resolved ${testCase.requiredComponents.length} component families`,
    );
  }

  addCheck(
    checks,
    'mobile/provider stories are discoverable',
    manifest.stories.some(
      (story) =>
        story.device === 'mobile' &&
        (story.providerHints.includes('mobile') ||
          story.contracts.includes('service-or-overlay')),
    ),
    `${manifest.stories.filter((story) => story.device === 'mobile').length} mobile candidates`,
  );

  for (const requiredComponent of [
    'student-selector',
    'filter-panel',
    'responsive-table',
    'sidebar',
    'modal-sheet',
  ]) {
    addCheck(
      checks,
      `component shard exists: ${requiredComponent}`,
      Boolean(manifest.byComponent[requiredComponent]?.length),
      `${manifest.byComponent[requiredComponent]?.length || 0} stories`,
    );
  }

  let iframeChecks = [];
  if (renderLimit > 0) {
    const candidates = [
      ...Object.values(manifest.contextPacks).flatMap((pack) =>
        Object.values(pack.selectedStories).flat(),
      ),
    ];
    const uniqueCandidates = [
      ...new Map(candidates.map((story) => [story.id, story])).values(),
    ];
    iframeChecks = await checkIframes(uniqueCandidates, renderLimit);
    addCheck(
      checks,
      'selected story iframe URLs are reachable',
      iframeChecks.every((check) => check.ok),
      iframeChecks.map((check) => `${check.id}:${check.status}`).join(', '),
    );
  }

  const failed = checks.filter((check) => !check.passed);
  const summary = {
    generatedAt: new Date().toISOString(),
    source: loaded.source,
    baseUrl,
    manifestDir: path.relative(root, manifestDir),
    tokenEstimates: {
      rawIndex: rawTokens,
      rootManifest: rootManifestTokens,
    },
    checks,
    iframeChecks,
  };
  writeJson(path.join(outRoot, 'validation-summary.json'), summary);

  const report = [
    '# Storybook Agent Workflow Validation',
    '',
    `Generated: ${summary.generatedAt}`,
    `Source: ${summary.source}`,
    `Base URL: ${summary.baseUrl}`,
    '',
    '## Token Estimates',
    '',
    `- Raw Storybook index: ~${summary.tokenEstimates.rawIndex} tokens`,
    `- Root agent manifest: ~${summary.tokenEstimates.rootManifest} tokens`,
    '',
    '## Checks',
    '',
    ...checks.map(
      (check) => `- ${check.passed ? 'PASS' : 'FAIL'}: ${check.name} (${check.details})`,
    ),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(outRoot, 'report.md'), report);

  console.log('Storybook agent workflow validation');
  console.log('-----------------------------------');
  console.log(`Checks: ${checks.length - failed.length}/${checks.length} passed`);
  console.log(`Report: ${path.relative(root, path.join(outRoot, 'report.md'))}`);

  if (failed.length) {
    for (const check of failed) {
      console.log(`FAIL: ${check.name} - ${check.details}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
