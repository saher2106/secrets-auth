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
    password:String
});

// using passport-local-mongoose
userSchema.plugin(passportLocalMongoose);

// using userSchema to set up new User model
const User= new mongoose.model("User",userSchema);

// for serialising and deserialising cookies
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// for rendering home.ejs
app.get("/",function(req,res){      
    res.render("home");
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
    req.logout(function(err){
        if(err){
            console.log(err);
        }
        else{
            res.redirect("/");
        }
    }); 
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