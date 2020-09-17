const express = require('express')
const routes = require('./routes')
const bodyParser = require('body-parser')

const app = express()

// Vai receber o body no estipo json
// app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.json())
app.use(routes)

// configurar os arquivos estáticos
.use(express.static("public"))

const nunjucks = require('nunjucks')    
nunjucks.configure('src/view', {
    autoescape: true,
    express: app,
    noCache: true
});


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

app.listen(2903, () => console.log('Server is running') )
