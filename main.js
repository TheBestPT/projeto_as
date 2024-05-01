const p1 = require("./p1");
const p2 = require("./p2");
const p3 = require("./p3");
const p5 = require("./p5");
const p7 = require("./p7");
const { ask } = require("./globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

const rlMain = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  //await p1.main()
  console.clear();
  console.log("AS - Utilities");
  let option = await ask(
    rlMain,
    "[1] DNS\n[2] SMB (Samba)\n[3] Virtual Hosts\n[4] Reverse Zone\n[5] NFS\nType an option: ",
    ""
  );
  rlMain.close();
  switch (option) {
    case "1":
      console.clear();
      console.log("DNS");
      await p1.main();
      break;
    case "2":
      console.clear();
      console.log("SMB (Samba)");
      await p2.main();
      break;
    case "3":
      console.clear();
      console.log("Virtual Hosts");
      await p3.main();
      break;
    case "4":
      console.clear();
      console.log("Reverse Zone");
      await p5.main();
      break;
    case "5":
      console.clear();
      console.log("NFS");
      await p7.main();
      break;
    default:
      await main();
      break;
  }
}

main();
