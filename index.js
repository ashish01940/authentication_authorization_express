const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const { userAuthorization } = require("./secureFunctions");
// import { userAuthorization } from "./secureFunctions";

app.use(express.urlencoded())
app.use(express.json())

mongoose.connect(process.env.MONGOURL, (err, res) => {
    if (err) throw err;
    console.log("connected");
})

//schemas 
const userType = new mongoose.Schema({
    number: { type: String, required: true, minLength: 10, maxLength: 10, unique: true },
    password: { type: String, required: true }
})

//model
const user = mongoose.model("user", userType);


app.get("/userList", (req, res, next) => {
    try {
        user.find().exec((_err, _res) => {
            if (_err) res.send(_err)
            res.json({ userList: _res })
        })
    }
    catch (e) {
        res.send(e)
    }
})


app.post("/accessData", userAuthorization, (req, res) => {
    res.json({ message: "you are authorized" })
})

app.post("/user/login", (req, res, next) => {
    try {
        let data = user.find({ number: req.body.number }).exec();
        data.catch((err) => {
            res.send("error occured: ", err)
        })
        data.then(async (d) => {

            if (req.body.password && d[0]?.password) {
                let comparisonResult = await bcrypt.compare(req.body.password, d[0]?.password);


                //createAuthToken
                // let token = jwt.sign(JSON.stringify(d[0]), process.env.jwtSecretkey, { expiresIn: process.env.tokenExpire }) //expiresIn can't set if payload in stringified
                let token = jwt.sign(d[0].toJSON(), process.env.jwtSecretkey, { expiresIn: process.env.tokenExpire })
                console.log(token);

                if (comparisonResult) {
                    res.json({
                        message: "login successfull", userData: {
                            data: d[0],
                            token: {
                                expiresIn: process.env.tokenExpire,
                                token: token
                            }
                        }
                    });
                }
                else res.json({ message: "login failed" });
            } else res.json({ message: "login failed" });

        })
    }
    catch (e) {
        res.send("error", e)
    }
})

app.post("/user/create", async (req, res, next) => {
    try {
        if (req.body?.number && req.body?.password) {
            let hashedPass = await bcrypt.hash(req.body.password, 10)
            let objToBeSaved = new user({ number: req.body.number, password: hashedPass });
            objToBeSaved.save((_err, _data) => {
                // console.log(_err);
                if (_err) {
                    if (_err.name === "MongoServerError" && _err.code === 11000) {
                        res.json({ messsage: "This number has already been registered!" });
                    } else {
                        res.json({ "message : ": _err });
                    }
                }
                else {
                    res.json({ response: _data })
                }
            })
        } else {
            res.json({ message: "error occured" });
        }
    }
    catch (e) {
        res.json({ message: "error occured", e })
    }
})

app.listen(process.env.PORT, () => {
    console.log("port started at", process.env.PORT);
})