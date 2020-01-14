const packageJson = `{
  "dependencies": {
    "aurelia": "dev"
  }
}
`;

const indexHtml = ext => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gist Code</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no">
  <base href="/">
</head>
<!--
Gist Code uses dumber bundler, the default bundle file
is /dist/entry-bundle.js.
The starting module is "main" (data-main attribute on script)
which is your src/main${ext}.
-->
<body>
  <my-app></my-app>
  <script src="/dist/entry-bundle.js" data-main="main"></script>
</body>
</html>
`;

const main = `import Aurelia from 'aurelia';
import { MyApp } from './my-app';

Aurelia.app(MyApp).start();
`;

const appHtml = `<!--
Try to create a paired css/scss/sass/less file like my-app.scss.
It will be automatically imported based on convention.
 -->
<h1>\${message}</h1>
`;

const appJs = `export class MyApp {
  message = 'Hello Aurelia2!';
}
`;

const appTs = `export class MyApp {
  public message: string = 'Hello Aurelia2!';
}
`;

export default function(transpiler) {
  const ext = transpiler === 'typescript' ? '.ts' : '.js';
  const files = [
    {
      filename: 'package.json',
      content: packageJson
    },
    {
      filename: 'index.html',
      content: indexHtml(ext)
    },
    {
      filename: `src/main${ext}`,
      content: main
    },
    {
      filename: 'src/my-app.html',
      content: appHtml
    },
    {
      filename: `src/my-app${ext}`,
      content: ext === '.js' ? appJs : appTs
    }
  ];
  return files;
}
