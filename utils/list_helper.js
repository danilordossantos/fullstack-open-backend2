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

module.exports = { dummy, totalLikes, favoriteBlog }