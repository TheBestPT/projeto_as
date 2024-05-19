const { PATHS, ask, reserveDirSmb } = require("../globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

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
    read only = no
    browsable = yes`;
  } else {
    let stringReplace = `[${
      pathEdit.startsWith("/") ? pathEdit.substring(1) : pathEdit
    }]
    comment = SMB share /${pathEdit}
    path = ${!pathEdit.startsWith("/") ? "/" + pathEdit : pathEdit}
    read only = no
    browsable = yes`;

    smbConfig = smbConfig.replace(
      stringReplace,
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

  if (isNaN(parseInt(option) || !filteredZones[parseInt(option)]) 
  ) {
    console.log("Invalid option type again!");
    rl.close();
    await main();
    return;
  }

  await createShare(
    rl,
    smbConf[parseInt(option)].substring(1, smbConf[parseInt(option)].length - 1)
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

  if (isNaN(parseInt(option)) || !filteredZones[parseInt(option)]) {
    console.log("Invalid option type again!");
    rl.close();
    await main();
    return;
  }

  rl.close();

  let smbConfig;
  try {
    smbConfig = fs.readFileSync(PATHS.smbConf, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.smbConf);
  }

  let smbShare = smbConf[option];

  let idx;
  let target = smbConfig.split("\n").filter((s, i) => {
    if (s.includes(smbShare)) {
      idx = i;
    }
    return s.includes(smbShare);
  });

  if (!idx) {
    console.log("Share not found");
    rl.close();
    await main();
    return;
  }

  let share = [smbConfig.split("\n")[idx]];
  share.push(smbConfig.split("\n")[idx + 1]);
  share.push(smbConfig.split("\n")[idx + 2]);
  share.push(smbConfig.split("\n")[idx + 3]);
  share.push(smbConfig.split("\n")[idx + 4]);

  smbConfig = smbConfig.replace(
    share.reduce((a, b) => a + "\n" + b),
    ``
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

    case "3":
      await deleteShare(rl);
      break;

    case "4":
      await disableShare(rl);
      break;

    default:
      rl.close();
      console.clear();
      console.log("SMB (Samba)");
      await main();
      break;
  }
}

//console.log("SMB Program");
//main();

module.exports = { main };
