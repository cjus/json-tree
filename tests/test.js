// debug helper

var data = jt.load('tests/test.json');
var gear = jt.load('tests/gear.json');
jt.setTree(data);
jt.appendBranch('user:34', gear);
jt.moveBranch('user:34/computers', 'user:34/gear');
jt.prettyPrint(jt.getTree());
