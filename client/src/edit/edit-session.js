import {inject, observable, computedFrom} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import _ from 'lodash';
import {WorkerService} from '../worker-service';
import {ConsoleLog} from '../embedded-browser/console-log';
import crypto from 'crypto';

function getFilesHash(files) {
  const str = _(files)
    .map(f => `${f.filename}|${f.content}`)
    .join('\n');

  return crypto.createHash('md5').update(str).digest('hex');
}

@inject(EventAggregator, WorkerService, ConsoleLog)
export class EditSession {
  _gist = {description: '', files: []};
  _originalHash = '';
  _hash = '';
  _renderedHash = '';
  files = [];
  description = '';

  // mutation value 0 and -1 is reserved
  // for just newly loaded gist.
  @observable mutation = -1;

  constructor(ea, ws, consoleLog) {
    this.ea = ea;
    this.ws = ws;
    this.consoleLog = consoleLog;
  }

  get gist() {
    return this._gist;
  }

  set gist(newGist) {
    this._gist = newGist;
    this._originalHash = getFilesHash(newGist.files);
  }

  _mutate() {
    if (this.mutation >= 9999 || this.mutation < 0) {
      this.mutation = 1;
    } else {
      this.mutation += 1;
    }
  }

  mutationChanged() {
    this._hash = getFilesHash(this.files);
  }

  @computedFrom('_hash', '_originalHash', 'description', 'this._gist')
  get isChanged() {
    return this._hash !== this._originalHash ||
      this.description !== this._gist.description;
  }

  @computedFrom('_hash', '_renderedHash')
  get isRendered() {
    return this._hash === this._renderedHash;
  }

  loadGist(gist) {
    this.gist = gist;
    this.files = _.map(this.gist.files, f => ({
      filename: f.filename,
      content: f.content,
      isChanged: false
    }));
    this.description = gist.description;

    // set mutation to 0 or -1 to indicate
    // newly loaded gist.
    this.mutation = this.mutation === 0 ? -1 : 0;
    this.ea.publish('loaded-gist');
  }

  importData(data) {
    if (data) {
      if (data.description) {
        this.description = data.description;
      }

      if (data.files) {
        this.files = _.map(data.files, f => ({
          filename: f.filename,
          content: f.content,
          isChanged: !!f.isChanged
        }));
      }

      if (data.gist) {
        this.gist = data.gist;
      }

      this._mutate();
      this.ea.publish('imported-data');
    }
  }

  updateFile(filename, content) {
    const f = _.find(this.files, {filename});
    const oldF = _.find(this.gist.files, {filename});

    if (!f) {
      this.ea.publish('error', 'Cannot update ' + filename + ' because it does not exist.');
      return;
    }

    if (f.content === content) return;
    f.content = content;
    f.isChanged = !oldF || oldF.content !== content;
    this._mutate();
  }

  updatePath(filePath, newFilePath) {
    if (filePath === newFilePath) return;
    let isUpdated = false;

    _.each(this.files, file => {
      const oldFilename = file.filename;
      let newFilename;

      if (file.filename === filePath) {
        newFilename = newFilePath;

      } else if (file.filename.startsWith(filePath + '/')) {
        newFilename = newFilePath + '/' + file.filename.slice(filePath.length + 1);
        const oldF = _.find(this.gist.files, {filename: newFilePath});
        file.isChanged = !oldF || oldF.content !== file.content;

        this.ea.publish('renamed-file', {
          newFilename: newFilePath,
          oldFilename
        });
      }

      if (newFilename) {
        const existingF = _.find(this.files, {filename: newFilename});
        if (existingF) {
          // ignore
          this.ea.publish('error', `Cannot rename ${oldFilename} to ${newFilename} because there is an existing file.`);
          return;
        }

        isUpdated = true;
        const oldF = _.find(this.gist.files, {filename: newFilename});
        file.isChanged = !oldF || oldF.content !== file.content;
        file.filename = newFilename;

        this.ea.publish('renamed-file', {
          newFilename,
          oldFilename
        });
      }
    });

    if (isUpdated) {
      this._mutate();
    }
  }

  createFile(filename, content = '', skipOpen = false) {
    const existingF = _.find(this.files, {filename});
    if (existingF) {
      // ignore
      this.ea.publish('error', 'Cannot create ' + filename + ' because there is an existing file.');
      return;
    }

    const existingFolder = _.find(this.files, f => f.filename.startsWith(filename + '/'));
    if (existingFolder) {
      // ignore
      this.ea.publish('error', 'Cannot create ' + filename + ' because there is an existing folder.');
      return;
    }

    const file = {
      filename: filename,
      content,
      isChanged: true
    };

    this.files.push(file);
    if (!skipOpen) this.ea.publish('open-file', filename);
    this._mutate();
  }

  deleteFile(filename) {
    const idx = _.findIndex(this.files, {filename});
    if (idx !== -1) {
      this.files.splice(idx, 1);
      this._mutate();
    } else {
      this.ea.publish('error', 'Cannot delete ' + filename + ' because the file does not exist.');
    }
  }

  deleteFolder(filePath) {
    let idx;
    let isUpdated = false;
    while ((idx = _.findLastIndex(this.files, f => f.filename.startsWith(filePath + '/'))) !== -1) {
      isUpdated = true;
      this.files.splice(idx, 1);
    }

    if (isUpdated) {
      this._mutate();
    } else {
      this.ea.publish('error', 'Cannot delete folder ' + filePath + ' because it does not exist.');
    }
  }

  async render() {
    try {
      await this._render();
    } catch (e) {
      // Reset rendered hash to force next try
      this._renderedHash = '';
      throw e;
    }
  }

  async _render() {
    const start = (new Date()).getTime();

    // Note all files are copied before rendering.
    // So that user can continue updating app code, future render()
    // will capture new changes.

    const files = _.map(this.files, f => ({
      filename: f.filename,
      content: f.content
    }));

    const _renderingHash = getFilesHash(files);
    const visibleFiles = await this.ws.perform({type: 'bundle', files});
    await this.ws.perform({type: 'sw:update-files', files: visibleFiles});
    this._renderedHash = _renderingHash;

    const seconds = ((new Date()).getTime() - start) / 1000;
    const msg = `[dumber] Built dist/entry-bundle.js in ${seconds.toFixed(1)} secs.`;
    console.log(msg);
    this.consoleLog.dumberLogs.push({
      method: 'system',
      args: [msg]
    });
  }
}
