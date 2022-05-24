const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const shelljs = require('shelljs');
const exit = require('./exit');

//public function
exports.add = async (domainInfo, certId) => {
    let certId
    const configPath = path.join(__dirname, '..', 'verify', 'conf', `${domainInfo.domain}.conf`);
    const webRoot = path.join(__dirname, '..', 'verify', 'web', domainInfo.domain);
    const verifyFile = path.join(__dirname, '..', 'verify', 'web', domainInfo.domain, '.well-known', 'pki-validation', domainInfo.name);
    //Try to listen port 80
    const server = http.createServer((rep, res) => {

    }).listen(80);
    server.on('listening', () => {
        server.close()
    })
    server.on('error', (err) => {
        if (err.code == 'EADDRINUSE') {
            //Port 80 occupied
            switch (getWebServer()) {
                case 'nginx':

                    break;
                case 'apache':

                    break;
            }
        }
    })

    //write verify file
    await fs.writeFile(verifyFile, domainInfo.value);
    //write new config
    await fs.writeFile(configPath, `server {\nlisten 80;\nlisten [::]:80;\nserver_name ${domainInfo.domain};\nroot ${webRoot};\n}`);

}

exports.delete = async (domainInfo) => { }

//privacy function
getWebServer = () => {
    var serverType;
    switch (os.type) {
        case 'Windows_NT':
            for (let listenInfo of shelljs.exec('netstat -ano', { silent: true }).split('\r\n')) {
                if (new RegExp('TCP.*?:80\\b', 'gi').test(listenInfo)) {
                    let processInfo = shelljs.exec(`tasklist|findstr ${listenInfo.match(/(d)*$/)}`);
                    if (processInfo.includes('apache2')) {
                        serverType = 'apache';
                        break;
                    } else if (processInfo.includes('nginx')) {
                        serverType = 'nginx';
                        break;
                    }
                }
            }
            break;
        case 'Darwin':
            for (let processInfo of shelljs.exec('lsof -i:80', { silent: true }).split('\n')) {
                if (processInfo.includes('apache2')) {
                    serverType = 'apache';
                    break;
                } else if (processInfo.includes('nginx')) {
                    serverType = 'nginx';
                    break;
                }
            }
            break;
        case 'Linux':
            //Install lsof
            if (shelljs.exec('type lsof', { silent: true }).code != 0) {
                //Install command lsof
                if (shelljs.exec('type apt', { silent: true }).code != 0) {
                    shelljs.exec('apt update && apt install lsof -y', { silent: true });
                } else if (shelljs.exec('type yum', { silent: true }).code != 0) {
                    shelljs.exec('yum update && yum install lsof -y', { silent: true });
                } else {
                    exit(4);
                }
            }
            for (let processInfo of shelljs.exec('lsof -i:80', { silent: true }).split('\n')) {
                if (processInfo.includes('apache2')) {
                    serverType = 'apache';
                    break;
                } else if (processInfo.includes('nginx')) {
                    serverType = 'nginx';
                    break;
                }
            }
            break;
        default:
            exit(2);
    }
    if (!serverType) {
        exit(3);
    } else {
        return serverType;
    }
}