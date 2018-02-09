#!/usr/bin/env node

// arg helper
const meow = require('meow');
// notifier
const updateNotifier = require('update-notifier');
// actual cli
const LifeCli = require('./src/lifeCli.js');
// installed software
const pkg = require('./package.json');
// util
const utils = require('./src/utils.js');

// Package update, notify
updateNotifier({ pkg }).notify();

// init, commit, log msg for commit
// edit commit
// dir
const cli = meow(
  `
  Usage
    $ life
  Options
    --init, -i                 Initialize your life
    --commit, -c               Commit on your life
    --log, -l                  Log the commits on your life 
    --edit , -e <commitId>     Edit the existing commits 
    --dir, -d [folder name]    Create a directory that visualizing the commits on webpage      
  Examples
    $ life --commit
`,
  {
    flags: {
      init: { type: 'boolean', alias: 'i' },
      commit: { type: 'boolean', alias: 'c' },
      log: { type: 'boolean', alias: 'l' },
      edit: { type: 'boolean', alias: 'e' },
      dir: { type: 'boolean', alias: 'd' },
    },
  }
);

// Class
const lifeCli = new LifeCli(utils.lifeApiClient);

// init, commit, log, edit, dir
// cli meow
// pass in
const options = {
  init: () => lifeCli.init(),
  commit: () => lifeCli.commit(),
  log: () => lifeCli.log(),
  edit: () => lifeCli.edit(),
  dir: () => lifeCli.dir(),
};

// 
utils.findLifeCommand(cli, options);
