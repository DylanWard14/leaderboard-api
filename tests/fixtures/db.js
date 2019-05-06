const jwt = require("jsonwebtoken");
const mongoose = require ('mongoose');
const User = require ('../../src/models/user');
const Game = require ('../../src/models/game');
const Score = require ('../../src/models/score');

const userOneID = new mongoose.Types.ObjectId();
const userOne = {
    _id: userOneID,
    name: 'Steve',
    username: 'BigSteve',
    email: 'steve@test.com',
    password: '1234',
    tokens: [{
        token: jwt.sign({_id: userOneID}, process.env.JWT_SECRET)
    }]
}

const setupDatabase = async () => {
    await User.deleteMany();
    await new User(userOne).save();
}

module.exports = {
    userOneID,
    userOne,
    setupDatabase
}