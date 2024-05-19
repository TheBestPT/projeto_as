const { ask, ipRegex, domainRegex, PATHS } = require("../globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");
const { deleteReverseZone } = require("./p6");

async function createReverseZone(rl) {
  let ip = await ask(
    rl,
    "Insert an ip for the reverse zone: ",
    "No ip was typed."
  );
  if (!ipRegex.test(ip)) {
    console.log("Invalid ip type again!");
    rl.close();
    await main();
    return;
  }

  let domainName = await ask(
    rl,
    "Insert a domain name for the reverse zone: ",
    "No domain was typed."
  );
  if (!domainRegex.test(domainName)) {
    console.log("Domain is invalid, program will restart");
    rl.close();
    await main();
    return;
  }

  let reverseIp = ip.split(".");
  let lastDigit = reverseIp[reverseIp.length - 1];
  reverseIp.pop();
  reverseIp.reverse();
  reverseIp = reverseIp.join(".");

  let namedConf;
  try {
    namedConf = fs.readFileSync(PATHS.zones);
  } catch (e) {
    throw new Error("Cannot read file: ", PATHS.zones);
  }

  if (!namedConf.includes(`"${reverseIp}.in-addr.arpa"`)) {
    namedConf += `\nzone "${reverseIp}.in-addr.arpa" IN {
      type master;
      file "/var/named/${reverseIp}.in-addr.arpa.hosts";
    };`;

    try {
      fs.writeFileSync(PATHS.zones, namedConf);
    } catch (e) {
      throw new Error("Cannot write file: ", PATHS.zones);
    }
  }

  let reverseHostsFile;
  if (!fs.existsSync(PATHS.hosts(`${reverseIp}.in-addr.arpa`))) {
    reverseHostsFile = `$ttl 38400
@	IN	SOA	dns.estig.pt. mail.as.com. (
      1165192116
      10800
      3600
      604800
      38400 )
  IN  NS  dns.estig.pt.
${lastDigit}  IN  PTR ${domainName}.`;
    rl.close();
  } else {
    let hostsFile;
    try {
      hostsFile = fs.readFileSync(PATHS.hosts(`${reverseIp}.in-addr.arpa`));
    } catch (e) {
      throw new Error(
        "Cannot read file: ",
        PATHS.hosts(`${reverseIp}.in-addr.arpa`)
      );
    }
    while (hostsFile.includes(`${lastDigit}  IN`)) {
      let stop = await ask(
        rl,
        "The ip endpoint already exists do you want to type another? [y/n] ",
        "No answer was typed."
      );

      if (stop === "n") {
        console.log("Program ended.");
        process.exit(0);
      }
      ip = await ask(rl, "Insert an ip: ", "No ip was typed.");
      reverseIp = ip.split(".");
      lastDigit = reverseIp[reverseIp.length - 1];
      reverseIp.pop();
      reverseIp.reverse();
      reverseIp = reverseIp.join(".");
      reverseHostsFile = hostsFile;
    }
    rl.close();

    reverseHostsFile += `\n${lastDigit}  IN  PTR ${domainName}.`;
  }

  try {
    fs.writeFileSync(
      PATHS.hosts(`${reverseIp}.in-addr.arpa`),
      reverseHostsFile
    );
  } catch (e) {
    throw new Error("Cannot write file: ", PATHS.zones);
  }

  exec(`systemctl restart named`);

  console.log("Reverse zone added with success");
  console.log(`Named conf: ${PATHS.zones}`);
  console.log(`Reverse zone: ${PATHS.hosts(`${reverseIp}.in-addr.arpa`)}`);
}

async function updateReverseZone(rl) {
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

  if (isNaN(parseInt(option))) {
    console.log("Invalid option type again!");
    rl.close();
    await main();
    return;
  }

  let fileChoose = filteredZones[parseInt(option)];
  let reverseFile;
  try {
    reverseFile = fs.readFileSync("/var/named/" + fileChoose, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: ", fileChoose);
  }

  console.clear();

  let records = reverseFile.split("\n").splice(8);

  if (records.length === 0 || !records) {
    console.log("No records to update");
    rl.close();
    await main();
    return;
  }

  let recordString = records.reduce((a, b) => `${a}  \n${b}`);

  console.log(recordString);

  let updateOption = await ask(
    rl,
    "Type the number of what record to update: ",
    "No option was typed"
  );

  if (records.filter((r) => r.includes(updateOption)).length === 0) {
    console.log("Wrong record typed in. Type again: ");
    await updateOption(rl);
    rl.close();
    return;
  }

  let changeEndpoint = await ask(
    rl,
    "Do you want to change endpoint number? [y/n] ",
    "No ip was typed."
  );

  let ip;

  if (changeEndpoint === "n") {
    ip = updateOption;
  } else {
    ip = await ask(
      rl,
      "Insert an endpoint for the reverse zone. (0-254): ",
      "No ip was typed."
    );
  }

  if (!(parseInt(ip) > 0 && parseInt(ip) < 255)) {
    console.log("Invalid ip type again!");
    rl.close();
    await main();
    return;
  }

  let domainName = await ask(
    rl,
    "Insert a domain name for the reverse zone: ",
    "No domain was typed."
  );
  if (!domainRegex.test(domainName)) {
    console.log("Domain is invalid, program will restart");
    rl.close();
    await main();
    return;
  }

  rl.close();

  reverseFile = reverseFile.replace(
    records.filter((r) => r.includes(updateOption))[0],
    `${ip}  IN  PTR ${domainName}.`
  );

  try {
    fs.writeFileSync("/var/named/" + fileChoose, reverseFile);
  } catch (e) {
    throw new Error("Cannot read file: ", "/var/named/" + fileChoose);
  }

  exec(`systemctl restart named`);

  console.log("Reverse zone updated with success.");
  console.log("Reverse zone config ", PATHS.zones);
  console.log("Reverse zone file: ", "/var/named/" + fileChoose);
}

async function disableReverseZone(rl) {
  let confirm = await ask(
    rl,
    "Are you sure do disable Reverse Zone? [y/n]: ",
    "No confirm was typed."
  );
  rl.close();
  if (confirm === "y") {
    exec(`systemctl stop named`);
    console.log("Reverse Zone share was disabled");
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
    "[1] Add Reverse Zone\n[2] Edit Reverse Zone\n[3] Delete Reverse Zone\n[4] Disable Reverse Zone\nChoose an option: ",
    "No option was typed"
  );

  switch (option) {
    case "1":
      console.clear();
      console.log("Add Reverse zone");
      await createReverseZone(rl);
      break;

    case "2":
      console.clear();
      console.log("Add Reverse zone");
      await updateReverseZone(rl);
      break;

    case "3":
      rl.close();
      console.clear();
      console.log("Delete Reverse zone");
      await deleteReverseZone();
      break;

    case "4":
      console.clear();
      console.log("Disable Reverse zone");
      await disableReverseZone(rl);
      break;

    default:
      rl.close();
      console.clear();
      console.log("Reverse zone");
      await main();
      break;
  }
}

module.exports = { main };
