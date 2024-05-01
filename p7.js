const { ask, ipRegex, domainRegex, PATHS } = require("./globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");



async function createShare(rl, update = null) {
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
  if(!ipRegex.test(ip) || ip[ip.length - 1] !== '0') {
    throw new Error('Invalid ip was typed.')
  }
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

  if (update) {
    nfsExport = nfsExport.replace(
      update,
      `\n${path.startsWith("/") ? path : "/" + path} ${ip}/24(rw,hide,sync)\n`
    );
  } else {
    nfsExport += `\n${
      path.startsWith("/") ? path : "/" + path
    } ${ip}/24(rw,hide,sync)\n`;
  }

  try {
    fs.writeFileSync(PATHS.nfsExport, nfsExport);
  } catch (e) {
    throw new Error("Cannot write file: ", PATHS.nfsExport);
  }

  exec(`systemctl restart nfs`);

  if (update) {
    console.log("Nfs share updated with success.");
  } else {
    console.log("Nfs share created with success.");
  }
}

async function disableShare(rl) {
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

async function updateShare(rl) {
  let nfsExport;
  try {
    nfsExport = fs.readFileSync(PATHS.nfsExport, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.nfsExport);
  }
  let options = nfsExport.split("\n");
  options = options.filter((o) => o !== '')
  let optionDisplay = "";
  for (let i = 0; i < options.length; i++) {
    if (options[i] !== "") {
      optionDisplay += "[" + i + "] " + options[i] + "\n";
    }
  }
  let updateOption = await ask(
    rl,
    optionDisplay + "Choose witch one you want to update: ",
    "No option was typed"
  );
  //rl.close();
  await createShare(rl, options[parseInt(updateOption)])
}

async function deleteShare(rl) {
  let nfsExport;
  try {
    nfsExport = fs.readFileSync(PATHS.nfsExport, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.nfsExport);
  }
  let options = nfsExport.split("\n");
  options = options.filter((o) => o !== '')
  let optionDisplay = "";
  for (let i = 0; i < options.length; i++) {
    if (options[i] !== "") {
      optionDisplay += "[" + i + "] " + options[i] + "\n";
    }
  }
  let deleteOption = await ask(
    rl,
    optionDisplay + "Choose witch one you want to delete: ",
    "No option was typed"
  );
  if (parseInt(deleteOption) < 0 || parseInt(deleteOption) > options.length) {
    throw new Error("No valid option was typed.");
  }
  let confirm = await ask(
    rl,
    "Are you sure to disable share?[y/n] ",
    "No option was typed"
  );
  rl.close();
  if (confirm == "y" || confirm == "Y") {
    nfsExport = nfsExport.replace(options[parseInt(deleteOption)], "");

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
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log("NFS PROGRAM");
  let witchMenu = await ask(
    rl,
    "[1] - Create nfs share\n[2] - Edit nfs share\n[3] - Delete nfs share\n[4] - Disable nfs share\nType an option: ",
    "No option was typed"
  );
  switch (witchMenu) {
    case "1":
      await createShare(rl);
      break;
    case "2":
      await updateShare(rl);
      break;
    case "3":
      await deleteShare(rl);
      break;
    case "4":
      await disableShare(rl);
      break;

    default:
      await main();
      break;
  }
}

// main();


module.exports = { main }
