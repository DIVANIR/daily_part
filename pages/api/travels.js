import connect from "./connect"

const dailyPart = async (request, response) => {

    const recursive = ()=>{

    const getResult = async (sql) => {
        try {            

            const data = await connect(sql)
            console.log(data, sql)
            response.status(201).json({...data})


        } catch (error) {
            //console.log(error)
            response.status(400).json(error)
            //getResult(sql)
            recursive()
        }
    }

    
        if (request.method === "POST") {
            const { id_daily_part, line, startTime, startKM, origin, destiny, direction, startTicket = 0 } = JSON.parse(request.body)
            const sql = `INSERT INTO 
                            travels( 
                                id_daily_part, 
                                line, 
                                startTime,
                                startKM,
                                origin,
                                destiny,
                                direction,
                                startTicket
    
                            ) 
                            VALUES (
                                '${id_daily_part}', 
                                '${line}', 
                                '${startTime}',
                                '${startKM}',
                                '${origin}',
                                '${destiny}',
                                '${direction}',
                                '${startTicket}'
                            )`
            await getResult(sql)
    
    
        } else if (request.method === "PUT") {
            const { id, endTime, endKM, passenger, endTicket = 0 } = JSON.parse(request.body)
         
            const sql = `UPDATE travels  
                            SET endTime='${endTime}',
                            endKM=${parseInt(endKM)},
                            passenger=${parseInt(passenger)},
                            endTicket=${parseInt(endTicket)}
                        WHERE id = ${id}`
    
            try{
                await getResult(sql)
            }catch(erro){
                response.json(error)
                recursive()
            }
        }else if(request.method === "DELETE"){
            const { id } = JSON.parse(request.body)
            const sql = "DELETE FROM travels WHERE id  = " + id
            getResult(sql)
            recursive()
        }
    }

    recursive()
    
}


export default dailyPart
