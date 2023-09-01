// jshint esversion:6
// importing the required packages
require("dotenv").config();  //at top ,for defining environment variable
const express=require("express");
const bodyParser=require("body-parser");       
const ejs=require("ejs");
const mongoose=require("mongoose");
// for hashing and creating sessions
const session =require("express-session");
const passport=require("passport");
const passportLocalMongoose =require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate");

const app=express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({
    extended:true
}));

// initialising session cookie, position of code imp
app.use(session({
    // long string
    secret:"a long secret sentence",
    resave:false,
    saveUninitialized:false
}))

// initialising passport
app.use(passport.initialize());
app.use(passport.session());

// using mongoose to connect to mongodb
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true,
useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);

// setting up new userDB
// create a user schema (mongoose schema object with two fields)
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String
});

// using passport-local-mongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// using userSchema to set up new User model
const User= new mongoose.model("User",userSchema);

// for serialising and deserialising cookies
passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


// google authentication strategy, position imp
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    // created project callback URL 
    callbackURL: "http://localhost:3000/auth/google/secrets-auth",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// for rendering home.ejs
app.get("/",function(req,res){      
    res.render("home");
});

// for google auth button
app.get("/auth/google",
passport.authenticate("google", { scope: ["profile"] })
);

// put the link created on google developer studio
app.get("/auth/google/secrets-auth", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

// for rendering login page
app.get("/login",function(req,res){     
    res.render("login");
});

// for rendering register.ejs
app.get("/register",function(req,res){      
    res.render("register");
});

// for rendering secrets page if user authenticated
app.get("/secrets",function(req, res){
    if (req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        // if not authenticated then login first
        res.redirect("/login");
    }
});

// route to logout
app.get("/logout", function(req, res){
    // Log the user out
    req.logout(); 
    // Redirect to the home page after logout
    res.redirect("/");
});


// catch the post request of register route when submit button is pressed for email and password
app.post("/register",function(req,res){
    // from passport-local-mongoose package 
    User.register({username: req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});


// catch the post request for login route when the submit button is pressed for login
app.post("/login",function(req,res){
    // creating new user
    const user=new User({
        username: req.body.username,
        password: req.body.password
    });
    // using passport to login
    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});


app.listen(3000,function(){
    console.log("Server started on port 3000");
});