const globals = require('./globals')
const readline = require('readline')
const fs = require('fs')
//const p1 = require('./p1')
const { exec } = require("child_process")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function askName() {
  return new Promise((resolve, reject) => {
    rl.question(`Insert a domain name to add an A or MX record: `, name => {
      if (!name) {
        throw new Error('No name was typed.')
      }
      resolve(name)
    })
  })
}

async function askAMx() {
  return new Promise((resolve, reject) => {
    rl.question(`What type do you want do insert? A or MX?: `, recordType => {
      if (!recordType) {
        throw new Error('No record type was typed.')
      }
      resolve(recordType)
    })
  })
}

async function askRecord() {
  return new Promise((resolve, reject) => {
    rl.question(`Type the record: `, record => {
      if (!record) {
        throw new Error('No record was typed.')
      }
      resolve(record)
    })
  })
}

async function askIp() {
  return new Promise((resolve, reject) => {
    rl.question(`Type the ip for the record: `, ip => {
      if (!ip) {
        throw new Error('No ip was typed.')
      }
      resolve(ip)
    })
  })
}

async function main() {
  let domainName = await askName()
  let recordType = await askAMx()
  let record = await askRecord()
  let ip = await askIp()
  rl.close()

  let hostFile
  try {
    hostFile = fs.readFileSync(globals.PATHS.hosts(domainName))
  } catch(e) {
    throw new Error('Domain not found.')
  }

  hostFile += `\n${record}  IN  ${recordType}  ${ip}`

  try{
    fs.writeFileSync(globals.PATHS.hosts(domainName), hostFile)
  } catch(e) {
    throw new Error('Cannot write file: ', globals.PATHS.hosts(domainName))
  }

  exec(`systemctl restart named`)

  console.log('Record added with success')


}



main()