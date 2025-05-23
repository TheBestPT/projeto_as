const { ask, domainRegex, PATHS, getLocalIp } = require("../globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

async function deleteMasterZone(name = null) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let fileChoose;
  if (!name) {
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
      process.exit(0);
    }

    filteredZones.forEach((file) => {
      console.log(`[${c++}] ${file}`);
    });

    let option = await ask(
      rl,
      "Type the number of what record delete: ",
      "No option was typed"
    );

    if (isNaN(parseInt(option)) || !filteredZones[parseInt(option)]) {
      console.log("Invalid option type again!");
      rl.close();
      process.exit(0);
    }

    rl.close();

    fileChoose = filteredZones[parseInt(option)];
  } else {
    fileChoose = name;
  }

  try {
    fs.unlinkSync("/var/named/" + fileChoose);
  } catch (e) {
    console.log(e);
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
  console.log(`Named conf: ${PATHS.zones}`);
}

async function deleteVirtualHost() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let files;
  try {
    files = fs.readdirSync(PATHS.home);
  } catch (e) {
    throw new Error("Cannot read directory: ", PATHS.hostsDir);
  }

  let filteredZones = files.filter((file) => domainRegex.test(file));

  if (filteredZones.length === 0) {
    console.log("No master zones to delete.");
    rl.close();
    process.exit(0);
  }

  let c = 0;
  filteredZones.forEach((file) => {
    console.log(`[${c++}] ${file}`);
  });

  let option = await ask(
    rl,
    "Type the number of what record delete: ",
    "No option was typed"
  );
  rl.close();

  if (isNaN(parseInt(option)) || !filteredZones[parseInt(option)]) {
    console.log("Invalid option type again!");
    rl.close();
    process.exit(0);
  }

  let selectOption = filteredZones[parseInt(option)];

  await deleteMasterZone(selectOption + ".hosts");

  let httpConf;
  try {
    httpConf = fs.readFileSync(PATHS.httpConf, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.httpConf);
  }

  httpConf = httpConf.replace(
    `<VirtualHost ${getLocalIp()["enp0s3"]}:80>
  DocumentRoot "/home/${selectOption}/"
  ServerName www.${selectOption}
  ServerAlias ${selectOption}
  <Directory "/home/${selectOption}">
    Options Indexes FollowSymLinks
    AllowOverride All
    Order allow,deny
    Allow from all
    Require method GET POST OPTIONS
  </Directory>
  </VirtualHost>`,
    ""
  );

  try {
    fs.writeFileSync(PATHS.httpConf, httpConf);
  } catch (e) {
    throw new Error("Cannot write file: ", PATHS.httpConf);
  }

  exec(`systemctl restart httpd`);
  exec(`systemctl restart named`);

  console.log("Virtual Host deleted with success.");
  console.log(`HTTP conf: ${PATHS.httpConf}`);
}

async function deleteReverseZone() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

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
    console.log("No reverse zones to delete.");
    process.exit(0);
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

  if (isNaN(parseInt(option)) || !filteredZones[parseInt(option)]) {
    console.log("Invalid option type again!");
    rl.close();
    process.exit(0);
  }

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
  console.log(`Named conf: ${PATHS.zones}`);
}

async function main() {
  let deleteWhat = await ask(
    rl,
    "Select what you wanna delete:\n[1] Master zone\n[2] Virtual Host\n[3] Reverse zone\nType: ",
    "No option was typed."
  );

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

module.exports = { deleteMasterZone, deleteVirtualHost, deleteReverseZone };
