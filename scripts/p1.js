const {
  domainRegex,
  PATHS,
  ask,
  askUpdate,
  defaultHost,
  getLocalIp,
} = require("../globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");
const { deleteMasterZone } = require("./p6");

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

async function createDNS(rl) {
  let name = await ask(rl, "Insert a domain name: ", "No name was typed.");

  if (!domainRegex.test(name)) {
    console.log("Invalid domain name type again!");
    await main();
    return;
  }

  let named;
  try {
    named = fs.readFileSync(PATHS.zones, "utf8");
  } catch (e) {
    throw new Error("Couldn't read file: " + PATHS.zones);
  }

  while (named.includes(`"${name}"`)) {
    let stop = await ask(
      rl,
      "The domain already exists you to type again? [y/n] ",
      "No answer was typed."
    );

    if (stop === "n") {
      console.log("Program ended.");
      process.exit(0);
    }
    name = await ask(rl, "Insert a domain name: ", "No name was typed.");
  }

  rl.close();

  named += `\nzone "${name}" IN {
    type master;
    file "${PATHS.hosts(name)}";
  };`;

  try {
    fs.writeFileSync(PATHS.zones, named);
  } catch (e) {
    throw new Error("Couldn't write file: " + PATHS.zones);
  }

  let hostContent =
    defaultHost + `\n  IN  A  ${getLocalIp()}\nwww  IN  A  ${getLocalIp()}`;
  try {
    fs.writeFileSync(PATHS.hosts(name), hostContent);
  } catch (e) {
    throw new Error("Couldn't write file: " + PATHS.hosts(name));
  }

  exec(`systemctl restart named`);

  console.log("The master zone and it's hosts file were created.");
  console.log("Path to named config: " + PATHS.zones);
  console.log("Path to hosts file: " + PATHS.hosts(name));
}

async function updateDNS(rl) {
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
    console.log("No master zones to update.");
    process.exit(0);
  }
  filteredZones.forEach((file) => {
    console.log(`[${c++}] ${file}`);
  });
  let option = await ask(
    rl,
    "Type the number of what record to update: ",
    "No option was typed"
  );
  let domainName = filteredZones[parseInt(option)];
  domainName = domainName.replace(".hosts", "");

  let namedConf;
  try {
    namedConf = fs.readFileSync(PATHS.zones, "utf8");
  } catch (e) {
    throw new Error("Couldn't read file: " + PATHS.zones);
  }

  let changeDomainName = await ask(
    rl,
    "Type a domain name to update it: ",
    "No domain was typed"
  );

  if (!domainRegex.test(changeDomainName)) {
    console.log("Invalid domain name type again!");
    await updateDNS(rl);
    rl.close();
    return;
  }

  rl.close();

  namedConf = namedConf.replace(
    `zone "${domainName}" IN {
    type master;
    file "${PATHS.hosts(domainName)}";
  };`,
    `zone "${changeDomainName}" IN {
    type master;
    file "${PATHS.hosts(changeDomainName)}";
  };`
  );

  try {
    fs.writeFileSync(PATHS.zones, namedConf);
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.zones);
  }

  exec(
    `mv /var/named/${domainName}.hosts /var/named/${changeDomainName}.hosts`
  );

  exec(`systemctl restart named`);

  console.log("Update with success");
}

async function disabledDNS(rl) {
  let confirm = await ask(
    rl,
    "Are you sure do disable DNS? [y/n]: ",
    "No confirm was typed."
  );
  rl.close();
  if (confirm === "y") {
    exec(`systemctl stop named`);
    console.log("DNS share was disabled");
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
    "[1] Add DNS\n[2] Edit DNS\n[3] Delete DNS\n[4] Disable DNS\nChoose an option: ",
    "No option was typed"
  );
  switch (option) {
    case "1":
      console.clear();
      console.log("Add DNS");
      await createDNS(rl);
      break;

    case "2":
      console.clear();
      console.log("Edit DNS");
      await updateDNS(rl);
      break;

    case "3":
      rl.close();
      console.clear();
      console.log("Delete DNS");
      await deleteMasterZone();
      break;

    case "4":
      console.clear();
      console.log("Disable DNS");
      await disabledDNS(rl);
      break;

    default:
      rl.close();
      console.clear();
      console.log("DNS");
      await main();
      break;
  }
}

//console.log('DNS Program')
//main();

module.exports = { main };
