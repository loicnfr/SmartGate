import express from "express";
import {dbConnection} from "./config/db.js"
import router from "./routes/route.js";

const app = express()
const port = 8001

app.use(express.json())

app.get('/', (req, res)=> {
    res.send("Hello World!")
})

app.post("/add", router)
app.post("/admin", router)

app.listen(port , ()=> {
    console.log(`The server is running on port http://localhost:${port}`)
    dbConnection()
})