const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const shelljs = require('shelljs');
const exit = require('./exit');

//public function
exports.add = async (domainInfo) => {
    const webRoot = path.join(__dirname, '..', 'verify', 'web', domain);
    const verifyFile = path.join(__dirname, '..', 'verify', 'web', domain, '.well-known', 'pki-validation', domainInfo.name);
    //写入验证文件
    await fs.writeFile(verifyFile, domainInfo.value);
    //Try to listen port 80
    const server = http.createServer((rep, res) => {

    }).listen(80);
    server.on('listening', () => {
        server.close()
    })
    server.on('error', (err) => {
        if (err.code == 'EADDRINUSE') {
            //Port 80 occupied
            serverConfig(domainInfo, webRoot);
        }
    })


}

exports.delete = async (domainInfo) => { }

//privacy function
//获取web服务器(Apache或Nginx)
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

//自动修改web服务器配置,添加验证值
const serverConfig = async (domainInfo, webRoot) => {
    const domain = domainInfo.domain;
    const configFolder = path.join(__dirname, '..', 'verify', 'conf');
    const configPath = path.join(configFolder, `${domain}.conf`.replace('*', '_'));
    switch (getWebServer()) {
        case 'nginx':
            //写入新的server
            await fs.writeFile(configPath, `server {\nlisten 80;\nlisten [::]:80;\nserver_name ${domain};\nroot ${webRoot};\n}`);
            //修改nginx.conf
            let nginxConf = await fs.readFile(shelljs.exec('nginx -t').match(new RegExp('([A-Za-z]:)?[\\\/]([^\/]+\/)*?nginx\.conf)', i))[0]);
            if (!new RegExp(`include\s+${configFolder}/*`, gi).test(nginxConf)) {
                //未找到匹配内容则添加
                let insertPoint = nginxConf.search(/(http\s*{[\s\r\n]*)/) + nginxConf.match(/(http\s*{[\s\r\n]*)/[0].length);
                let insertText = `include ${configFolder}/*`;
                let newConf = nginxConf.substring(0, insertPoint) + insertText + nginxConf.substring(insertPoint);
                fs.writeFile(configPath, newConf)
            }
            //重新加载Nginx
            shelljs.exec('service nginx reload');
            break;
        case 'apache':
            //修改httpd.conf
            let getVersion = shelljs.exec('httpd -V', { silent: true });
            let confPath;
            if (getVersion.code !== 0) {
                getVersion = shelljs.exec('apache2 -V', { silent: true })
            }
            if (getVersion.code !== 0) {
                console.error(getVersion)
                exit(130)
            } else {
                confPath = getVersion.match(/-D (HTTPD_ROOT|SERVER_CONFIG_FILE)=\"(.*)\"\n/i).join('/')
            }
            let apacheConf = await fs.readFile()
            break;
    }
}