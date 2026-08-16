const blogsRouter = require('express').Router()
const Blog = require('../models/blog.js')
const { userValidator } = require('../utils/middleware.js')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.post('/', userValidator, async (request, response) => {
    request.body.likes = request.body.likes || 0
    const user = request.user
    const blog = new Blog({
        ...request.body,
        user: user._id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', userValidator, async (request, response) => {
    const blog = await Blog.findById(request.params.id)
    if (!blog) {
        return response.status(404).end()
    }
    if (!blog.user) {
        return response.status(403).end()
    }
    if (blog.user.toString() === request.user.id) {
        await Blog.findByIdAndDelete(request.params.id)
        response.status(204).end()
    } else {
        return response.status(403).end()
    }
})

blogsRouter.put('/:id', userValidator, async (request, response) => {
    request.body.likes = request.body.likes || 0

    const blog = await Blog.findById(request.params.id)
    if (!blog) {
        return response.status(404).end()
    }
    if (!blog.user) {
        return response.status(403).end()
    }
    if (blog.user.toString() !== request.user.id) {
        return response.status(403).end()
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, request.body, { returnDocument: 'after' }).populate('user', { username: 1, name: 1 })
    response.status(200).json(updatedBlog)
})

module.exports = blogsRouter