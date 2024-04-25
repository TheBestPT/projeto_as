const globals = require('./globals')
const readline = require('readline')
const fs = require('fs')
const { exec } = require("child_process")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})


async function main() {
  let name = await globals.ask(rl, 'Insert a domain name: ', 'No name was typed.')
  let named
  try {
    named = fs.readFileSync(globals.PATHS.zones, 'utf8')
  } catch (e) {
    throw new Error('Couldn\'t read file: ' + globals.PATHS.zones)
  }
  while (named.includes(`"${name}"`)) {
    let stop = await globals.ask(rl, 'The domain already exists you to type again? [y/n] ', 'No answer was typed.')

    if (stop === 'n') {
      console.log('Program ended.')
      process.exit(0)
    }
    name = await globals.ask(rl, 'Insert a domain name: ', 'No name was typed.')
  }
  rl.close()

  named += `\nzone "${name}" IN {
    type master;
    file "${globals.PATHS.hosts(name)}";
  };`

  try {
    fs.writeFileSync(globals.PATHS.zones, named)
  } catch (e) {
    throw new Error('Couldn\'t write file: ' + globals.PATHS.zones)
  }

  let hostContent = globals.defaultHost + `\n  IN  A  ${globals.getLocalIp()['enp0s3']}\nwww  IN  A  ${globals.getLocalIp()['enp0s3']}`
  try {
    fs.writeFileSync(globals.PATHS.hosts(name), hostContent)
  } catch (e) {
    throw new Error('Couldn\'t write file: ' + globals.PATHS.hosts(name))
  }

  console.log('The master zone and it\'s hosts file were created.')
  console.log('Path to named config: ' + globals.PATHS.zones)
  console.log('Path to hosts file: ' + globals.PATHS.hosts(name))

  exec(`systemctl restart named`)

  console.log('Virtual host created with success')
}



main()


module.exports = { main }