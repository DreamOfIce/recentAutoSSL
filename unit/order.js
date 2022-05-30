const axios = require('axios');
const dnsVerify = require('./dnsverify');
const fileVerify = require('./httpverify');
const getText = require('./i18n');
const exit = require('./exit');

//Public functions
modules.export = async (token, domains, verifyType) => {
    //订购证书
    const certId = await newCertificate(token, domains, verifyType);
    //进行所有权验证
    const verifyInfo = await getVerifyValue(token, certId);
    for (const domain of verifyInfo) {
        if (domain.type === 'dns') {
            dnsVerify(domain);
        } else if (domain.type === 'http') {
            fileVerify(domain);
        }
    }
    //检查验证状态
    for (var i = 1; i <= 20; i++) {
        process.stdout.write(getText('order.checkStatus', { time: i }))
        let status = await axios.post("https://portal.racent.com/ssl/collect", {
            api_token: token,
            certId: certId
        }).status;
        switch (status) {
            case 'COMPLETE':
                console.log(getText('order.applicationComplete'));
                //直接退出函数
                i = 21;
                break;
            case 'PENDING':
                if (i < 20) {
                    let sleepTime = i * 15;
                    console.log(getText('order.wait', { time: sleepTime }));
                    await new Promise(resolve => setTimeout(resolve, sleepTime));
                } else {
                    exit(6);
                }
                break;
            default:
                exit(1);
        }
    }
    //下载并保存证书

}

//Private functions

//订购证书
const newCertificate = async (token, domains, verifyType, sslTrust) => {
    const rep = await axios.post("https://portal.racent.com/ssl/place", {
        api_token: token,
        productCode: (domains.toString.includes('@')) ? 'sectigo-multi-domain-wildcard-free-trial' : (domains.length > 1 ? 'sectigo-multi-free-trial' : sslTrust ? 'ssltrus-free-trial' : 'sectigo-free-trial'),
        years: 1,
        params: JSON.stringify({
            server: "other",
            domainInfo: domains.map(domain => { return { dcvMethod: verifyType, domainName: domain }; }),
            Administrator: {
                "job": "Master",
                "city": "privacy",
                "email": email,
                "state": "privacy",
                "mobile": "privacy",
                "address": "privacy",
                "country": "CN",
                "lastName": "Racent",
                "postCode": "privacy",
                "firstName": "AutoSSL",
                "organation": "Public Organization"
            }
        })
    });
    if (rep.code != 1) {
        console.error(`Message: ${rep.errors}.Code: ${rep.code}`);
        exit(5);
    }
    return rep.certId;
}

//获取验证值
const getVerifyValue = async (token, id) => {
    const rep = await axios.post("https://portal.racent.com/ssl/collect", {
        api_token: token,
        certId: id
    });
    if (rep.status == "CANCELLED") {
        exit(1);
    }
    let domainList = new Array();
    for (let domain of rep.dcvList) {
        switch (domain.dcvMethod) {
            case "dns":
                domainList.push({
                    type: "dns",
                    domain: domain.domainName,
                    name: rep.DCVdnsHost,
                    value: rep.DCVdnsValue
                });
                break;
            case "file":
                domainList.push({
                    type: "http",
                    domain: domain.domainName,
                    name: rep.DCVfileName,
                    value: rep.DCVfileContent
                });
                break
            default:
                console.warn(getText('order.unknownType'), { method: rep.dcvMethod });
        }
    }
    return domainList;
}

