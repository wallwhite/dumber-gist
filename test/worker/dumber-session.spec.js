import test from 'ava';
import {
  DEFAULT_INDEX_HTML,
  DEFAULT_BUNDLE_JS,
  DumberUninitializedError,
  DumberSession} from '../../worker/dumber-session';

class Dumber {
  constructor(config) {
    this.config = config;
    this.files = [];
  }

  async capture(unit) {
    this.files.push(unit);
  }

  async resolve() {}
  async bundle() {
    return {
      'entry-bundle': {
        files: this.files,
        config: {foo: 'bar'}
      }
    };
  }
}

function auFindDeps() {}

class ServiceCache {
  map = {};

  async reset() {
    this.map = {};
  }

  async put(url, content, contentType) {
    this.map[url] = {content, contentType};
  }
}

const dumberCache = {dc: 1};

test('DumberSession initialises new dumber instance', async t => {
  const serviceCache = new ServiceCache();
  const session = new DumberSession(Dumber, auFindDeps, serviceCache);
  t.falsy(session.isInitialised);
  t.deepEqual(serviceCache.map, {});

  const config = {a:1};
  const data = await session.init(config, dumberCache);
  t.deepEqual(data, {isNew: true});
  t.truthy(session.isInitialised);
  t.deepEqual(serviceCache.map, {
    '/': {
      content: DEFAULT_INDEX_HTML,
      contentType: 'text/html; charset=utf-8'
    },
    '/dist/entry-bundle.js': {
      content: DEFAULT_BUNDLE_JS,
      contentType: 'application/javascript'
    }
  });
  t.deepEqual(session.config, config);
  t.deepEqual(session.instance.config, {
    skipModuleLoader: true,
    depsFinder: undefined,
    cache: dumberCache,
    prepend: ['https://cdn.jsdelivr.net/npm/dumber-module-loader@1.0.0/dist/index.min.js'],
    deps: [
      {name: 'vue', main: 'dist/vue.js', lazyMain: true}
    ]
  });
});

test('DumberSession reuses existing dumber instance', async t => {
  const serviceCache = new ServiceCache();
  const session = new DumberSession(Dumber, auFindDeps, serviceCache);
  t.falsy(session.isInitialised);
  t.deepEqual(serviceCache.map, {});

  const config = {a:1};
  const data = await session.init(config, dumberCache);
  t.deepEqual(data, {isNew: true});
  t.truthy(session.isInitialised);
  t.deepEqual(serviceCache.map, {
    '/': {
      content: DEFAULT_INDEX_HTML,
      contentType: 'text/html; charset=utf-8'
    },
    '/dist/entry-bundle.js': {
      content: DEFAULT_BUNDLE_JS,
      contentType: 'application/javascript'
    }
  });
  t.deepEqual(session.config, config);
  t.deepEqual(session.instance.config, {
    skipModuleLoader: true,
    depsFinder: undefined,
    cache: dumberCache,
    prepend: ['https://cdn.jsdelivr.net/npm/dumber-module-loader@1.0.0/dist/index.min.js'],
    deps: [
      {name: 'vue', main: 'dist/vue.js', lazyMain: true}
    ]
  });
  const instance1 = session.instance;

  const data2 = await session.init(config, dumberCache);
  t.deepEqual(data2, {isNew: false});
  t.truthy(session.isInitialised);
  t.deepEqual(serviceCache.map, {
    '/': {
      content: DEFAULT_INDEX_HTML,
      contentType: 'text/html; charset=utf-8'
    },
    '/dist/entry-bundle.js': {
      content: DEFAULT_BUNDLE_JS,
      contentType: 'application/javascript'
    }
  });
  t.deepEqual(session.config, config);
  t.is(session.instance, instance1);
});

