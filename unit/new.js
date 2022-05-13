import { post } from 'axios';
import dnsVerify from './dnsverify';
import fileVerify from './httpverify';

//订购证书
async function newCertificate(token, domains, verifyType) {
    const rep = await post("https://portal.racent.com/ssl/place", {
        api_token: token,
        productCode: (domains.toString.includes('@')) ? 'sectigo-multi-domain-wildcard-free-trial' : (domains.length > 1 ? 'sectigo-multi-free-trial' : 'sectigo-free-trial'),
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
async function getVerifyValue(token, id, verifyType) {
    const rep = await post("https://portal.racent.com/ssl/collect", {
        api_token: token,
        certId: id
    });
    if (rep.status = "CANCELLED") {
        console.warn("订单已取消,尝试重新创建");
        process.exit(1);
    }
    switch (verifyType) {
        case "dns":
            return {
                name: rep.DCVdnsHost,
                value: rep.DCVdnsValue
            };
        case "file":
            return {
                name: rep.DCVfileName,
                value: rep.DCVfileContent
            };
        default: return {
            error: 'Invalid verify type'
        };
    }
}

export default async (token, domains, verifyType) => {
    //订购证书
    const certId = await newCertificate(token, domains, verifyType);
    //进行所有权验证
    const verifyInfo = await getVerifyValue(token, certId, verifyType);
    if (verifyType == 'dns') {
        dnsVerify(domains,verifyInfo.name, verifyInfo.value);
    } else if (verifyType == 'file') {
        fileVerify(domains,verifyInfo.name, verifyInfo.value);
    }
    for (var i = 0; i < 20; i++) {
        process.stdout.write(`第${i}次检查证书申请状态...`)
        let status = await post("https://portal.racent.com/ssl/collect", {
            api_token: token,
            certId: certId
        }).status;
        switch (status) {
            case 'COMPLETE':
                console.log("证书申请成功!");
                break;
            case 'PENDING':
                console.log(`验证未完成,等待${sleepTime}秒后再次尝试`);
            case 'CANCELLED':
                console.warn("订单被取消,尝试重新创建");
                break;
            default:
                console.error("未知订单状态,申请失败!");
        }
    }
}
