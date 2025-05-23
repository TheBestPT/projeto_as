const { PATHS, ask, ipRegex, domainRegex } = require("../globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

async function main() {
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
    "Type the number of what record to add: ",
    "No option was typed"
  );

  if(isNaN(parseInt(option)) || !filteredZones[parseInt(option)]) {
    console.log("Invalid option type again!");
    rl.close();
    await main();
    return;
  }

  let domainName = filteredZones[parseInt(option)];
  domainName = domainName.replace(".hosts", "");

  // let domainName = await ask(
  //   rl,
  //   "Insert a domain name to add an A or MX record: ",
  //   "No name was typed."
  // );
  if (!domainRegex.test(domainName)) {
    console.log("Invalid domain name type again!");
    rl.close();
    await main();
    return;
  }

  let recordType = await ask(
    rl,
    "What type do you want do insert? A or MX?: ",
    "No record type was typed."
  );

  if (recordType !== "A" && recordType !== "MX") {
    console.log("Invalid record type, program will restart");
    rl.close();
    await main();
    return;
  }

  let record = await ask(rl, "Type the record (ex: ftp, mail): ", "No record was typed.");

  if (domainRegex.test(record)) {
    console.log("Invalid record type again!");
    rl.close();
    await main();
    return;
  }

  let ip = await ask(rl, "Type the ip for the record: ", "No ip was typed.");
  rl.close();
  if (!ipRegex.test(ip)) {
    console.log("Invalid IP type again!");
    await main();
    return;
  }

  let hostFile;
  try {
    hostFile = fs.readFileSync(PATHS.hosts(domainName));
  } catch (e) {
    throw new Error("Domain not found.");
  }

  hostFile += `\n${record}  IN  ${recordType}  ${ip}`;

  try {
    fs.writeFileSync(PATHS.hosts(domainName), hostFile);
  } catch (e) {
    throw new Error("Cannot write file: ", PATHS.hosts(domainName));
  }

  exec(`systemctl restart named`);

  console.log("Record added with success");
  console.log(`Host file: ${PATHS.hosts(domainName)}`);
}

module.exports = {
  main,
};
