const { PATHS, ask, domainRegex, getLocalIp } = require("../globals");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");
const { deleteVirtualHost } = require("./p6");

async function createVirtualHost(rl) {
  let name = await ask(
    rl,
    "Insert a domain name for VirtualHost: ",
    "No name was typed."
  );
  rl.close();

  if (!domainRegex.test(name)) {
    console.log("Invalid domain name type again!");
    rl.close();
    await main();
    return;
  }

  let httpdConf;
  try {
    httpdConf = fs.readFileSync(PATHS.httpConf, "utf8");
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

async function updateVirtualHost(rl) {
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
    await main();
    return;
  }
  let c = 0;
  filteredZones.forEach((file) => {
    console.log(`[${c++}] ${file}`);
  });

  let option = await ask(
    rl,
    "Type the number of what record to update: ",
    "No option was typed"
  );

  if(isNaN(parseInt(option))) {
    console.log("Invalid option type again!");
    rl.close();
    await main();
    return;
  }

  let selectOption = filteredZones[parseInt(option)];

  let changeVirtualHost = await ask(
    rl,
    "Type the virtual host name to update it: ",
    "No Virtual Host was typed in."
  );

  

  if (!domainRegex.test(changeVirtualHost)) {
    console.log("Invalid domain name type again!");
    rl.close();
    await main();
    return;
  }

  rl.close();

  //Remove old user
  exec(`userdel ${selectOption}`);
  exec(`rm -rf /home/${selectOption}`);

  //Add user
  exec(`adduser ${changeVirtualHost}`);
  exec(`mkdir /home/${changeVirtualHost}`);
  exec(`echo "${changeVirtualHost}" > /home/${changeVirtualHost}/index.html`);
  exec(`chmod 755 /home/${changeVirtualHost} -R`);

  let httpdConf;
  try {
    httpdConf = fs.readFileSync(PATHS.httpConf, "utf8");
  } catch (e) {
    throw new Error("Cannot read file: " + PATHS.httpConf);
  }

  

  httpdConf = httpdConf.replace(
    `DocumentRoot "/home/${selectOption}/"
  ServerName www.${selectOption}
  ServerAlias ${selectOption}
  <Directory "/home/${selectOption}">
    Options Indexes FollowSymLinks
    AllowOverride All
    Order allow,deny
    Allow from all
    Require method GET POST OPTIONS
  </Directory>`,
  `DocumentRoot "/home/${changeVirtualHost}/"
  ServerName www.${changeVirtualHost}
  ServerAlias ${changeVirtualHost}
  <Directory "/home/${changeVirtualHost}">
    Options Indexes FollowSymLinks
    AllowOverride All
    Order allow,deny
    Allow from all
    Require method GET POST OPTIONS
  </Directory>`
  );

  try {
    fs.writeFileSync(PATHS.httpConf, httpdConf);
  } catch (e) {
    throw new Error("Cannot write file: ", PATHS.httpConf);
  }

  exec(`systemctl restart httpd`);

  console.log("Virtual host updated with success");
  console.log(`Http config: ${PATHS.httpConf}`);
  console.log(`Path to the user created: /home/${changeVirtualHost}`);
}

async function disableVirtualHost(rl) {
  let confirm = await ask(
    rl,
    "Are you sure do disable Virtual Host? [y/n]: ",
    "No confirm was typed."
  );
  rl.close();
  if (confirm === "y") {
    exec(`systemctl stop httpd`);
    console.log("Virtual Host share was disabled");
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
    "[1] Add Virtual Host\n[2] Edit Virtual Host\n[3] Delete Virtual Host\n[4] Disable Virtual Host\nChoose an option: ",
    "No option was typed"
  );
  switch (option) {
    case "1":
      console.clear();
      console.log("Add Virtual Host");
      await createVirtualHost(rl);
      break;

    case "2":
      console.clear();
      console.log("Edit Virtual Host");
      await updateVirtualHost(rl);
      break;

    case "3":
      rl.close();
      console.clear();
      console.log("Delete Virtual Host");
      await deleteVirtualHost();
      break;

    case "4":
      console.clear();
      console.log("Disable Virtual Host");
      await disableVirtualHost(rl);
      break;

    default:
      rl.close();
      console.clear();
      console.log("Virtual Hosts");
      await main();
      break;
  }
}

module.exports = { main };
