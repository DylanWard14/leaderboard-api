const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
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
    games: [
        mongoose.Schema.Types.ObjectId
    ],
    friends: [
        mongoose.Schema.Types.ObjectId
    ],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

userSchema.methods.toJSON = function () {
    const user = this;

    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
}

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