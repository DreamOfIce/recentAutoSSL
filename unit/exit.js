const axios = require('axios');
const getText = require('./i18n');

modules.exports = async (code) => {
    console.error(getLang(`error.${code}`));
    if (code !== 1) {
        console.log(getLang('error.cancel'));
        await axios.post('https://portal.racent.com/ssl/cancel', {
            api_token: config.token,
            certId: certId,
            reason: code == (130 ? '用户取消' : '申请过程中遇到问题') + '(RacentAutoSSL)'
        })
        console.log(getLang('error.exit'));
    }
    process.exit(code);
}