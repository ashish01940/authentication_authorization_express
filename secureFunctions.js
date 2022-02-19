const jwt = require("jsonwebtoken")

module.exports.userAuthorization = (req, res, next) => {
    try {
        console.log(req.headers);
        let token = req?.headers["authorization"]?.replace("Bearer ", "");
        let verification = jwt.verify(token, process.env.jwtSecretkey)
        console.log(token, verification);
        if (verification) {
            next()
        }
    } catch (e) {
        res.json({ message: "Invalid signature or token" })
    }

}

// export const userAuthorization = (req, res, next) => {
//     next()
// }