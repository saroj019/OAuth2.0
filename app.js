// app.js

// 1. Import necessary modules
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

// --- IMPORTANT ---
// In a real app, use environment variables for these.
const GITHUB_CLIENT_ID = 'Enter your GitHub Client ID here';
const GITHUB_CLIENT_SECRET = 'Enter your GitHub Client Secret here';

// 2. Setup Express App
const app = express();
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// 3. Configure Passport with the GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  // This is the "verify" callback. It's called when GitHub successfully authenticates the user.
  // The 'profile' object contains the user's GitHub information.
  function(accessToken, refreshToken, profile, done) {
    // In a real app, you'd find or create a user in your database here.
    // For this example, we'll just pass the profile directly to the next step.
    console.log("GitHub profile:", profile);
    return done(null, profile);
  }
));

// 4. Configure session management
// To keep the user logged in, Passport needs to store a piece of data in the session.
passport.serializeUser(function(user, done) {
  done(null, user); // Store the entire user profile in the session
});

passport.deserializeUser(function(obj, done) {
  done(null, obj); // Retrieve the user profile from the session
});

// Middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// 5. Define Routes

// Homepage route
app.get('/', (req, res) => {
  let output = '<h1>Home</h1>';
  if (req.isAuthenticated()) {
    output += `<p>Logged in as: ${req.user.displayName}</p>`;
    output += '<a href="/profile">View Profile</a><br>';
    output += '<a href="/logout">Logout</a>';
  } else {
    output += '<p>You are not logged in.</p>';
    output += '<a href="/auth/github">Login with GitHub</a>';
  }
  res.send(output);
});

// Route to initiate the OAuth flow
// When a user clicks "Login with GitHub", they are sent here.
app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] })); // Requesting email scope

// The callback route that GitHub redirects to after authorization
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect to the profile page.
    res.redirect('/profile');
  });

// A protected route that only authenticated users can access
app.get('/profile', ensureAuthenticated, (req, res) => {
  res.send(`
    <h1>${req.user.displayName}'s Profile</h1>
    <p>Username: ${req.user.username}</p>
    <p>ID: ${req.user.id}</p>
    <img src="${req.user._json.avatar_url}" alt="avatar" width="100">
    <br><a href="/">Back to Home</a>
  `);
});

// Logout route
app.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// 6. Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});