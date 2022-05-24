const axios = require('axios');
const dnsVerify = require('./dnsverify');
const fileVerify = require('./httpverify');

//订购证书
async function newCertificate(token, domains, verifyType, sslTrust) {
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
        console.error(`订购证书失败,因为:${rep.errors}错误码:${rep.code}`);
        process.exit(rep.code);
    }
    return rep.certId;
}

//获取验证值
async function getVerifyValue(token, id) {
    const rep = await axios.post("https://portal.racent.com/ssl/collect", {
        api_token: token,
        certId: id
    });
    if (rep.status == "CANCELLED") {
        console.warn("订单已取消,申请失败");
        process.exit(1);
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
                console.warn(`unknown verify type:${domain.dcvMethod}`);
        }
    }
    return domainList;
}

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
        process.stdout.write(`第${i}次检查证书申请状态...`)
        let status = await axios.post("https://portal.racent.com/ssl/collect", {
            api_token: token,
            certId: certId
        }).status;
        switch (status) {
            case 'COMPLETE':
                console.log("证书申请成功!");
                //直接退出函数
                i = 21;
                break;
            case 'PENDING':
                if (i < 20) {
                    let sleepTime = i * 15;
                    console.log(`验证未完成,等待${sleepTime}秒后再次尝试`);
                    await new Promise(resolve => setTimeout(resolve, sleepTime));
                } else {
                    console.error("20次尝试验证失败,程序退出!");
                    process.exit(2);
                }
                break;
            default:
                console.error("订单被取消或出错,申请失败!");
                process.exit(1);
        }
    }
    //下载并保存证书

}
