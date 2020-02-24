import {inject, bindable, bindingMode} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {BrowserConfigDialog} from './dialogs/browser-config-dialog';
import {EditSession} from '../edit/edit-session';
import {HistoryTracker} from '../history-tracker';

@inject(EventAggregator, DialogService, EditSession, HistoryTracker)
export class BrowserBar {
  @bindable isBundling;
  @bindable insideIframe;
  @bindable({defaultBindingMode: bindingMode.twoWay}) autoRefresh;
  @bindable bundle;

  constructor(ea, dialogService, session, historyTracker) {
    this.ea = ea;
    this.dialogService = dialogService;
    this.session = session;
    this.historyTracker = historyTracker;
  }

  goBack() {
    if (!this.isBundling && this.historyTracker.canGoBack) {
      this.ea.publish('history-back');
    }
  }

  goForward() {
    if (!this.isBundling && this.historyTracker.canGoForward) {
      this.ea.publish('history-forward');
    }
  }

  config() {
    this.dialogService.open({
      viewModel: BrowserConfigDialog,
      model: {
        config: {
          autoRefresh: this.autoRefresh,
        },
        insideIframe: this.insideIframe
      }
    }).whenClosed(response => {
      if (response.wasCancelled) return;
      const {output} = response;
      this.autoRefresh = output.autoRefresh;
    })
  }

  keyDownInInput(e) {
    if (e.code === 'Enter') { // return key
      this.ea.publish('history-reload');
    }

    return true;
  }
}
