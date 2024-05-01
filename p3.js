const { PATHS, ask, domainRegex, getLocalIp } = require("./globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  let name = await ask(
    rl,
    "Insert a domain name for VirtualHost: ",
    "No name was typed."
  );
  rl.close();

  if (!domainRegex.test(name)) {
    console.log("Invalid domain name type again!");
    await main();
    return;
  }

  let httpdConf;
  try {
    httpdConf = fs.readFileSync(PATHS.httpConf);
  } catch (e) {
    throw new Error("Cannot read file: " + PATHS.httpConf);
  }

  exec(`adduser ${name}`);
  exec(`mkdir /home/${name}`);
  exec(`echo "${name}" > /home/${name}/index.html`);
  exec(`chmod 755 /home/${name} -R`);

  let virtualHost = `\n\n<VirtualHost ${getLocalIp()}:80>
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
  if (!httpdConf.includes(virtualHost)) httpdConf += virtualHost;

  try {
    fs.writeFileSync(PATHS.httpConf, httpdConf);
  } catch (e) {
    throw new Error("Cannot write this file: ", PATHS.httpdConf);
  }

  exec(`systemctl restart httpd`);

  console.log("Virtual host created with success");
  console.log(`Http config: ${PATHS.httpConf}`);
  console.log(`Path to the user created: /home/${name}`);
}

console.log('Virtual Hosts program')
main();
