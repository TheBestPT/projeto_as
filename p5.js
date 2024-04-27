const {ask, ipRegex, domainRegex, PATHS} = require('./globals')
const readline = require('readline')
const fs = require('fs')
const { exec } = require("child_process")



const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})



async function main() {
  console.log('Program to create reserve zones.')
  let ip = await ask(rl, 'Insert an ip for the reverse zone: ', 'No ip was typed.')
  let domainName = await ask(rl, 'Insert a domain name for the reverse zone: ', 'No domain was typed.')
  //rl.close()

  if(!ipRegex.test(ip)) {
    throw new Error('Ip is invalid')
  }

  if(!domainRegex.test(domainName)) {
    throw new Error('Domain is invalid')
  }

  let reverseIp = ip.split('.')
  let lastDigit = reverseIp[reverseIp.length - 1]
  reverseIp.pop()
  reverseIp.reverse()
  reverseIp = reverseIp.join('.')

  
  let namedConf
  try {
    namedConf = fs.readFileSync(PATHS.zones)
  } catch(e) {
    throw new Error('Cannot read file: ', PATHS.zones)
  }

  

  if(!namedConf.includes(`"${reverseIp}.in-addr.arpa"`)){
    namedConf += `\nzone "${reverseIp}.in-addr.arpa" IN {
      type master;
      file "/var/named/${reverseIp}.in-addr.arpa.hosts";
    };`
  
    //console.log(namedConf)
    try {
      fs.writeFileSync(PATHS.zones, namedConf)
    } catch(e) {
      throw new Error('Cannot write file: ', PATHS.zones)
    }
  }
  
  let reverseHostsFile
  if(!fs.existsSync(PATHS.hosts(`${reverseIp}.in-addr.arpa`))){
    reverseHostsFile = `$ttl 38400
@	IN	SOA	dns.estig.pt. mail.as.com. (
      1165192116
      10800
      3600
      604800
      38400 )
  IN  NS  dns.estig.pt.
${lastDigit}  IN  PTR ${domainName}.`
    rl.close()
  } else {
    let hostsFile
    try {
      hostsFile = fs.readFileSync(PATHS.hosts(`${reverseIp}.in-addr.arpa`))
    } catch(e) {
      throw new Error('Cannot read file: ', PATHS.hosts(`${reverseIp}.in-addr.arpa`))
    }
    while (hostsFile.includes(`${lastDigit}  IN`)) {
      let stop = await ask(rl, 'The ip endpoint already exists do you want to type another? [y/n] ', 'No answer was typed.')
  
      if (stop === 'n') {
        console.log('Program ended.')
        process.exit(0)
      }
      ip = await ask(rl, 'Insert an ip: ', 'No ip was typed.')
      reverseIp = ip.split('.')
      lastDigit = reverseIp[reverseIp.length - 1]
      reverseIp.pop()
      reverseIp.reverse()
      reverseIp = reverseIp.join('.')
      reverseHostsFile = hostsFile
    }
    rl.close()
    
    reverseHostsFile += `\n${lastDigit}  IN  PTR ${domainName}.`
  }
  
  

  try {
    fs.writeFileSync(PATHS.hosts(`${reverseIp}.in-addr.arpa`), reverseHostsFile)
  } catch(e) {
    throw new Error('Cannot write file: ', PATHS.zones)
  }

  exec(`systemctl restart named`)

  console.log('reverse zone added with success')
}



main()