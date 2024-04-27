const {
  ask,
  ipRegex,
  domainRegex,
  PATHS,
  reverseZoneRegex,
} = require("./globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function deleteMasterZone() {
  let files;
  try {
    files = fs.readdirSync(PATHS.hostsDir);
  } catch (e) {
    throw new Error("Cannot read directory: ", PATHS.hostsDir);
  }

  const pattern = /\.hosts$/;
  const reversePattern = /\.in-addr\.arpa\.hosts$/;
  const nonReversePattern = /(?<!\.in-addr\.arpa)\.hosts$/;
  const filteredZones = files.filter(
    (file) =>
      pattern.test(file) &&
      nonReversePattern.test(file) &&
      !reversePattern.test(file) &&
      !file.includes("named") &&
      file.includes("hosts")
  );
  let c = 0;
  if (filteredZones.length === 0) {
    console.log("No master zones to delete.");
    await main();
    return;
  }
  filteredZones.forEach((file) => {
    console.log(`[${c++}] ${file}`);
  });
  let option = await ask(
    rl,
    "Type the number of what record delete: ",
    "No option was typed"
  );
  rl.close();
  let fileChoose = filteredZones[parseInt(option)];
  try {
    fs.unlinkSync("/var/named/" + fileChoose);
  } catch (e) {
    throw new Error("Cannot delete file: ", fileChoose);
  }

  let namedConf;
  try {
    namedConf = fs.readFileSync(PATHS.zones, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.zones);
  }
  let domainName = fileChoose.replace(".hosts", "");
  let searchValue = `zone "${domainName}" IN {
    type master;
    file "${PATHS.hosts(domainName)}";
  };`;

  namedConf = namedConf.replace(searchValue, "");

  try {
    fs.writeFileSync(PATHS.zones, namedConf);
  } catch (e) {
    throw new Error("Cannot write file: " + PATHS.zones);
  }

  exec(`systemctl restart named`);

  console.log(`Master zone ${domainName} was deleted with success.`);
}

async function deleteVirtualHost() {}

async function deleteReverseZone() {
  let files;
  try {
    files = fs.readdirSync(PATHS.hostsDir);
  } catch (e) {
    throw new Error("Cannot read directory: ", PATHS.hostsDir);
  }

  const pattern = /\.hosts$/;
  const reversePattern = /\.in-addr\.arpa\.hosts$/;
  const nonReversePattern = /(?<!\.in-addr\.arpa)\.hosts$/;
  const filteredZones = files.filter(
    (file) =>
      pattern.test(file) &&
      !nonReversePattern.test(file) &&
      reversePattern.test(file) &&
      !file.includes("named") &&
      file.includes("hosts")
  );
  let c = 0;
  if (filteredZones.length === 0) {
    console.log("No master zones to delete.");
    await main();
    return;
  }
  filteredZones.forEach((file) => {
    console.log(`[${c++}] ${file}`);
  });
  let option = await ask(
    rl,
    "Type the number of what record delete: ",
    "No option was typed"
  );
  rl.close();
  console.log(option);
  let fileChoose = filteredZones[parseInt(option)];
  try {
    fs.unlinkSync("/var/named/" + fileChoose);
  } catch (e) {
    throw new Error("Cannot delete file: ", fileChoose);
  }

  let namedConf;
  try {
    namedConf = fs.readFileSync(PATHS.zones, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.zones);
  }
  let domainName = fileChoose.replace(".hosts", "");
  let searchValue = `zone "${domainName}" IN {
    type master;
    file "${PATHS.hosts(domainName)}";
    };`;

  namedConf = namedConf.replace(searchValue, "");

  try {
    fs.writeFileSync(PATHS.zones, namedConf);
  } catch (e) {
    throw new Error("Cannot write file: " + PATHS.zones);
  }

  exec(`systemctl restart named`);

  console.log(`Reverse zone ${domainName} was deleted with success.`);
}

async function main() {
  let deleteWhat = await ask(
    rl,
    "Select what you wanna delete:\n[1] Master zone\n[2] Virtual Host\n[3] Reverse zone\nType: ",
    "No option was typed."
  );
  //rl.close();
  switch (deleteWhat) {
    case "1":
      await deleteMasterZone();
      break;
    case "2":
      await deleteVirtualHost();
      break;
    case "3":
      await deleteReverseZone();
      break;
    default:
      console.log("No option was typed.");
      process.exit(0);
      break;
  }
}

main();
