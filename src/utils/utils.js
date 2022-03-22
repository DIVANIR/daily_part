const dateFormated = (date, brazil=true) => {
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    return brazil ?
     `${day <= 9 ? "0" + day : day}/${month <= 9 ? "0" + month : month}/${year}` :
     `${year}-${month <= 9 ? "0" + month : month}-${day <= 9 ? "0" + day : day}`
}

const filter = (dailyPart, filterDatas) =>  dailyPart.filter((item, index) => {
        
        return new Date(item.date).getTime() > filterDatas.timeCourse.start.getTime() &&
            new Date(item.date).getTime() < filterDatas.timeCourse.end.getTime() &&
            (filterDatas.client == ""|| item.client == filterDatas.client) &&
            (filterDatas.line == "" || item.travels.map(item => item.line).filter(item => item == filterDatas.line).length > 0)
    })

export {dateFormated, filter}