'use strict';

const repl = require('repl');
const jt = require('./index');

// open the repl session
var replServer = repl.start({
  prompt: `\n➤ `,
  ignoreUndefined: true
});

replServer.context.jt = jt;
