const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const port = 3000;

// Middleware to parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Sample user data file
const userDataFile = './users.json';

// User class to handle user operations
class User {
    static getUsers() {
        if (fs.existsSync(userDataFile)) {
          return JSON.parse(fs.readFileSync(userDataFile));
        }
        return [];
      }
    
      static addUser(user) {
        const users = this.getUsers();
        users.push(user);
        fs.writeFileSync(userDataFile, JSON.stringify(users, null, 2));
      }
    
      static getUserByEmail(email) {
        const users = this.getUsers();
        return users.find((user) => user.email === email);
      }
}

// Middleware to check if the user is logged in
function checkLoggedIn(req, res, next) {
  const email = req.query.email;
  const user = User.getUserByEmail(email);
  if (!user) {
    res.redirect('/login');
  } else {
    next();
  }
}

// Route for homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// Route for login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Route for handling login POST request
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = User.getUserByEmail(email);

  if (!user || user.password !== password) {
    res.redirect('/login-error');
  } else {
    res.redirect('/dashboard?email=' + email);
  }
});

// Route for login error page
app.get('/login-error', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'loginError.html'));
});

// Route for create account page
app.get('/create-account', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'createAccount.html'));
});

// Route for handling create account POST request
app.post('/create-account', (req, res) => {
  const { name, email, password } = req.body;

  // Check if user with the same email already exists
  if (User.getUserByEmail(email)) {
    res.sendFile(path.join(__dirname, 'views', 'accountExists.html'));
  } else {
    User.addUser({ name, email, password });
    res.redirect('/login');
  }
});

// Route for dashboard page (with the checkLoggedIn middleware applied)
app.get('/dashboard', checkLoggedIn, (req, res) => {
    const email = req.query.email;
    const user = User.getUserByEmail(email);
  
    if (!user) {
      res.redirect('/login');
      return;
    }
  
    const dashboardHTML = fs.readFileSync(path.join(__dirname, 'views', 'dashboard.html'), 'utf-8');
    const dashboardContent = dashboardHTML.replace('{name}', user.name);
    res.send(dashboardContent);
});

// Route for logout (with the checkLoggedIn middleware applied)
app.get('/logout', checkLoggedIn, (req, res) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