test('DumberSession replaces existing dumber instance with different config', async t => {
  const serviceCache = new ServiceCache();
  const session = new DumberSession(Dumber, auFindDeps, serviceCache);
  t.falsy(session.isInitialised);
  t.deepEqual(serviceCache.map, {});

  const config = {a:1};
  const data = await session.init(config, dumberCache);
  t.deepEqual(data, {isNew: true});
  t.truthy(session.isInitialised);
  t.deepEqual(serviceCache.map, {
    '/': {
      content: DEFAULT_INDEX_HTML,
      contentType: 'text/html; charset=utf-8'
    },
    '/dist/entry-bundle.js': {
      content: DEFAULT_BUNDLE_JS,
      contentType: 'application/javascript'
    }
  });
  t.deepEqual(session.config, config);
  t.deepEqual(session.instance.config, {
    skipModuleLoader: true,
    depsFinder: undefined,
    cache: dumberCache,
    prepend: ['https://cdn.jsdelivr.net/npm/dumber-module-loader@1.0.0/dist/index.min.js'],
    deps: [
      {name: 'vue', main: 'dist/vue.js', lazyMain: true}
    ]
  });
  const instance1 = session.instance;

  const config2 = {a: 2};
  const data2 = await session.init(config2, dumberCache);
  t.deepEqual(data2, {isNew: true});
  t.truthy(session.isInitialised);
  t.deepEqual(serviceCache.map, {
    '/': {
      content: DEFAULT_INDEX_HTML,
      contentType: 'text/html; charset=utf-8'
    },
    '/dist/entry-bundle.js': {
      content: DEFAULT_BUNDLE_JS,
      contentType: 'application/javascript'
    }
  });
  t.deepEqual(session.config, config2);
  t.falsy(session.instance === instance1);
  t.deepEqual(session.instance.config, {
    skipModuleLoader: true,
    depsFinder: undefined,
    cache: dumberCache,
    prepend: ['https://cdn.jsdelivr.net/npm/dumber-module-loader@1.0.0/dist/index.min.js'],
    deps: [
      {name: 'vue', main: 'dist/vue.js', lazyMain: true}
    ]
  });
});

test('DumberSession initialises new dumber instance with aurelia v1 deps finder', async t => {
  const serviceCache = new ServiceCache();
  const session = new DumberSession(Dumber, auFindDeps, serviceCache);
  t.falsy(session.isInitialised);
  t.deepEqual(serviceCache.map, {});

  const config = {isAurelia1: true};
  const data = await session.init(config, dumberCache);
  t.deepEqual(data, {isNew: true});
  t.truthy(session.isInitialised);
  t.deepEqual(serviceCache.map, {
    '/': {
      content: DEFAULT_INDEX_HTML,
      contentType: 'text/html; charset=utf-8'
    },
    '/dist/entry-bundle.js': {
      content: DEFAULT_BUNDLE_JS,
      contentType: 'application/javascript'
    }
  });
  t.deepEqual(session.config, config);
  t.deepEqual(session.instance.config, {
    skipModuleLoader: true,
    depsFinder: auFindDeps,
    cache: dumberCache,
    prepend: ['https://cdn.jsdelivr.net/npm/dumber-module-loader@1.0.0/dist/index.min.js'],
    deps: [
      {name: 'vue', main: 'dist/vue.js', lazyMain: true}
    ]
  });
});

test('DumberSession builds', async t => {
  const serviceCache = new ServiceCache();
  const session = new DumberSession(Dumber, auFindDeps, serviceCache);

  await session.init({}, dumberCache);
  await session.update([
    { filename: 'index.html', content: 'index-html' },
    { filename: 'src/main.js', content: 'main' },
    { filename: 'src/app.js', content: 'app' },
    { filename: 'src/app.html', content: 'app-html' }
  ]);
  t.is(session.instance.files.length, 3);
  t.deepEqual(serviceCache.map, {
    '/': {
      content: 'index-html',
      contentType: 'text/html; charset=utf-8'
    },
    '/dist/entry-bundle.js': {
      content: DEFAULT_BUNDLE_JS,
      contentType: 'application/javascript'
    }
  });
  await session.build();
  t.deepEqual(serviceCache.map, {
    '/': {
      content: 'index-html',
      contentType: 'text/html; charset=utf-8'
    },
    '/dist/entry-bundle.js': {
      content: `main
app
app-html
requirejs.config({
  "foo": "bar"
});`,
      contentType: 'application/javascript'
    }
  });
});

test('DumberSession cannot update before init', async t => {
  const serviceCache = new ServiceCache();
  const session = new DumberSession(Dumber, auFindDeps, serviceCache);

  await t.throwsAsync(async () => {
    await session.update([
      { filename: 'index.html', content: 'index-html' },
      { filename: 'src/main.js', content: 'main' },
      { filename: 'src/app.js', content: 'app' },
      { filename: 'src/app.html', content: 'app-html' }
    ]);
  }, {instanceOf: DumberUninitializedError});
});

test('DumberSession cannot build before init', async t => {
  const serviceCache = new ServiceCache();
  const session = new DumberSession(Dumber, auFindDeps, serviceCache);

  await t.throwsAsync(async () => {
    await session.build();
  }, {instanceOf: DumberUninitializedError});
});
