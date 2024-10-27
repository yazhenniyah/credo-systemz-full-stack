const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const port = 3091;

const app = express();
app.use(express.static(__dirname)); // Serve static files from the current directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Connect to the default database for regular users
mongoose.connect('mongodb://127.0.0.1:27017/userinfo', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.once('open', () => {
    console.log('MongoDB connection successful');
});

// User schema
const userSchema = new mongoose.Schema({
    Username: String,
    password: String,
    isAdmin: { type: Boolean, default: false } // Field to identify admin
});

const Users = mongoose.model("data", userSchema);

// Serve login pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'user-login.html')); // Serve user login page
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html')); // Serve admin login page
});

// Handle user form submission
app.post('/post', async (req, res) => {
    const { Username, password } = req.body;
    const user = new Users({
        Username,
        password,
        isAdmin: false // Set isAdmin to false for regular users
    });
    
    try {
        await user.save(); // Save user to the default database
        console.log(user);
        res.sendFile(path.join(__dirname, 'cities.html')); // Redirect to the next HTML page
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send("Error saving profile");
    }
});

// Handle admin form submission
app.post('/admin-post', async (req, res) => {
    const { Username, password } = req.body;

    // Connect to the admin database
    const adminDb = mongoose.createConnection('mongodb://127.0.0.1:27017/admininfo', { useNewUrlParser: true, useUnifiedTopology: true });

    const Admins = adminDb.model("data", userSchema); // Create a model for the admin database

    const admin = new Admins({
        Username,
        password,
        isAdmin: true // Set isAdmin to true for admin users
    });
    
    try {
        await admin.save(); // Save admin to the admin database
        console.log(admin);
        res.sendFile(path.join(__dirname, 'admin-dashboard.html')); // Redirect to the next HTML page
    } catch (error) {
        console.error('Error saving admin:', error);
        res.status(500).send("Error saving profile");
    }
});

// Redirect to cities.html for user login
app.post('/user-login', async (req, res) => {
    const { Username, password } = req.body;
    const user = await Users.findOne({ Username, password, isAdmin: false });
    
    if (user) {
        res.sendFile(path.join(__dirname, 'cities.html')); // Redirect to cities.html
    } else {
        res.status(401).send("Invalid user credentials"); // Handle invalid login
    }
});

// Redirect to admin-dashboard.html for admin login
app.post('/admin-login', async (req, res) => {
    const { Username, password } = req.body;
    
    // Connect to the admin database
    const adminDb = mongoose.createConnection('mongodb://127.0.0.1:27017/admininfo', { useNewUrlParser: true, useUnifiedTopology: true });
    const Admins = adminDb.model("data", userSchema); // Create a model for the admin database

    const admin = await Admins.findOne({ Username, password, isAdmin: true });
    
    if (admin) {
        res.sendFile(path.join(__dirname, 'admin-dashboard.html')); // Redirect to admin-dashboard.html
    } else {
        res.status(401).send("Invalid admin credentials"); // Handle invalid login
    }
});

app.listen(port, () => {
    console.log("Server started on port " + port);
});