const blogsRouter = require('express').Router()
const Blog = require('../models/blog.js')
const User = require('../models/user.js')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
    request.body.likes = request.body.likes || 0
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!decodedToken.id) {
        return response.status(401).json({error: 'invalid token'})
    }
    const user = await User.findById(decodedToken.id)
    const blog = new Blog({
        ...request.body,
        user: user._id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
    request.body.likes = request.body.likes || 0

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, request.body, { returnDocument: 'after' })
    response.status(200).json(updatedBlog)
})

module.exports = blogsRouter