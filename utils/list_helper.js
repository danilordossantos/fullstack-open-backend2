const _ = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce((sum, blog) => {
        return sum + blog.likes
    }, 0)
}

const favoriteBlog = (blogs) => {
    if (blogs.length === 0) {
        return 0
    } return blogs.reduce((acc, blog) => {
        if (blog.likes >= acc.likes) {
            return blog
        } else {
            return acc
        }
    })
}

const mostBlogs = (blogs) => {
    if (blogs.length === 0) {
        return 0
    }
    const grouped = _.groupBy(blogs, 'author')
    const entries = Object.entries(grouped)
    const winner = _.maxBy(entries, elemento => elemento[1].length)
    return {
        author: winner[0],
        blogs: winner[1].length
    }
}

module.exports = { dummy, totalLikes, favoriteBlog, mostBlogs }