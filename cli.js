#!/usr/bin/env node

const rimraf = require("rimraf");
const FormData = require('form-data');
const fs = require('fs');
const program = require("commander");
const inquirer = require('inquirer');
const got = require('got');
const { zip } = require('zip-a-folder');
const package = require("./package.json");
const concat = require("concat-stream")
const cliProgress = require('cli-progress');
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const baseURL = "http://devospa.com"

program
  .version(package.version, "-v, --version");

program
  .command("push")
  .arguments('<token>')
  .arguments('<buildFolder>')
  .description('push command', {
    token: 'user token',
    buildFolder: 'build folder'
  })
  .action((token, buildFolder, options, command) => {
    console.log(buildFolder + " folder will be zipped and uploaded to devospa.com")
    const url = baseURL+"/devospaApi/checkProjectToken"
    return got.post(url, { json: { token } }).then(async() => {
      return inquirer.prompt([
        { 
          name: "branch name", 
          description: "Enter the feature(branch) name:"
        }
      ])
      .then(async ({'branch name': branchName}) => {
        console.log("Branch Name : ", branchName)
        progressBar.start(100, 1);
        const zipPath = "./" + branchName + token + '.zip'
        await zip(buildFolder, zipPath);
        new Promise((resolve) => {
          const fd = new FormData();
          fd.append("token", token);
          fd.append("branchName", branchName);
          fd.append("file", fs.createReadStream(zipPath));
          fd.pipe(concat({ encoding: 'buffer' }, data => resolve({ data, headers: fd.getHeaders() })));
        }).then(({ data, headers }) => {
          return got.post(baseURL+"/devospaApi/upload", { body: data, headers})
          .on('uploadProgress', progress => {
            progressBar.update(Math.round(progress.percent * 100));
          })
          .then((uploadResponse) => {
            progressBar.update(100)
            progressBar.stop(100)
            console.log("Upload completed, Please check devospa.com")
          }).catch(e => {
            progressBar.stop(0)
            console.error("Sorry but uploading the zip file errored, Please try again in a few second")
            process.exit()
          })
        }).catch(err=> {
          progressBar.stop(0)
          console.error("Errored buffering", err)
          process.exit()
        }).finally(() => {
          progressBar.stop(100)
          
          rimraf(zipPath, (e) => {
            e && console.log(e)
            console.log("removed created zip file")
            process.exit()
          })
        })
      })
      .catch((error) => {
        console.error(error)
        if (error.isTtyError) {
          // Prompt couldn't be rendered in the current environment
        } else {
          // Something else went wrong
        }
      });
    }).catch(e => {
      console.log(e)
      console.error("the project token is wrong, please copy the command from devospa.com")
    })
  })
  
// console.log(process.argv)
program.parseAsync(process.argv);
