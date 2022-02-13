const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded())
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

app.post("/user/login", (req, res, next) => {
    try {
        let data = user.find({ number: req.body.number }).exec();
        data.catch((err) => {
            res.send("error occured: ", err)
        })
        data.then(async (d) => {
            console.log(d);
            if (req.body.password && d[0]?.password) {
                console.log(req.body.password, d[0]?.password);
                let comparisonResult = await bcrypt.compare(req.body.password, d[0]?.password);
                console.log(comparisonResult);
                if (comparisonResult) res.json({ message: "login successfull" });
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
                console.log(_err);
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