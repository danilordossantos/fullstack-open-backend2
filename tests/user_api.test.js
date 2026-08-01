const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const User = require('../models/user')
const helper = require('./test_helper')
const { test, describe, before, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const bcrypt = require('bcrypt')

beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })
    await user.save()
})

describe('users get', () => {
    test('all users are returned', async () => {
        const response = await api.get('/api/users')

        assert.strictEqual(response.body.length, helper.initialUsers.length)
    })
})

describe('users post', () => {
    test('a new user can be added', async () => {
        const newUser = {
            username: 'abranches',
            name: 'Danilo Abranches',
            password: 'password123'
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()

        assert.strictEqual(usersAtEnd.length, helper.initialUsers.length + 1)
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
        const userWithDuplicateUsername = {
            username: 'root',
            name: 'Danilo Abranches',
            password: 'password123'
        }

        await api
            .post('/api/users')
            .send(userWithDuplicateUsername)
            .expect(400)
    })

    test('creation fails with proper statuscode and message if username is too short', async () => {
        const userWithTooShortUsername = {
            username: 'ab',
            name: 'Danilo Abranches',
            password: 'password123'
        }

        await api
            .post('/api/users')
            .send(userWithTooShortUsername)
            .expect(400)
    })

    test('creation fails with proper statuscode and message if password is too short', async () => {
        const userWithTooShortPassword = {
            username: 'abranches',
            name: 'Danilo Abranches',
            password: 'pa'
        }

        await api
            .post('/api/users')
            .send(userWithTooShortPassword)
            .expect(400)
    })
})

after(async () => {
    await mongoose.connection.close()
})