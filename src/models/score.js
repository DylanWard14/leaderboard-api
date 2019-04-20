const mongoose = require('mongoose')

const scoreSchema = new mongoose.Schema({
    score: {
        type: Number,
        require: true
    },
    owner: {
        type: String,
        required: true
    },
    game: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    date: {
        type: Date,
        required: true
    }
})

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score;