const globals = require('./globals')
const readline = require('readline')
const fs = require('fs')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function askName() {
  return new Promise((resolve, reject) => {
    rl.question(`Insert a domain name: `, name => {
      if (!name) {
        throw new Error('No name was typed.')
      }
      resolve(name)
    })
  })
}

function askOverride() {
  return new Promise((resolve, reject) => {
    rl.question('The domain already exists you want to override? [y/n]', (answer) => {
      if (!answer) {
        throw new Error('No answer was typed.')
      }
      resolve(answer)
    })
  })
}


const app = async () => {
  let name = await askName()
  let named
  try {
    named = fs.readFileSync(globals.PATHS.zones, 'utf8')
  } catch (e) {
    throw new Error('Couldn\'t read file: ' + globals.PATHS.zones)
  }
  if (named.includes(`"${name}"`)) {
    let stop = await askOverride()

    if (stop === 'n') {
      console.log('Program ended.')
      process.exit(0)
    }
  }

  named += `\nzone "${name}" IN {
    type master;
    file "${globals.PATHS.hosts(name)}.hosts";
  };`

  try {
    fs.writeFileSync(globals.PATHS.zones, named)
  } catch (e) {
    throw new Error('Couldn\'t write file: ' + globals.PATHS.zones)
  }

  let hostContent = globals.defaultHost + `\n  IN  A  ${globals.getLocalIp()['enp0s3']}`
  try {
    fs.writeFileSync(globals.PATHS.hosts(name), hostContent)
  } catch (e) {
    throw new Error('Couldn\'t write file: ' + globals.PATHS.hosts(name))
  }

  console.log('The master zone and it\'s hosts file were created.')
  console.log('Path to named config: ' + globals.PATHS.zones)
  console.log('Path to hosts file: ' + globals.PATHS.hosts(name))

  rl.close()
}



app()