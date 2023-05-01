const express = require("express");
const session = require("express-session");
const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const app = express();
const cookieParser = require("cookie-parser");

const Joi = require("joi");

const {userModel, sessionModel} = require("./model/users");

// userModel.find({username: 'hello'})
// .then((user) => {
//     console.log(user);
// })
// .catch(error => {
//     console.log(error);
//     res.redirect('/login');
// })

const expireTime = 1 * 60 * 60 * 1000;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        cookie: {
            maxAge: expireTime,
        },
    })
);

app.get("/homepage", (req, res) => {
    res.send(`
    <a href="./login" style="font-size: 20pt">Login</a>
    <br>
    <a href="./register" style="font-size: 20pt">Register</a>
    `);
});

app.get("/login?", (req, res) => {
    const schema = Joi.object({
        password: Joi.string(),
    });

    try {
        const value = schema.validateAsync({ password: req.body.password });
    } catch (error) {
        console.log(error);
        return;
    }

    if (req.query.msg) {
        res.send(`
        <form action="/login" method="post"> 
            <input type="text" name="email" placeholder="Enter your email" />
            <input type="password" name="password" placeholder="Enter your Password" />
            <input type="submit" value="login"/>
        </form>
        <p>${req.query.msg}</p>
        `);
    } else {
        res.send(`
        <form action="/login" method="post"> 
            <input type="text" name="email" placeholder="Enter your email" />
            <input type="password" name="password" placeholder="Enter your Password" />
            <input type="submit" value="login"/>
        </form>
    `);
    }
});

app.post("/login", (req, res) => {
    userModel
        .find({ email: req.body.email })
        .then((users) => {
            users.forEach((user) => {
                if (bcrypt.compareSync(req.body.password, user.password)) {
                    req.session.GLOBAL_AUTHENTICATED = true;
                    req.session.NAME = user.name;

                    res.redirect("/loggedIn");
                } else {
                    res.redirect("/login?msg=Invalid%20email/password%20combination");
                }
            });
        })
        .catch((error) => {
            console.log(error);
            res.redirect("/login");
        });
});

app.get("/register", (req, res) => {
    res.send(`
    <form action="/register" method="post"> 
        <input type="text" name="name" placeholder="Enter your name" />
        <input type="text" name="email" placeholder="Enter your email" />
        <input type="password" name="password" placeholder="Create a Password" />
        <input type="submit" value="login"/>
    </form>`);
});

app.post("/register", (req, res) => {
    if (req.body.name && req.body.email && req.body.password) {
        const user = new userModel({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
        });

        user
            .save()
            .then((result) => {
                res.redirect("/login");
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send("500 Error");
            });
    } else {
        res.redirect("/registerError");
    }
});

app.get("/registerError", (req, res) => {
    res.send(`
        <p>Every box needs to contain information</p>
        <a href='/register'>Try again</a>
    `);
});

const authenticatedOnly = (req, res, next) => {
    if (!req.session.GLOBAL_AUTHENTICATED) {
        return res.status(401).send(`
            <p>User not authenticated
            <a href='/homepage'>Go to Home Page</a>
            `);
    }
    next();
};

const createSession = (req, res, next) => {
    const session = new sessionModel(
        {
            session: req.headers.cookie.replace('connect.sid=',''),
        }
    );

    session
        .save()
        .then((result) => {
            next()
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send("500 Error Session");
        });
};

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

app.use("/loggedIn", authenticatedOnly); //run the authenitcated only function to see if user is authed or not
app.use("/loggedIn", createSession); 
app.get("/loggedIn", (req, res) => {
    image = ['https://cdn.britannica.com/31/122031-050-F8FCA663/Hamburger-cheeseburger.jpg', 'https://media.cnn.com/api/v1/images/stellar/prod/220428140436-04-classic-american-hamburgers.jpg?c=original', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Hamburger_%28black_bg%29.jpg/640px-Hamburger_%28black_bg%29.jpg']
    res.send(`
    <h1>Welcome user: ${req.session.NAME}</h1>
    <img src="${image[getRandomInt(3)]}" style="width: 300px">
    <br>
        <a href='/endSession'>Log out</a>
    `);
});

app.get("/endSession", (req, res) => {
    if (req.session.destroy()) {
        sessionModel.deleteOne({ session: req.headers.cookie.replace('connect.sid=','')})
        .then(console.log('IT WORK'))
        .catch(error => {console.log(error)});
        res.redirect("/login");
    } else {
        res.status(500).send("Error 500");
    }
});

app.use("*", (req, res) => {
    res.status(404);
    res.send("404 Not Found");
});

module.exports = app;
