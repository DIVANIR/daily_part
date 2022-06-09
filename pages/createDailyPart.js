import { useState, Component } from "react"
import employees from "../src/data/employees.json"
import cars from "../src/data/cars.json"
import clients from "../src/data/clients.json"
import Table from "../src/components/Table"
import { dateFormated, unproductiveKm } from "../src/utils/utils"
import Abastecimento from "./fuelAdd"
import Info from "../src/components/info"
import UpdateAddress from "../src/components/info/updateAddress.js"
import listDer from "../src/data/listDer"
import axios from "axios"
import Load from "../src/components/Load"


let actualDate = new Date()


const urlDate = "https://worldtimeapi.org/api/timezone/America/Sao_Paulo"

axios.get(urlDate)
    .then(resp=>{
        actualDate = new Date(resp.data.datetime)
    })


let valueInserted
let timeout


const CreateDailyPart = (props) => {

    const [hiddenLoad, sethIddenLoad] = useState(true)
    
    const company = props.company || "RN"
    const isUrban = company === "TM"

    const [addFuel, setAddFuel] = useState(false)
    const [error, setError] = useState({ msg: "", type: "" })
    const [state, setState] = useState({
        label: "",
        close: "close",
        value: "",
        list: [],
        type: "text",
        dailyPart: {
            car: { number: '', plate: '' },
            client: "",
            date: dateFormated(actualDate, false),
            driver: {
                name: "",
                registration: null
            },
            id: null,
            travels: [
            ]
        }
    })

    const closeMadal = () => {
        state.close = "close"
        setState({ ...state })
    }

    const inputValue = async (event) => {
        const isComputer = window. screen. width >= 1200
        
        if(isComputer && !state.dailyPart.date){
                state.label = <>Informe a <b>DATA</b></>
                state.type = "date"
                state.list = []
                setState({ ...state })
                state.dailyPart.date = await getData()
        }

        
        const shouldDelete = event.target.className == "delete"
            || event.target.parentElement.parentElement.className == "delete"

        if(shouldDelete){
            const idDelete = event.target.dataset["js"]
            || event.target.parentElement.parentElement.dataset["js"]
            const travel = state.dailyPart.travels.filter(travel=>travel.id == idDelete)[0]
            const indexTravel = state.dailyPart.travels.indexOf(travel)
          
            const responseUse = confirm(`Tem certeza que deseja apagar a viagem de ${travel.startTime}?`)
            if(responseUse){
                sethIddenLoad(false)
                try {                                   
                    const response = await fetch(
                        "api/travels",
                        {
                            method: "DELETE",
                            body: JSON.stringify({id:idDelete})
                        }
                    )
                    const result = await response.json()
                    if(result.affectedRows){
                        if(!travel.endKM){
                        localStorage.removeItem("dailyPart")
                        }
                        state.dailyPart.travels.splice(indexTravel, 1);
                        setState({ ...state })
                        console.log(state)
                    }else{
                        alert("Erro ao deletar viagem. Tente novamente.")
                    }
                } catch (error) {
                        
                }
                sethIddenLoad(true)
            }
            return
        }

        
        const dailyPartImcompleted = localStorage.getItem("dailyPart")
        if (dailyPartImcompleted) {
            state.dailyPart = JSON.parse(dailyPartImcompleted)
        }

        state.closable = true

        if (!state.dailyPart.driver.registration) {
            const list = employees.map(item => item.registration)
            state.label = <>Qual é sua <b>MATRÍCULA</b>?</>
            state.min = 0
            state.max = 10
            state.list = []
            state.type = "number"
            setState({ ...state })

            const registration = await getData(list, "Matrícula não encontrada.")
            
            state.dailyPart.driver = {
                registration,
                name: employees[list.indexOf(registration)].name
            }

        }

        if (!state.dailyPart.car.number) {
            const list = cars.map(item => item.number)

            state.label = <>Qual o número do <b>CARRO</b>?</>
            state.list = list
            state.type = "number"
            setState({ ...state })
            const carNumber = await getData(list, "Carro não encontrado")

            state.dailyPart.car = {
                number: carNumber,
                plate: cars[list.indexOf(carNumber)].plate
            }



            const plate = state.dailyPart.car.plate

            const registration = state.dailyPart.driver.registration
            await getDailyPart(plate, registration)

        }


        if (!state.dailyPart.client) {
            const list = clients.map(item => item.name)

            if (!isUrban) {
                state.label = <>Qual a empresa <b>CLIENTE</b>?</>
                state.list = list
                state.type = "text"
                setState({ ...state })
                const client = await getData(list, "Cliente não encontrado")
                state.dailyPart.client = client
            } else {
                state.dailyPart.client = "urbano"
                state.dailyPart.company = "TM"
                
            }
            
            await saveDailyPart()
            return
        }



        const countTravels = state.dailyPart.travels.length
        const actualtravel = state.dailyPart.travels[countTravels - 1]
        if(actualtravel){
            if (!actualtravel.destiny || actualtravel.endKM) {
                addTravel()
            } else {
               
                if(state.dailyPart.client == "VALE VIGA"){
                    //setAddFuel(true)
                }

                const minTime = actualtravel.startTime
                const maxTime = new Date(minTime)
                maxTime.setHours(maxTime.getHours() + 13)

                state.label = <>A viagem terminou que <b>HORAS</b>?</>
                state.type = "datetime-local"
                state.min = minTime
                state.max = maxTime.toISOString().substring(0, 16)
                state.list = []
                setState({ ...state })
                const endTime = await getData()

                state.label = <>A viagem terminou com qual <b>KM</b>?</>
                state.type = "number"
                /*const listKM = []
                if(actualtravel.line == "DESLOCAMENTO OCIOSO"){
                    for(let i = 1; i <=50 ;i++){
                        listKM.push((actualtravel.startKM + i).toString())
                    }
                }*/
                
                state.list = []
                setState({ ...state })
                const endKM = /*listKM.length > 0
                    ? parseInt(await getData(listKM, "KM muito grande ou muito pequeno para deslocameno ocioso."))
                    :*/ parseInt(await getData(null, "Verifique se o KM está correto.", true))

                let endTicket = 0
                if (isUrban) {
                    state.label = <>Qual a <b>roleta</b> final?</>
                    state.type = "number"
                    state.list = []
                    endTicket = parseInt(await getData())
                }

                state.label = <>Quantos <b>passageiros</b> embarcaram?</>
                state.min = 0
                state.max = 59
                state.type = "number"



                const timeTravel = `${endTime}:00`
                setState({ ...state })

                let passenger = 0

                if(actualtravel.line != "DESLOCAMENTO OCIOSO"){

                    const listPassenger = []

                    for(let i = 0; i<50;i++){
                        listPassenger.push(i.toString())
                    }

                    state.list = []//listPassenger
                    setState({ ...state })
                    passenger = isUrban 
                        ? endTicket - actualtravel.startTicket 
                        : parseInt(await getData(listPassenger, "Quantidade muito grande de passageiro"))

                }           
                
                

                const travel = {
                    ...actualtravel,
                    id_daily_part : state.dailyPart.id,
                    endTime: timeTravel,
                    endKM,
                    passenger: passenger,
                    endTicket
                }



                saveTravel(travel)
            }
        }else{
            addTravel()
        }
    }

    const saveDailyPart = async ()=>{
        sethIddenLoad(false)
        try {
            const response = await fetch(
                "api/dailyPart",
                {
                    method: "POST",
                    body: JSON.stringify(state.dailyPart)
                }
            )

            if(response.status != 201){
                saveDailyPart()
                return
            }
            const result = await response.json()
            console.log(result)
            state.dailyPart.id = result.insertId
            setState({ ...state })
            addTravel()            
            sethIddenLoad(true)
        } catch (erro) {
            console.log(erro.message)
            //location.reload(true)
            saveDailyPart()
        }
    }

    const getDailyPart = async (plate, registration) => {
        sethIddenLoad(false)
        try {
            const response = await fetch(`api/dailyPart?start=${dateFormated(actualDate, false)}&end=${dateFormated(actualDate, false)}&plate=${plate}&registration=${registration}&company=${company}`)

            const dailyPart = await response.json()
            if (dailyPart.length) {
                state.dailyPart = dailyPart[dailyPart.length-1]
                setState({ ...state })
            }
        } catch (erro) {
            console.log(erro.message)
            //location.reload(true)
            await getDailyPart(plate, registration)
        }
        sethIddenLoad(true)
    }

    const saveTravel = async (travel, shoulTryAgain = true) => {
        sethIddenLoad(false)
        try {
            const response = await fetch(
                "api/travels",
                {
                    method: "POST",
                    body: JSON.stringify(travel)
                }
            )
            
            const result = await response.json()
            /*if(response.status != 201){
                saveTravel(travel)
                return
            }*/
            travel.id = result.insertId
            
            state.dailyPart.travels[state.dailyPart.travels.length - 1] = travel
            setState({ ...state })

            const date = parseInt(JSON.parse(localStorage.getItem("dailyPart")).date.toString().substr(8,2))
            const today = new Date().getDate()

            localStorage.removeItem("dailyPart")
           
            console.log("Date: " + date , "Today: "+today)
            alert("Viagem gravada com sucesso!")
            
            if(date != today){
                const resp = confirm("Terminou a parte diaria do dia "+dailyPart.date+"? se clicar em OK vamos limpar esssa parte diaria, se ainda tem mais viagem pra lançar clica em cancelar")
                if(resp){
                    location.reload()
                }
            }
            
        } catch (erro) {
            console.log(erro.message)
            //location.reload(true)
            //if(shoulTryAgain){
               saveTravel(travel,false)
            //}
        }
        sethIddenLoad(true)
    }

    const addTravel = async () => {

        state.closable = true

        const listClients = clients.map(item => item.name)
        const lines = [{name:"EXTRA",direction:[]},unproductiveKm(), ...clients[listClients.indexOf(
            isUrban ? "urbano" : state.dailyPart.client
        )].lines]
        const list = lines.map(item => item.name)
            
        state.label = <>Qual é a <b>LINHA</b>?</>
        state.list = list
        state.type = "text"
        const line = await getData(list, "Linha não encontrada")

        const endRangeTime = new Date()
        endRangeTime.setMinutes(endRangeTime.getMinutes()+20)
        //endRangeTime.setUTCHours(-3)
        endRangeTime.setHours(endRangeTime.getHours() - 3)
        
        const numberdaysRetroactive = window. screen. width >= 1200
            ? 45 : 2

        const startRangeTime = new Date()
        startRangeTime.setHours(startRangeTime.getHours() - 3)
        startRangeTime.setDate(startRangeTime.getDate() - numberdaysRetroactive)

        state.min = startRangeTime.toISOString().substring(0, 16)
        state.max = endRangeTime.toISOString().substring(0, 16)
        state.closable = false
        state.label = <>A viagem começou que <b>HORAS</b>?</>
        state.type = "datetime-local"
        state.list = []

        const startTime = await getData()

        
        state.label = <>A viagem começou com qual <b>KM</b>?</>
        state.type = "number"
        state.list = []
        const msg = "Verifique se o KM está correto."
        const startKM = parseInt(await getData(null, msg, true))

        const direction = [...lines.filter(item => item.name == line)[0].direction]


        state.label = <>De onde sai a viagem?<b>(PONTO INICIAL)</b></>
        state.type = "text"
        state.list = direction
        console.log(state.list)
        const origin = direction.length == 1
            ? direction[0]
            : await getData(state.list.length ? state.list : null, "Origem nao encontrada!")

        const destinys = [...direction.filter(item => item != origin)]

        state.label = <>Para onde vai a viagem?<b>(PONTO FINAL)</b></>
        state.list = destinys
        const destiny = destinys.length > 1 || destinys.length == 0
            ? await getData(destinys.length ? destinys:null, "Destino nao encontrado!")
            : destinys[0]
            || direction[0]

        let startTicket = 0

        if (isUrban) {
            state.label = <>Qual a <b>roleta</b> inicial?</>
            state.type = "number"
            state.list = []
            startTicket = state.dailyPart.travels.length 
                ? state.dailyPart.travels[state.dailyPart.travels.length-1].endTicket
                :  parseInt(await getData())
                || parseInt(await getData())
        }


        const timeTravel = `${startTime}:00`
        if (!state.dailyPart.travels.length){
            const [year,month, day] = timeTravel.substring(0, 10).split("-")
            state.dailyPart.date = timeTravel.substring(0, 10)          
            onChangeObs()
        }

        const travel = {
            id_daily_part: state.dailyPart.id,
            line,
            startKM,
            startTime: timeTravel,
            destiny,
            origin,
            endKM: null,
            startTicket
        }

        saveLocalTraveal(travel)
        console.log(state.dailyPart.travels)

    }

    const saveLocalTraveal = async (travel) => {
        try {
           /* const response = await fetch(
                "api/travels",
                {
                    method: "POST",
                    body: JSON.stringify(travel)
                }
            )

            const result = await response.json()*/
            travel.id = Math.random()//result.insertId
            state.dailyPart.travels.push(travel)
            setState({ ...state })
            localStorage.setItem("dailyPart", JSON.stringify(state.dailyPart))
        } catch (erro) {
            alert("Houve um erro ao enviar a parte diaria: "+erro.message)
            //location.reload(true)
            //saveLocalTraveal(travel)
        }
    }

    const getData = (list = null, msgError = "", shouldCheckKM = false) =>
        new Promise((resolve, reject) => {
            const checkKM = (km) => {
                const countTravels = state.dailyPart.travels.length
                if (countTravels === 0) {
                    return km > 0//TEMP buscar km dia anterior ou algo parecido
                }

                //const travel = state.dailyPart.travels[countTravels - 1]

                //const halfDistance = Math.floor(distance/2)
                const minimumDistance = 0//distance - halfDistance
                const maximumDistance = 300//distance + halfDistance
                const previousKM = state.dailyPart.travels[countTravels - 1].endKM ||
                    state.dailyPart.travels[countTravels - 1].startKM

                console.log(previousKM)
                return km >= (previousKM + minimumDistance) &&
                    km <= (previousKM + maximumDistance)
            }
            state.close = ""
            state.value = ""
            setState({ ...state })
            const interval = setInterval(() => {
                //console.log(valueInserted)
                if (valueInserted) {
                    if (!list || list.includes(valueInserted)) {
                        if (shouldCheckKM && !checkKM(valueInserted)) {
                            error.msg = msgError
                            error.type = "error"
                        } else {
                            clearInterval(interval)
                            resolve(valueInserted)
                            valueInserted = null
                            closeMadal()
                            error.msg = ""
                            error.type = ""
                        }
                        setError({ ...error })
                    } else {
                        error.msg = msgError
                        error.type = "error"
                        setError({ ...error })
                    }
                } else if (state.close === "close") {
                    clearInterval(interval)
                    //reject(valueInserted)
                }
            }, 1500)
        })

    const onclickOK = () => {
        valueInserted = state.value
    }

    const onChangeInput = (event) => {
        state.value = event.target.value
        setState({ ...state })
    }

    const onChangeObs = (event) => {
        const callback = () => {
            try {
                fetch("api/dailyPart",
                    {
                        method: "PUT",
                        body: JSON.stringify(state.dailyPart)
                    }
                )

            } catch (e) {
                console.log(e)
            }

        }
        if(event){
            state.dailyPart.obs = event.target.value
        }
        

        setState({ ...state })
        clearTimeout(timeout)
        timeout = setTimeout(callback, 1000);
    }

    // inputValue()

    if(listDer.includes(state.dailyPart.driver.registration)){
        state.hasPending = true
    }

    
 
    return <>
        <main>
            <div className="info">TOQUE NA PARTE DIÁRIA PARA PREENCHE-LA</div>
            <Table  onClick={inputValue} dailyPart={state.dailyPart} company={company} edit={true}/>
            <textarea
                placeholder="Descreva aqui observações sobre a viagem"
                onChange={onChangeObs}
                value={state.dailyPart.obs || ""} />
            <UpdateAddress/>
            {state.hasPending &&
                <Info name={state.dailyPart.driver.name}/>
            }

            

        </main>

        <Load hidden={hiddenLoad}/>

        <div className={`modal ${state.close}`}>
            <div className="content-modal">
                {state.closable ? <span className="close"
                    onClick={closeMadal}>x</span> : ""}
                <label>{state.label}</label>

                <input

                    type={state.type}
                    placeholder="Toque aqui para digitar"
                    list="list"
                    onChange={onChangeInput}
                    value={state.value}
                    min={state.min}
                    max={state.max}
                    autoFocus
                />
                <datalist id="list">
                    {
                        state.list.map((item, index) =>
                            <option key={index}>{item}</option>)
                    }
                </datalist>
                <span className={`inconsistency ${error.type}`}>
                    {error.msg}
                </span>
                <button onClick={onclickOK}>OK</button>
            </div>
            <div>
                {addFuel && <Abastecimento 
                    CARRO={state.dailyPart.car.number}
                    DATA={state.dailyPart.date}
                    ODOMETRO={state.dailyPart.travels[state.dailyPart.travels.length-1].startKM}
                />}
            </div>
            
        </div>
        
    </>
}


export default CreateDailyPart
