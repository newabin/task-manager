const express = require('express')
require('./db/mongoose')

const UserRouter = require('./router/user')
const TaskRouter = require('./router/task')

const app = express()
const port = process.env.PORT

//for maintenence
// app.use((req,res,next)=>{
//     res.status(503).send('Site is currently down. Check back soon.')
// })



app.use(express.json())
app.use(UserRouter)
app.use(TaskRouter)

app.listen(port, ()=>{
    console.log('Listing at port number'+ port)
})

