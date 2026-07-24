const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const helper = require('./test_helper')
const { test, describe, before, after, beforeEach } = require('node:test')
const assert = require('node:assert')

beforeEach(async () => {
    await Blog.deleteMany({})
    let blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

describe('blogs get', () => {
    test('all blogs are returned', async () => {
        const response = await api.get('/api/blogs')

        assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })

    test('blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })
})

describe('blogs id', () => {
    test('unique identifier is named id', async () => {
        const response = await api.get('/api/blogs')
        const firstBlog = response.body[0]
        assert.notStrictEqual(firstBlog.id, undefined)
    })
})

describe('blogs post', () => {
    test('a new blog can be added', async () => {
        const newBlog = {
            title: "You Don't Know JS",
            author: "Kyle Simpson",
            url: "https://github.com/getify/You-Dont-Know-JS",
            likes: 25
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()

        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)
    })

    test('if likes property is missing it defaults to 0', async () => {
        const newBlog = {
            title: "JavaScript: The Good Parts",
            author: "Douglas Crockford",
            url: "https://www.oreilly.com/library/view/javascript-the-good/9780596517748/"
        }

        const response = await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        assert.strictEqual(response.body.likes, 0)
    })

    test('blog without title is not added', async () => {
        const blogWithoutTitle = {
            author: "Martin Fowler",
            url: "https://martinfowler.com",
            likes: 5
        }

        await api
            .post('/api/blogs')
            .send(blogWithoutTitle)
            .expect(400)
    })

    test('blog without url is not added', async () => {
        const blogWithoutUrl = {
            title: "Refactoring",
            author: "Martin Fowler",
            likes: 5
        }

        await api
            .post('/api/blogs')
            .send(blogWithoutUrl)
            .expect(400)
    })
})

describe('blog delete', () => {
    test('a blog can be deleted', async () => {
        const blogAtStart = await helper.blogsInDb()
        const blogToDelete = blogAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)

        const blogAtEnd = await helper.blogsInDb()

        const ids = blogAtEnd.map(n => n.id)
        assert(!ids.includes(blogToDelete.id))

        assert.strictEqual(blogAtEnd.length, helper.initialBlogs.length - 1)
    })
})

describe('blog update', () => {
    test('a blog can be updated', async () => {
        const blogAtStart = await helper.blogsInDb()
        const blogToUpdate = blogAtStart[0]
        const blogUpdated = {
            title: "Clean Code",
            author: "Robert C. Martin",
            url: "https://www.cleancodersblog.com",
            likes: 25
        }

        const response = await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send(blogUpdated)
            .expect(200).expect('Content-Type', /application\/json/)

        assert.strictEqual(response.body.likes, 25)
    })
})

after(async () => {
    await mongoose.connection.close()
})