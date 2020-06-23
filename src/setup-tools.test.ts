import * as toolcache from '@actions/tool-cache';
import test from 'ava';
import nock from 'nock';
import * as path from 'path';

import * as setupTools from './setup-tools';
import * as util from './util';

test('download codeql bundle cache', async t => {

  await util.withTmpDir(async tmpDir => {

    process.env['GITHUB_WORKSPACE'] = tmpDir;

    process.env['RUNNER_TEMP'] = path.join(tmpDir, 'temp');
    process.env['RUNNER_TOOL_CACHE'] = path.join(tmpDir, 'cache');

    const versions = ['20200601', '20200610'];

    for (let i = 0; i < versions.length; i++) {
      const version = versions[i];

      nock('https://example.com')
        .get(`/download/codeql-bundle-${version}/codeql-bundle.tar.gz`)
        .replyWithFile(200, path.join(__dirname, `/../src/testdata/codeql-bundle.tar.gz`));


      process.env['INPUT_TOOLS'] = `https://example.com/download/codeql-bundle-${version}/codeql-bundle.tar.gz`;

      await setupTools.setupCodeQL();

      t.assert(toolcache.find('CodeQL', `0.0.0-${version}`));
    }

    const cachedVersions = toolcache.findAllVersions('CodeQL');

    t.is(cachedVersions.length, 2);
  });
});

test('parse codeql bundle url version', t => {

  const tests = {
    '20200601': '0.0.0-20200601',
    '20200601.0': '0.0.0-20200601.0',
    '20200601.0.0': '20200601.0.0',
    '1.2.3': '1.2.3',
    '1.2.3-alpha': '1.2.3-alpha',
    '1.2.3-beta.1': '1.2.3-beta.1',
  };

  for (const [version, expectedVersion] of Object.entries(tests)) {
    const url = `https://github.com/.../codeql-bundle-${version}/...`;

    try {
      const parsedVersion = setupTools.getCodeQLURLVersion(url);
      t.deepEqual(parsedVersion, expectedVersion);
    } catch (e) {
      t.fail(e.message);
    }
  }
});
