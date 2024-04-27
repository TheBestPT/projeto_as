const globals = require("./globals");
const readline = require("readline");
const fs = require("fs");
//const p1 = require('./p1')
const { exec } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  let domainName = await globals.ask(
    rl,
    "Insert a domain name to add an A or MX record: ",
    "No name was typed."
  );
  let recordType = await globals.ask(
    rl,
    "What type do you want do insert? A or MX?: ",
    "No record type was typed."
  );
  let record = await globals.ask(
    rl,
    "Type the record: ",
    "No record was typed."
  );
  let ip = await globals.ask(
    rl,
    "Type the ip for the record: ",
    "No ip was typed."
  );
  rl.close();

  let hostFile;
  try {
    hostFile = fs.readFileSync(globals.PATHS.hosts(domainName));
  } catch (e) {
    throw new Error("Domain not found.");
  }

  hostFile += `\n${record}  IN  ${recordType}  ${ip}`;

  try {
    fs.writeFileSync(globals.PATHS.hosts(domainName), hostFile);
  } catch (e) {
    throw new Error("Cannot write file: ", globals.PATHS.hosts(domainName));
  }

  exec(`systemctl restart named`);

  console.log("Record added with success");
}

main();
