const express = require('express')

const app = express()

const routes = require('./routes')

// Vai receber o body no estipo json
app.use(express.json())
app.use(routes)

// Not found
app.use((req, res, next) => {
    const error = new Error('Not found')
    error.status = 404
    next(error)
})

// Captura de todos os erros
app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({ error: error.message})
})

app.listen(3333, () => console.log('Server is running') )