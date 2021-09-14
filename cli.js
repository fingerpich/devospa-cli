#!/usr/bin/env node

const rimraf = require("rimraf")
const FormData = require("form-data")
const fs = require("fs")
const path = require("path")
const poss = require("poss")
const program = require("commander")
const inquirer = require("inquirer")
const got = require("got")
const { zip } = require("zip-a-folder")
const package = require("./package.json")
const concat = require("concat-stream")
const cliProgress = require("cli-progress")
const { execSync } = require('child_process');
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

const baseURL = "http://devospa.com"

program
  .version(package.version, "-v, --version")

program
  .command("push")
  .arguments("<token>")
  .arguments("<buildFolder>")
  .description("push command", {
    token: "user token",
    buildFolder: "build folder"
  })
  .action(async (token, buildFolder, options, command) => {
    console.log(`${buildFolder} folder will be zipped and uploaded to devospa.com`)
    
    // login and stores userToken to prevent next logins
    const appDir = path.dirname(require.main.filename);
    const storedDataPath = path.join(appDir, "/stores.json")
    let userToken = ""
    try {
      const data = require(storedDataPath)
      userToken = data.userToken
    } catch(e) {}
    if (!userToken) {
      const getUsername = { name: "email", message:"Email", description: "Enter your email address to login"}
      const getPassword = { name: "password", message: "Password",  description: "Enter the password you would login to devospa"}
      const [blErr, loginData] = await poss(inquirer.prompt([getUsername, getPassword]))
      if (blErr) { return console.log("problem in getting user data") }
      const loginUserUrl = `${baseURL}/devospaApi/loginUser`
      const {email, password} = loginData
      const [err, res] = await poss(got.post(loginUserUrl, { json: { email, password } }).json())
      if (err) { return console.log("Email or password is wrong, please use the email you registered with in devospa.com") }
      userToken = res.userToken
      // stores userToken
      fs.writeFile(storedDataPath, JSON.stringify({userToken}), (err) => {})
      if (!userToken) {return console.log("userToken not exist")}
    }
    
    // gets the current branch name
    const commandOutput = execSync('git rev-parse --abbrev-ref HEAD')
    const defaultBranchName = commandOutput.toString().trim()

    // Checks the project token
    const url = `${baseURL}/devospaApi/checkProjectToken`
    const [err, res] = await poss(got.post(url, { json: { token } }))
    if (err) { return console.error("The project token is wrong, please copy the command from devospa.com", err)}

    // Gets branch name, demo description
    const getBranch = { name: "branchName", message:"Branch Name", description: "Enter the feature(branch) name:", default: defaultBranchName}
    const getDesc = { name: "description", message: "Version Description",  description: "Enter a brief description about this demo"}
    const [bErr, branchRes] = await poss(inquirer.prompt([getBranch, getDesc]))
    if (bErr) { return console.error("Getting branch name encountred with error")}
    const {branchName, description} = branchRes

    // Compresses the build folder
    const zipFileName = "./" + branchName + token + ".zip"
    await zip(buildFolder, zipFileName)

    // Creates a FormData and merge the zip file into it
    const fd = new FormData()
    fd.append("token", token)
    fd.append("branchName", branchName)
    fd.append("description", description)
    fd.append("userToken", userToken)
    fd.append("file", fs.createReadStream(zipFileName))
    fd.pipe(concat({ encoding: "buffer" }, data => {
      if (!data) {
        console.error("Errored buffering", err)
        process.exit()
      }
      const uploadUrl = baseURL+"/devospaApi/upload"
      progressBar.start(100, 1)
      // Starts uploading whole data
      got.post(uploadUrl, { body: data, headers: fd.getHeaders()})
        .on("uploadProgress", progress => {
          progressBar.update(Math.round(progress.percent * 100))
        })
        .then((uploadResponse) => {
          progressBar.stop(100)
          console.log("Upload completed, Please check devospa.com")
        }).catch(e => {
          progressBar.stop()
          console.error("Sorry but uploading the zip file errored, Please try again in a few second")
          process.exit()
        }).finally(() => {
          // Removes the zip file
          rimraf(zipFileName, (e) => {
            e && console.log(e)
            console.log("Removed created zip file")
            process.exit()
          })
        })
    }))
  })
  
program.parseAsync(process.argv)
