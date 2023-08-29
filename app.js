//jshint esversion:6
//importing the required packages
require("dotenv").config();  //at top ,for defining environment variable
const express=require("express");
const bodyParser=require("body-parser");       
const ejs=require("ejs");
const mongoose=require("mongoose");
// hash function
const md5=require("md5");

const app=express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({
    extended:true
}));

// using mongoose to connect to mongodb
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true,
useUnifiedTopology: true});

//setting up new userDB
//create a user schema (mongoose schema object with two fields)
const userSchema=new mongoose.Schema({
    email:String,
    password:String
});


//using userSchema to set up new User model
const User= new mongoose.model("User",userSchema);


//for rendering home.ejs
app.get("/",function(req,res){      
    res.render("home");
});

//for rendering login page
app.get("/login",function(req,res){     
    res.render("login");
});

//for rendering register.ejs
app.get("/register",function(req,res){      
    res.render("register");
});


//catch the post request of register route when submit button is pressed for email and password
app.post("/register",function(req,res){
    //creating a user entry using User model
    const newUser=new User({
        //username is the name for email and password for password in register.ejs
        email:req.body.username,        
        password:md5(req.body.password)
    });
    //saving the newUser details created on the register page
    newUser.save(function(err){
        // adding a callback function to catch any errors
        if(err){
            console.log(err);
        }
        // if no errors then only render the secrets page
        else{
            res.render("secrets");
        }
    });
});


// catch the post request for login route when the submit button is pressed for login
app.post("/login",function(req,res){
    const username=req.body.username;
    const password=md5(req.body.password);
    // check if the account exists for entered username and password
    // check if email field matching with log in username 
    User.findOne({email:username},function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            // if the user exists with that email, check password
            if(foundUser){
                if(foundUser.password===password){
                    res.render("secrets");
                }
            }
        }
    })
});


app.listen(3000,function(){
    console.log("Server started on port 3000");
});