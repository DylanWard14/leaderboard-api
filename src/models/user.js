const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        validate(value) {
            if(!validator.isEmail(value))
            {
                throw new Error("Please enter a valid email address");
            }
        }
    },
    password: {
        type: String,
        required: true
    },
    games: [{
        game: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Game'
        }
    }],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});

    if(!user)
    {
        throw new Error("Invalid username or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
    {
        throw new Error("Invalid username or password");
    }

    return user;
}

userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password'))
    {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;