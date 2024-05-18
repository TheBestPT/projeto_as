const { PATHS, ask, ipRegex, domainRegex } = require("../globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let domainName = await ask(
    rl,
    "Insert a domain name to add an A or MX record: ",
    "No name was typed."
  );
  if (!domainRegex.test(domainName)) {
    console.log("Invalid domain name type again!");
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
    await main();
    return;
  }

  let record = await ask(rl, "Type the record: ", "No record was typed.");

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

console.log("Program to create records A or MX");

module.exports = {
  main,
};
