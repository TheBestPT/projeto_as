const {
  domainRegex,
  PATHS,
  ask,
  defaultHost,
  getLocalIp,
  reserveDirSmb,
} = require("../globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

async function createShare(rl, pathEdit = null) {
  let path = await ask(
    rl,
    "Insert a path to the directory that you want share: ",
    "No path was typed in"
  );
  rl.close();
  try {
    fs.readdirSync(path);
  } catch (e) {
    throw new Error("Cannot read directory: ", path);
  }

  //I disabled choosing if a directory was readonly because of delete and edit
  // let readOnly = await ask(rl, "Is it read only? [y/n]: ", "No y/n was typed");
  // let readOnlyOpt = "no";
  // if (readOnly === "y") {
  //   readOnlyOpt = "yes";
  // }

  // let browsable = await ask(rl, "Is it browsable? [y/n]: ", "No y/n was typed");
  // rl.close();
  // let browsableOpt = "no";
  // if (browsable === "y") {
  //   browsableOpt = "yes";
  // }

  let smbConfig;
  try {
    smbConfig = fs.readFileSync(PATHS.smbConf, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.smbConf);
  }
  if (!pathEdit) {
    smbConfig += `\n[${path.startsWith("/") ? path.substring(1) : path}]
      comment = SMB share ${path}
      path = ${!path.startsWith("/") ? "/" + path : path}
      read only = yes
      browsable = yes`;
  } else {
    console.log(
      `\n[${
        pathEdit.startsWith("/") ? pathEdit.substring(1) : pathEdit
      }]\n  comment = SMB share /${pathEdit}\n  path = ${
        !pathEdit.startsWith("/") ? "/" + pathEdit : pathEdit
      }\n  read only = no\n  browsable = yes`
    );
    smbConfig = smbConfig.replace(
      `\n[${
        pathEdit.startsWith("/") ? pathEdit.substring(1) : pathEdit
      }]\n  comment = SMB share /${pathEdit}\n  path = ${
        !pathEdit.startsWith("/") ? "/" + pathEdit : pathEdit
      }\n  read only = no\n  browsable = yes`,
      `\n[${
        path.startsWith("/") ? path.substring(1) : path
      }]\n  comment = SMB share ${path}\n  path = ${
        !path.startsWith("/") ? "/" + path : path
      }\n  read only = no\n  browsable = yes`
    );
  }

  try {
    fs.writeFileSync(PATHS.smbConf, smbConfig);
  } catch (e) {
    throw new Error("Cannot write file: ", PATHS.smbConf);
  }

  exec(`systemctl restart smb`);

  console.log("SMB share done successfully");
  console.log(`Smb conf: ${PATHS.smbConf}`);
}

async function editShare(rl) {
  let smbConf;
  try {
    smbConf = fs.readFileSync(PATHS.smbConf, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.smbConf);
  }

  smbConf = smbConf.match(/\[([^\[\]]+)\]/g);
  smbConf = smbConf.filter((l) => !reserveDirSmb.includes(l));
  let c = 0;
  smbConf.forEach((element) => {
    console.log("[" + c++ + "] " + element.substring(1, element.length - 1));
  });

  let option = await ask(rl, "Choose one to edit: ", "No option was typed.");
  await createShare(
    rl, smbConf[parseInt(option)].substring(1, smbConf[parseInt(option)].length - 1)
  );
}

async function deleteShare(rl) {
  let smbConf;
  try {
    smbConf = fs.readFileSync(PATHS.smbConf, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.smbConf);
  }

  smbConf = smbConf.match(/\[([^\[\]]+)\]/g);
  smbConf = smbConf.filter((l) => !reserveDirSmb.includes(l));
  let c = 0;
  smbConf.forEach((element) => {
    console.log("[" + c++ + "] " + element.substring(1, element.length - 1));
  });

  let option = await ask(rl, "Choose one to delete: ", "No option was typed.");
  rl.close();

  let smbConfig;
  try {
    fs.readFileSync(PATHS.smbConf, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.smbConf);
  }

  smbConfig = smbConfig.replace(
    `\n[${
      pathEdit.startsWith("/") ? pathEdit.substring(1) : pathEdit
    }]\n  comment = SMB share /${pathEdit}\n  path = ${
      !pathEdit.startsWith("/") ? "/" + pathEdit : pathEdit
    }\n  read only = no\n  browsable = yes`,
    ""
  );

  try {
    fs.writeFileSync(PATHS.smbConf, smbConfig);
  } catch (e) {
    throw new Error("Cannot write file: ", PATHS.smbConf);
  }

  exec(`systemctl restart smb`);

  console.log("SMB share delete with successfully");
  console.log(`Smb conf: ${PATHS.smbConf}`);
}

async function disableShare(rl) {
  let confirm = await ask(
    rl,
    "Are you sure do disable shares? [y/n]: ",
    "No confirm was typed."
  );
  rl.close();
  if (confirm === "y") {
    exec(`systemctl stop smb`);
    console.log("SMB share was disabled");
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
  let option = await ask(
    rl,
    "[1] Create a share\n[2] Edit a share\n[3] Delete a share\n[4] Disable shares\nType an option: ",
    "No option was selected!"
  );
  switch (option) {
    case "1":
      await createShare(rl);
      break;
    case "2":
      await editShare(rl);
      break;
    case "4":
      await disableShare(rl);
      break;
    default:
      await main();
      break;
  }
}

//console.log("SMB Program");
//main();

module.exports = { main };
