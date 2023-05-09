const express = require("express");
const session = require("express-session");
const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const app = express();
require("dotenv").config();
const MongoStore = require('connect-mongo');

const Joi = require("joi");

const { userModel, sessionModel } = require("./model/users");

let ejs = require('ejs');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.json());

app.use(express.urlencoded({ extended: false }));


const expireTime = 1 * 60 * 60 * 1000;
app.use(express.urlencoded({ extended: false }));

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${process.env.MONGOOSE_USER}:${process.env.MONGOOSE_PASSWORD}@cluster0.0c1wpzp.mongodb.net/${process.env.MONGOOSE_FOLDER}?retryWrites=true&w=majority`,
    crypto: {
		secret: process.env.SESSION_SECRET
	}
})

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        store: mongoStore,
        saveUninitialized: false,
        resave: true
    })
);

app.get("/homepage", (req, res) => {
    res.render('homepage.ejs')
});

app.get("/login?", async (req, res) => {
    let sessionCheck = "";
    if (req.headers.cookie) {
        sessionCheck = await sessionModel.find({ session: req.headers.cookie.replace('connect.sid=', '') })
    } 
    if (!sessionCheck.length) {
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
            res.render('loginfail.ejs')
        } else {
            res.render('login.ejs')
        }
    } else {
        res.redirect('/members')
    }

});

app.post("/login", async (req, res) => {
    await userModel
        .find({ email: req.body.email })
        .then((users) => {
            if (users.length) {
                users.forEach((user) => {
                    if (bcrypt.compareSync(req.body.password, user.password)) {
                        req.session.GLOBAL_AUTHENTICATED = true;
                        req.session.NAME = user.name;
                        res.redirect("/members");
                    } else {
                        res.redirect("/login?msg=Invalid%20email/password%20combination");
                    }
                });
            } else {
                return res.redirect("/login?msg=Invalid%20email/password%20combination");
            }
        })
        .catch((error) => {
            console.log(error);
            res.redirect("/login?msg=Invalid%20email/password%20combination");
        });
});

app.get("/register", (req, res) => {
    res.render('register.ejs')
});

app.post("/register", (req, res) => {
    if (req.body.name && req.body.email && req.body.password) {
        const user = new userModel({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            type: 'not admin'
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
        return res.status(401).render('notauth.ejs')
    }
    next();
};

const createSession = (req, res, next) => {
    const session = new sessionModel(
        {
            session: req.headers.cookie.replace('connect.sid=', ''),
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

const checkAdmin = async (req, res, next) => {
    let user = await userModel.findOne({ 'name': req.session.NAME }).select({ '_id': 0, 'type': 1 })
    if (user['type'] != 'admin') {
        return res.status(401).render('notadmin.ejs')
    } else {
        next();
    }
}

app.use(express.static('images'))
app.use("/members", authenticatedOnly); //run the authenitcated only function to see if user is authed or not
app.use("/members", createSession);
app.get("/members", async (req, res) => {
    const imageName = ['001.jpg', '002.jpg', '003.jpg']
    console.log(imageName);
    const userList = await userModel.find().select({ '_id': 0, 'name': 1, 'type': 1 })
    res.render('members.ejs', {
        "name": req.session.NAME,
        "image1": '001.jpg',
        "image2": imageName[1],
        "image3": imageName[2],
        'users': userList,
    })
});

app.use("/admin", authenticatedOnly); //run the authenitcated only function to see if user is authed or not
app.use("/admin", checkAdmin);
app.get("/admin", async (req, res) => {
    let randomImageNumber = Math.floor(Math.random() * 3) + 1;
    const imageName = `00${randomImageNumber}.jpg`
    const userList = await userModel.find().select({ '_id': 0, 'name': 1, 'type': 1 })
    res.render('admin.ejs', {
        "name": req.session.NAME,
        "image": imageName,
        'users': userList,
    })
});

app.post("/admin", async (req, res, next) => {
    await userModel.find()
        .then((users) => {
            users.forEach(async (user) => {
                let username = user.name
                if (!!req.body[username]) { //if true
                    await userModel.updateOne({ 'name': username }, { 'type': 'admin' })
                } else {
                    await userModel.updateOne({ 'name': username }, { 'type': 'not admin' })
                }
            })
            res.redirect('/admin')
        }).catch((err) => {
            console.log(err);
            res.send('500 Error')
        })


})

app.get("/endSession", (req, res) => {
    if (req.session.destroy()) {
        sessionModel.deleteMany({ session: req.headers.cookie.replace('connect.sid=', '') })
            .then(() => {
                console.log('IT WORK')
                res.redirect("/login");
            })
            .catch(error => { console.log(error) });
    } else {
        res.status(500).render("404.ejs");
    }
});

app.use("*", (req, res) => {
    res.status(404);
    res.render("404.ejs");
});

module.exports = app;
