'use strict';

const repl = require('repl');
const jt = require('./json-tree');

// open the repl session
var replServer = repl.start({
  prompt: `\n➤ `,
  ignoreUndefined: true
});

// replServer.defineCommand('say', {
//   help: 'Say Message',
//   action: function(name) {
//     this.outputStream.write(`${name}!\n`);
//     this.displayPrompt();
//   }
// });

replServer.context.jt = jt;
