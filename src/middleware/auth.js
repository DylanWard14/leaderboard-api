const jwt = require ('jsonwebtoken')
const User = require ('../models/user')

const auth = async (req, res, next) => {
    try {
        const authToken = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
        const user = await User.findOne({_id: decoded._id, 'tokens.token': authToken});
    
        if(!user)
        {
            throw new Error();
        }
        req.token = authToken;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).send({error: "Please Authenticate"});
    }
}

module.exports = auth;