#!/usr/bin/env node

const isDev = true

const rimraf = require("rimraf");
var FormData = require('form-data');
var fs = require('fs');
var program = require("commander");
var inquirer = require('inquirer');
var axios = require('axios');
var { zip } = require('zip-a-folder');
var package = require("./package.json");
const concat = require("concat-stream")
const cliProgress = require('cli-progress');
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

program
  .version(package.version, "-v, --version");

program
  .command("push")
  .arguments('<token>')
  .description('push command', {
    token: 'user token'
  })
  .option("-d, --directory", "Build Folder")
  .action((token, options, command) => {

    let { directory = "build" } = options
    const api = axios.create({
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      baseURL: isDev ? "http://localhost:3020" : "https://devospa.com",
    })
    return api.post("/devospaApi/checkProjectToken", { token }).then(async() => {
      console.log("token success", token)
      return inquirer.prompt([
        { 
          name: "branch name", 
          description: "Enter the feature(branch) name:"
        }
      ])
      .then(async ({'branch name': branchName}) => {
        console.log("Branch Name : ", branchName)
        progressBar.start(100, 1);
        const zipPath = branchName + token + '.zip'
        await zip('build', zipPath);
        progressBar.update(10);
        
        new Promise((resolve) => {
          const fd = new FormData();
          fd.append("token", token);
          fd.append("branchName", branchName);
          fd.append("file", fs.createReadStream(zipPath));
          fd.pipe(concat({ encoding: 'buffer' }, data => resolve({ data, headers: fd.getHeaders() })));
        }).then(({ data, headers }) => {
          api.post("/api/upload", data, {
            headers,
            onUploadProgress: progressEvent => console.log(progressEvent.loaded)
          }).then((uploadResponse) => {
            progressBar.update(100)
            progressBar.stop(100)
            console.log("Upload completed, Please check the following address", "https://devospa.com")
          }).catch(e => {
            console.error("Upload Error", e)
          })
        }).catch(err=> {
          console.error("Errored buffering", err)
        }).finally(() => {
          rimraf(zipPath, (e) => {
            e && console.log(e)
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
    })
  })
  
console.log(process.argv)
program.parseAsync(process.argv);
