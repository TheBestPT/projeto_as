const p1 = require("./scripts/p1");
const p2 = require("./scripts/p2");
const p3 = require("./scripts/p3");
const p4 = require("./scripts/p4");
const p5 = require("./scripts/p5");
const p7 = require("./scripts/p7");
const { ask } = require("./globals");
const readline = require("readline");
const { exec } = require("child_process");

const rlMain = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.clear();
  console.log("AS - Utilities");
  let option = await ask(
    rlMain,
    "[1] DNS\n[2] SMB (Samba)\n[3] Virtual Hosts\n[4] A or MX Records\n[5] Reverse Zone\n[6] NFS\nType an option: ",
    ""
  );

  if (isNaN(parseInt(option))) {
    await main();
    return;
  }

  rlMain.close();

  switch (option) {
    case "1":
      exec("systemctl start named");
      console.clear();
      console.log("DNS");
      await p1.main();
      break;

    case "2":
      exec("systemctl start smb");
      console.clear();
      console.log("SMB (Samba)");
      await p2.main();
      break;

    case "3":
      exec("systemctl start httpd");
      console.clear();
      console.log("Virtual Hosts");
      await p3.main();
      break;

    case "4":
      exec("systemctl start named");
      console.clear();
      console.log("A or MX Records");
      await p4.main();
      break;

    case "5":
      exec("systemctl start named");
      console.clear();
      console.log("Reverse Zone");
      await p5.main();
      break;

    case "6":
      exec("systemctl start nfs");
      console.clear();
      console.log("NFS");
      await p7.main();
      break;

    default:
      console.clear();
      console.log("AS - Utilities");
      await main();
      break;
  }
}

main();
