

const dateFormated = (date, brazil=true) => {
    date.setUTCHours(3)
    const day = (date.getDate()).toString().padStart(2,"0")
    const month = (date.getMonth() + 1).toString().padStart(2,"0")
    const year = date.getFullYear()    
    
    return brazil ? date.toLocaleDateString() : `${year}-${month}-${day}`
}

const timeFormated = (time, ) => {
    
    try{
        const timeString = time.toString().substr(11,5)
        return timeString != "00:00" ? timeString : ""
    }catch(erro){
        return ""
    }
}

const filter = (dailyPart, filterDatas) =>  dailyPart.filter((item, index) => {
        
        return new Date(item.date).getTime() > filterDatas.timeCourse.start.getTime() &&
            new Date(item.date).getTime() < filterDatas.timeCourse.end.getTime() &&
            (filterDatas.client == ""|| item.client == filterDatas.client) &&
            (filterDatas.line == "" || item.travels.map(item => item.line).filter(item => item == filterDatas.line).length > 0)
    })


const exportCsv = (data)=>{
    
    
    const csvContent = "DATA;LINHA;ORIGEM;DESTINO;HORA INICIO;HORA FIM;PASSAGEIRO;KM INICIO;KM FIM; TOTAL KM; CARRO;MATRICULA;MOTORISTA;CLIENTE\n"
        + data.map(dailyPart=>{
        return dailyPart.travels./*filter(travel=>travel.line!="DESLOCAMENTO OCIOSO").*/map((travel,index, array)=>{
            /*let line = ""
            if(travel.line == "DESLOCAMENTO OCIOSO"){

            }
                ? index == 0 && index < array.length - 1 ? line = array[1].line : 
                : ""*/
            
        
            const date = travel.startTime.toString().substr(0,10)
            const startTime = travel.startTime.toString().substr(11,5)
            const endTime = travel.endTime.toString().substr(11,5)
            return `${date};${travel.line};${travel.origin};${travel.destiny};${startTime};${endTime};${travel.passenger};${travel.startKM};${travel.endKM};${travel.endKM-travel.startKM};${dailyPart.car.number};${dailyPart.driver.registration};${dailyPart.driver.name};${dailyPart.client}\n`
        }).join("")
    }).join("")
       
        const blob = new Blob([csvContent], { type: "csv" })
        const a = document.createElement('a')
        a.download = "Parte diaria.csv"
        a.href = window.URL.createObjectURL(blob)
        const clickEvt = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
        })
        a.dispatchEvent(clickEvt)
        a.remove()
      
      
    
}

const unproductiveKm = ()=>({
    name:"DESLOCAMENTO OCIOSO",
    direction:[
        "INICIO DE ROTA",
        "FIM DE ROTA",
        "CASA",
        'GARAGEM',
        "UNIDADE VALE",
        "GAR BRUMADINHO",
        "GAR CONTAGEM",
        "GAR ITABIRITO",
        "GAR SARZEDO",
        "GAR NOVA LIMA",
        "UNIDADE PARDINI",
        "UNIDADE FIAT",
        "UNIDADE VALLOUREC"
    ]
})

export {dateFormated, timeFormated, filter, unproductiveKm, exportCsv}

