const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');

const userModel = require('./models/user')
const postModel = require('./models/post');
const upload = require('./config/multerconfig');

const app = express()

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))


app.set("view engine", "ejs"); // or another view engine
// app.set('views', path.join(__dirname, 'views'));





app.get('/', (req, res) => {
    // res.render('index')
    res.render("index")
})

app.post('/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    let { content } = req.body;
    let post = await postModel.create({
        user: user._id,
        content: content
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile')
})

app.get('/profile', isLoggedIn, async (req, res) => {
    // console.log(req.user);
    let user = await userModel.findOne({ email: req.user.email }).populate("posts")
    res.render('profile', { user })
})

app.get('/profile/upload', (req,res)=>{
    res.render("profileUpload")
})

app.post('/upload',isLoggedIn, upload.single("avatar"), async (req,res)=>{
    let user = await userModel.findOne({email: req.user.email});
    user.profilePic = req.file.filename
    await user.save()
    res.redirect("/profile")
})


app.get('/like/:id', isLoggedIn, async (req, res) => {

    // console.log(req.user);
    let post = await postModel.findOne({ _id: req.params.id }).populate("user")
    userLiked = post.likes.indexOf(req.user._id)
    if (userLiked === -1) {//check kr rhe hain ki user ne phle to like nahi kri post 
        post.likes.push(req.user._id)
    } else {
        post.likes.splice(userLiked, 1)//splice means km krn
    }

    await post.save()
    res.redirect('/profile')
})

app.get('/edit/:id', isLoggedIn, async (req, res) => {
    // console.log(req.user);
    let post = await postModel.findOne({ _id: req.params.id }).populate("user")
    // userLiked=post.likes.indexOf(req.user.userid)

    res.render("edit",{post})
})

app.post('/update/:id', isLoggedIn, async (req, res) => {
    // console.log(req.user);
    let post = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content });

    // userLiked=post.likes.indexOf(req.user.userid)

    res.redirect("/profile")
})

app.get('/login', (req, res) => {
    // res.render('index')
    res.render("login")
})

app.post('/register', async (req, res) => {
    // check krenge if user exixtes already
    let { username, name, email, age, password } = req.body; //saara data body se nikalenge
    let user = await userModel.findOne({ email: email }); //data ko ek variable mei daalenge
    if (user) { return res.status(500).send("User Already Exixts") } //check krenge if user exixst

    bcrypt.genSalt(10, (er, salt) => {
        bcrypt.hash(password, salt, async (err, hashedPassword) => {
            let createdUser = await userModel.create({
                username,
                name,
                email,
                age,
                password: hashedPassword
            })
            let token = jwt.sign({ email: email, userId: createdUser._id }, "neeraj111");
            // console.log(token)
            res.cookie("token", token);
            // console.log(req.cookies)
            // res.send("registerd successfully")
            res.redirect("/login")
            // res.send("")

        })

    })



})

app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email: email })
    // console.log(user)
    if (!user) { return res.status(500).send("something went wrong") }
    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: user.email }, "neeraj111");
            res.cookie("token", token)
            // console.log(req.cookies)
            res.status(200).redirect("/profile")
        } else {
            res.redirect("/login")
            // res.send("something went wrong in logging in ")
        }
    })
})

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect("/login")
})

function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") {
        res.redirect("/login")
    } else {
        let data = jwt.verify(req.cookies.token, "neeraj111"); //verify karenge ki user kon hai 
        req.user = data;
    }
    next();
}
// ye jo isloggedin middleware hai isse hum kisi bhi protected route pe laga skte hai jaise
// app.get('/profile', isLoggedIn, (req,res)) ta ki jab bhi hu profile pe jayein vo sabse phle 
// login maaange 

app.listen(3000, () => {
    console.log("application server is running")



})
