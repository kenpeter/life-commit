// Color terminal
const chalk = require('chalk');
// Pie promise
const execa = require('execa');
// File system
const fs = require('fs');
// Ask and answer
const inquirer = require('inquirer');

// Path
const path = require('path');
// Path there
const pathExists = require('path-exists');
// Unique id
const uuid = require('uuid/v4');
// Text pop up
const prompts = require('./prompts');

// Date picker popup
inquirer.registerPrompt('datetime', require('inquirer-datepicker-prompt'));

// Class
class lifeCli {

  // init, pass ext var to in var
  constructor(lifeApiClient) {
    this._lifeApiClient = lifeApiClient;
  }

  // life starts
  init() {
    // No life file
    if (this._getCommitsPath().exist === false) {
      // Ceate one
      this._createFile(this._getCommitsPath().path, []);
      // Chalk out
      console.log(
        `${chalk.cyan('Your life has been initialized successfully!')}`
      );
      return;
    } else {
      // Error
      return this._errorMessage(
        'Your life had been initialized. Start commit now!'
      );
    }
  }

  // Commit means write to file
  commit() {
    // Out side
    let patch = {};

    if (this._getCommitsPath().exist === false) {
      return this._errorMessage('Please initialize your life first.');
    }

    // Get what you type
    // Push to arr ----------> uuid is the commit id
    // Write to file
    // Log
    // catch
    return this._commitPrompt()
      .then(answers => {
        patch = {
          lifemoji: `${answers.lifemoji}`,
          title: `${answers.title}`,
          message: `${answers.message}`,
          date: answers.date,
          id: uuid(),
        };
        return this._fetchCommits();
      })
      .then(commits => {
        commits.push(patch);
        this._createFile(this._getCommitsPath().path, commits);
      })
      .then(() => {
        console.log(`${chalk.green('1 commit added')}`);
      })
      .catch(error => {
        return this._errorMessage(error);
      });
  }

  // 
  log() {
    // Typical
    if (this._getCommitsPath().exist === false) {
      return this._errorMessage('Please initialize your life first.');
    }

    // Get commits from file
    // Sort commit by date, desc
    // console log
    // catch
    return this._fetchCommits()
      .then(commits => {
        commits.sort((c1, c2) => {
          if (new Date(c1.date).getTime() < new Date(c2.date).getTime())
            return 1;
          else return -1;
        });
        commits.forEach(commit => {
          const date = new Date(commit.date).toString('yyyy/M/d');
          console.log(
            `* ${chalk.red(commit.id.slice(0, 6))} - ${
              commit.lifemoji
            }  ${chalk.blue(commit.title)} ${chalk.green(date)}`
          );
        });
      })
      .catch(error => {
        return this._errorMessage(error);
      });
  }

  // 
  edit() {
    // Typical
    if (this._getCommitsPath().exist === false) {
      return this._errorMessage('Please initialize your life first.');
    }

    // Guard
    if (process.argv.length < 4)
      return this._errorMessage('Please specify the commit id.');

    // commit id
    let id = process.argv[3];

    let commits = [],
      index;

    return this._fetchCommits()
      .then(data => {
        commits = data;
        // Find commit id
        index = commits.findIndex(patch => patch.id.indexOf(id) !== -1);
        if (index === -1) {
          return this._errorMessage('Commit id does not exist.');
        } else {
          // Found it
          const date = new Date(commits[index].date).toString('yyyy/M/d');
          // commits[index]
          console.log(
            `* ${chalk.red(commits[index].id.slice(0, 6))} - ${
              commits[index].lifemoji
            }  ${chalk.blue(commits[index].title)} ${chalk.green(date)}`
          );

          // Prompt you to do
          return inquirer.prompt(prompts.edit.choose()).then(answers => {
            // Because commits is array from file, so can do remove, insert
            if (answers.choose === 'Remove') {
              commits.splice(index, 1);
              console.log(`${chalk.red('1 commit removed')}`);
              return;
            } else {
              // Edit means means remove and add
              // With object.assign
              return this._commitPrompt().then(answers => {
                let patch = {
                  lifemoji: `${answers.lifemoji}`,
                  title: `${answers.title}`,
                  message: `${answers.message}`,
                  date: answers.date,
                };
                Object.assign(commits[index], patch);
                console.log(`${chalk.blue('1 commit edited')}`);
              });
            }
          });
        }
      })
      .then(() => {
        this._createFile(this._getCommitsPath().path, commits);
      })
      .catch(error => {
        return this._errorMessage(error);
      });
  }

