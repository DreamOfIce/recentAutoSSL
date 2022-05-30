//多语言化(其实就中文和英文)
//很明显不可能有歪果仁用这个程序,所以添加英语只是因为部分终端中文会乱码

//第一个参数为type.id格式;第二个参数为一个对象,传递文本中的变量
module.exports = (key, params) => {
    const message = {
        cn: {
            order: {
                checkStatus: `第${params.time}次检查证书申请状态...`,
                applicationComplete: '证书申请成功',
                wait: `验证未完成,等待${params.time}秒后再次尝试`,
                unknownType: `未知验证方式:${params.method}`
            },
            error: {
                1: '申请过程中订单被意外取消',
                2: '不支持的系统类型,请先手动关闭占用80端口的程序',
                3: '不受支持的web服务器,请手动停止该进程后重试',
                4: '请手动安装lsof命令,然后重试',
                5: 'API请求失败,请参见上方的错误信息,或前往https://www.racent.com/help/details/60',
                6: '20次尝试后验证仍未完成,取消申请',
                130: '用户取消,程序终止',
                255: '未知错误.你可以在 https://github.com/DreamOfIce/racentAutoSSL/issue 提交你的问题',
                cancel: '开始取消证书订单',
                exit: '取消完成,程序退出'
            }
        },
        en: {
            order: {
                checkStatus: `Check the application status for the ${params.time}th time`,
                applicationComplete: 'Certificate applications successful.',
                wait: `Verification is not complete. Wait ${params.time} seconds and try again`,
                unknownType: `unknown verify type:${params.method}`
            },
            error: {
                1: 'The order was cancelled during the application process',
                2: 'Unknown OS type,please stop the web server manually and try again.',
                3: 'Unknown web server,please stop the web server manually and try again.',
                4: 'This program require lsof,please install it manually.',
                5: 'API request failed, please refer to the error message above, or go to https://www.racent.com/help/details/60',
                6: 'The verification has not been completed after 20 attempts. Cancel the application',
                130: 'The program terminated because the user canceled',
                255: 'Unknown error,you can create an issue on https://github.com/DreamOfIce/racentAutoSSL/issue',
                cancel: 'Start cancel certificate order.',
                exit: 'order canceled,program exit.'
            }
        }
    }
    const type = key.split('.')[0];
    const id = key.split('.')[1];
    return message[config.lang][type][id];
}