const { ask, ipRegex, domainRegex, PATHS } = require("./globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function createShare() {
  let path = await ask(
    rl,
    "Insert the path to the directory to be shared: ",
    "No directory was typed"
  );
  let ip = await ask(
    rl,
    "Insert an ip for the nfs share (ex: 192.168.1.0): ",
    "No ip was typed"
  );
  rl.close();
  try {
    fs.readdirSync(path);
  } catch (e) {
    throw new Error("No valid directory was typed");
  }

  let nfsExport;
  try {
    nfsExport = fs.readFileSync(PATHS.nfsExport, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.nfsExport);
  }

  nfsExport += `${path} ${ip}/24(rw,hide,sync)`;

  try {
    fs.writeFileSync(PATHS.nfsExport, nfsExport);
  } catch (e) {
    throw new Error("Cannot write file: ", PATHS.nfsExport);
  }

  exec(`systemctl restart nfs`);

  console.log("Nfs share created.");
}

async function disableShare() {
  let confirm = await ask(
    rl,
    "Are you sure to disable share?[y/n] ",
    "No option was typed"
  );
  rl.close();
  if (confirm == "y" || confirm == "Y") {
    exec(`systemctl stop nfs`);
    console.log("Share was disabled with success.");
  } else {
    console.log("Program ended");
    process.exit(0);
  }
}

async function deleteShare() {
  let nfsExport;
  try {
    nfsExport = fs.readFileSync(PATHS.nfsExport, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.nfsExport);
  }
  let options = nfsExport.split('\n')
  let optionDisplay = ''
  for(let i = 0; i < options.length; i++) {
    optionDisplay += '[' + i + '] ' +options[i]
  }
  let deleteOption = await ask(rl, optionDisplay + '\nChoose witch one you want to delete: ', "No option was typed");
  if(parseInt(deleteOption) < 0 || parseInt(deleteOption) > options.length) {
    throw new Error('No valid option was typed.')
  }
  let confirm = await ask(
    rl,
    "Are you sure to disable share?[y/n] ",
    "No option was typed"
  );
  rl.close();
  if (confirm == "y" || confirm == "Y") {
    nfsExport = nfsExport.replace(options[parseInt(deleteOption)], '');

    try {
      fs.writeFileSync(PATHS.nfsExport, nfsExport);
    } catch (e) {
      throw new Error("Cannot write file: ", PATHS.nfsExport);
    }

    exec(`systemctl restart nfs`);

    console.log("The share was deleted with success.");
  } else {
    console.log("Program ended");
    process.exit(0);
  }
}

async function main() {
  console.log("NFS PROGRAM");
  let witchMenu = await ask(
    rl,
    "[1] - Create nfs share\n[2] - Edit nfs share\n[3] - Delete nfs share\n[4] - Disable nfs share\nType an option: ",
    "No option was typed"
  );
  switch (witchMenu) {
    case "1":
      await createShare();
      break;
    case "2":
      break;
    case "3":
      await deleteShare();
      break;
    case "4":
      await disableShare();
      break;

    default:
      await main();
      break;
  }
}

main();
