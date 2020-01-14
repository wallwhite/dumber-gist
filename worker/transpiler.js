import path from 'path';
import {Au2Transpiler} from './transpilers/au2';
import {JsTranspiler} from './transpilers/js';
import {SassTranspiler} from './transpilers/sass';
import {LessTranspiler} from './transpilers/less';
import {TextTranspiler} from './transpilers/text';

export class Transpiler {
  constructor() {
    this.transpilers = [
      new Au2Transpiler(),
      new JsTranspiler(),
      new SassTranspiler(),
      new LessTranspiler(),
      new TextTranspiler()
    ];
  }

  findTranspiler(file, files) {
    return this.transpilers.find(t => t.match(file, files));
  }

  async transpile(file, files) {
    const transpiler = this.findTranspiler(file, files);
    let result;

    if (transpiler) {
      result = await transpiler.transpile(file, files);
    }

    if (result) {
      if (result.intermediate) {
        return this.transpile(result, files);
      }

      let moduleId = path.relative('src', result.filename);
      if (moduleId.endsWith('.js')) moduleId = moduleId.slice(0, -3);

      return {...result, moduleId};
    }
  }
}
