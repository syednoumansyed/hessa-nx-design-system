#!/usr/bin/env node

const path = require('path');
const {
  DEFAULT_BASE_URL,
  buildManifest,
  estimateTokens,
  loadStorybookIndex,
  parseArgs,
  writeManifest,
} = require('./common');

async function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(__dirname, '../..');
  const source = args.source || 'local-source';
  const baseUrl = args['base-url'] || process.env.STORYBOOK_BASE_URL || DEFAULT_BASE_URL;
  const outDir = path.resolve(root, args.out || 'tmp/storybook-agent/agent-manifest');

  const loaded = await loadStorybookIndex({ root, source });
  const manifest = buildManifest({
    index: loaded.index,
    baseUrl,
    source: loaded.source,
    root,
  });

  writeManifest({ manifest, outDir });

  console.log('Storybook agent manifest');
  console.log('------------------------');
  console.log(`Source: ${loaded.source}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Output: ${path.relative(root, outDir)}`);
  console.log(`Stories: ${manifest.rootIndex.summary.stories}`);
  console.log(`Docs: ${manifest.rootIndex.summary.docs}`);
  console.log(`Components: ${manifest.rootIndex.summary.components}`);
  console.log(`Stories with play(): ${manifest.rootIndex.summary.storiesWithPlay}`);
  console.log(`Context packs: ${manifest.rootIndex.contextPacks.length}`);
  console.log(`Raw index estimate: ${estimateTokens(loaded.rawText)} tokens`);
  console.log(
    `Root manifest estimate: ${estimateTokens(JSON.stringify(manifest.rootIndex))} tokens`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
