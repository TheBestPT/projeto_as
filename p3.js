const globals = require("./globals");
const readline = require("readline");
const fs = require("fs");
//const p1 = require('./p1')
const { exec } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function askZone() {
  return new Promise((resolve, reject) => {
    rl.question(
      "You want to add the master zone or it's an existing one? [y/n] ",
      (answer) => {
        if (!answer || answer !== "y" || answer !== "n") {
          throw new Error("No answer was typed.");
        }
        resolve(answer);
      }
    );
  });
}

async function main() {
  // let masterZone = await askZone()
  // if(masterZone === 'y') {
  //   p1.main()
  // }

  //await p1.main()
  let name = await globals.ask(
    rl,
    "Insert a domain name for VirtualHost: ",
    "No name was typed."
  );
  rl.close();

  let httpdConf;
  try {
    httpdConf = fs.readFileSync(globals.PATHS.httpConf);
  } catch (e) {
    throw new Error("Cannot read file: " + globals.PATHS.httpConf);
  }

  exec(`adduser ${name}`);
  exec(`mkdir /home/${name}`);
  exec(`echo "${name}" > /home/${name}/index.html`);
  exec(`chmod 755 /home/${name} -R`);

  httpdConf += `\n\n<VirtualHost ${globals.getLocalIp()["enp0s3"]}:80>
  DocumentRoot "/home/${name}/"
  ServerName www.${name}
  ServerAlias ${name}
  <Directory "/home/${name}">
    Options Indexes FollowSymLinks
    AllowOverride All
    Order allow,deny
    Allow from all
    Require method GET POST OPTIONS
  </Directory>
  </VirtualHost>`;

  try {
    fs.writeFileSync(globals.PATHS.httpConf, httpdConf);
  } catch (e) {
    throw new Error("Cannot write this file: ", globals.PATHS.httpdConf);
  }

  exec(`systemctl restart httpd`);

  console.log("Virtual host created with success");
}

main();
