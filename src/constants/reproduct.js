exports.repoStatus = () => {
    return [
        { id: 1, label: 'กำลังสืบพันธุ์' },
        { id: 2, label: 'ตั้งครรภ์' },
        { id: 3, label: 'คลอดลูกแล้ว' },
        { id: 4, label: 'สืบพันธุ์ไม่สำเร็จ' }
    ]
}

exports.repoResult = () => {
    return [
        { id: 1, label: 'ผิดปกติ' },
        { id: 2, label: 'ปกติ' },
    ]
}

