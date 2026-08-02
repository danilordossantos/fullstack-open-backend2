const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
    {
        title: "Clean Code",
        author: "Robert C. Martin",
        url: "https://www.cleancodersblog.com",
        likes: 15
    },
    {
        title: "The Pragmatic Programmer",
        author: "David Thomas",
        url: "https://pragprog.com/blog",
        likes: 8
    }
]

const initialUsers = [
    {
        username: 'root',
        name: 'Superuser',
        password: 'sekret'
    }
]

const nonExistingId = async () => {
    const blog = new Blog({ title: 'willremovethissoon' })
    await blog.save()
    await blog.deleteOne()

    return blog.id
}

const blogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map((blog) => blog.toJSON())
}

const usersInDb = async () => {
    const users = await User.find({})
    return users.map((user) => user.toJSON())
}

module.exports = { initialBlogs, initialUsers, nonExistingId, blogsInDb, usersInDb }