  // 
  dir() {
    // Life first, then dir
    if (this._getCommitsPath().exist === false) {
      return this._errorMessage('Please initialize your life first.');
    }

    const folder = process.argv[3] || 'website';

    const cmd = `cp -r ${__dirname}/website ${folder}`;

    // cp website dir to my dir
    execa
      .shell(cmd)
      .catch(err => this._errorMessage(err.stderr ? err.stderr : err.stdout));

    console.log(
      `${chalk.green('Successfully create folder at:')} ${chalk.green(
        process.cwd() + '/' + folder
      )}\n`
    );
    console.log(
      `${chalk.cyan(`Run the following commands to visualize your commits!`)}`
    );
    console.log(`$ npm install`);
    console.log(`$ npm run start`);
  }


  // Get emoji, then pop  
  _commitPrompt() {
    // Get emoji from json,
    // pass emoji to prompt.commit, then pop ----> return another promise from inquirer.prompt
    // catch
    return this._fetchLifemojis()
      .then(lifemojis => inquirer.prompt(prompts.commit(lifemojis)))
      .catch(err => this._errorMessage(err.code));
  }

  // Error
  _errorMessage(message) {
    console.error(chalk.red(`ERROR: ${message}`));
  }

  // Parse emoji data
  _parseLifemojis(lifemojis) {
    return lifemojis.map(lifemoji => {
      return console.log(
        `${lifemoji.emoji} - ${chalk.blue(lifemoji.code)} - ${
          lifemoji.description
        }`
      );
    });
  }

  // Get commit
  _fetchCommits() {
    return Promise.resolve(
      JSON.parse(fs.readFileSync(this._getCommitsPath().path))
    );
  }

  // 
  _getCommitsPath() {
    // Home path or user profile
    const home = process.env.HOME || process.env.USERPROFILE;
    // /var/home/.life-commit/commit.json
    const commitPath = path.join(home, '.life-commit', 'commits.json');
    // Return json path
    return { path: commitPath, exist: pathExists.sync(commitPath) };
  }

  // .life-commit with emoji
  _getCachePath() {
    const home = process.env.HOME || process.env.USERPROFILE;
    const cachePath = path.join(home, '.life-commit', 'lifemojis.json');
    return { path: cachePath, exist: pathExists.sync(cachePath) };
  }

  // Write to file with data
  _createFile(filePath, data) {
    const fileDir = path.dirname(filePath);

    if (data !== undefined) {
      if (!pathExists.sync(fileDir)) {
        fs.mkdirSync(fileDir);
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, ' '));
    }
  }

  // Fetch remote emoji from own data, so http server
  _fetchRemoteLifemojis() {
    return this._lifeApiClient
      .request({
        method: 'GET',
        url: '/src/data/lifemojis.json',
      })
      .then(res => {
        console.log(`${chalk.yellow('Lifemojis')} updated successfully!`);
        return res.data;
      })
      .catch(error =>
        this._errorMessage(`Network connection not found - ${error.code}`)
      );
  }

  // Fetch cached emoji
  _fetchCachedLifemojis(cachePath) {
    return Promise.resolve(JSON.parse(fs.readFileSync(cachePath)));
  }

  // Fetch emoji either cached or remote
  _fetchLifemojis() {
    const res = this._getCachePath();
    if (res.exist === true) {
      return this._fetchCachedLifemojis(res.path);
    }
    return this._fetchRemoteLifemojis().then(Lifemojis => {
      this._createFile(res.path, Lifemojis);
      return Lifemojis;
    });
  }
}

module.exports = lifeCli;
