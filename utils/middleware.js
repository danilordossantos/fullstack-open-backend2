const User = require('../models/user')
const jwt = require('jsonwebtoken')

const unknownEndpoint = ((request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
})

const tokenExtractor = (request, response, next) => {
    const authorization = request.get('authorization')
    if (authorization && authorization.startsWith('Bearer ')) {
        request.token = authorization.replace('Bearer ', '')
    }
    next()
}

const userExtractor = async (request, response, next) => {
    if (request.token) {
        const decodedToken = jwt.verify(request.token, process.env.SECRET)
        request.user = await User.findById(decodedToken.id)
    }
    next()
}

const userValidator = (request, response, next) => {
    if (!request.user) {
        return response.status(401).json({ error: 'invalid token' })
    }
    next()
}

const errorHandler = ((error, request, response, next) => {
    console.log(error.message)
    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).send({ error: error.message })
    } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
        return response.status(400).send({ error: 'expected `username` to be unique' })
    } else if (error.name === 'JsonWebTokenError') {
        return response.status(401).json({ error: 'invalid token' })
    } else if (error.name === 'TokenExpiredError') {
        return response.status(401).json({ error: 'token expired' })
    } else {
        next(error)
    }
})

module.exports = { unknownEndpoint, tokenExtractor, userExtractor, userValidator, errorHandler }