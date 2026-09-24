const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const config = require('./utils/config')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const path = require('path')

const app = express()

mongoose.connect(config.MONGODB_URI)
    .then(connection => {
        logger.info('connected to MongoDB')
    }).catch(error => {
        logger.error(error.message)
    })

app.use(cors())
app.use(express.static('dist'))
app.use(express.json())
app.use(middleware.tokenExtractor)
app.use('/api/blogs', middleware.userExtractor, blogsRouter)

app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

if (process.env.NODE_ENV === 'test') {
    const testingRouter = require('./controllers/testing')
    app.use('/api/testing', testingRouter)
}

const serveFrontend = (request, response, next) => {
    if (request.method === 'GET' && !request.path.startsWith('/api')) {
        response.sendFile(path.join(__dirname, 'dist', 'index.html'))
    } else {
        next()
    }
}
app.use(serveFrontend)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app