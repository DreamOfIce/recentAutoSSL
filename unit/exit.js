modules.exports = async (code) => {
    const errorMsg = {
        1: 'The order was cancelled during the application process',
        2: 'Unknown OS type,please stop the web server manually and try again.',
        3: 'Unknown web server,please stop the web server manually and try again.',
        4: 'This program require lsof,please install it manually.',
        130: 'Program exit by user canceled',
        255: 'Unknown error,you can create an issue on https://github.com/DreamOfIce/racentAutoSSL/issue'
    }
    console.error(errorMsg[code]);
    if (code !== 1) {
        console.log('Start cancel certificate order.');
        await axios.post('https://portal.racent.com/ssl/cancel', {
            api_token: apiToken,
            certId: certId,
            reason: code == 130 ? '用户取消' : '申请过程中遇到问题' + 'by AutoSSL'
        })
        console.log('issue canceled,program exit');
    }
    process.exit(code);
}