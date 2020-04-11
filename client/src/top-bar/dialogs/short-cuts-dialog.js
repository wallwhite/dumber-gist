import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogController} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';

@inject(DialogController, EventAggregator)
export class ShortCutsDialog {
  shortcuts = [
    {
      action: 'Find and open a file',
      event: 'open-any',
      notes: "Ctrl-P and Cmd-P may not work when the focus is in embedded app, or blocked by your system's default.",
      keys: ['Alt-P', '⌥ P', 'Ctrl-P', '⌃ P', 'Cmd-P', '⌘ P']
    },
    {
      action: 'Manually reload the embedded browser',
      event: 'bundle-or-reload',
      keys: ['Alt-R', '⌥ R']
    },
    {
      action: 'Create a new file',
      event: 'create-file',
      keys: ['Alt-N', '⌥ N']
    },
    {
      action: 'Close the active editing file',
      event: 'close-active-file',
      keys: ['Alt-W', '⌥ W']
    }
  ];

  constructor(controller, ea) {
    this.controller = controller;
    this.ea = ea;
  }

  async evoke(action) {
    await this.controller.cancel();
    this.ea.publish(action);
  }
}
