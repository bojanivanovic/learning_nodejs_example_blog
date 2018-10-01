const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const okta = require('@okta/okta-sdk-nodejs');
const session = require('express-session');
const ExpressOIDC = require('@okta/oidc-middleware').ExpressOIDC;

const blogRouter = require('./routes/blog');
const usersRouter = require('./routes/users');

const app = express();
const client = new okta.Client({
    orgUrl: 'dev-947769-admin.oktapreview.com',
    token: "00SR18c7TOU_9UzMtPqaaN_JUAuqaOTgTWj9S0dxV0"
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

const oidc = new ExpressOIDC({
    issuer: 'dev-947769-admin.oktapreview.com/oauth2/default',
    client_id: '0oagfk1hbytPY94Mx0h7',
    client_secret: 'n6SPraDHnwTQZ9Jup5eYE8bagiwj1Rq1M2Nqk-Ie',
    redirect_uri: 'http://localhost:3000/users/callback',
    scope: 'openid profile',
    routes: {
        login: {
            path: '/users/login'
        },
        callback: {
            path: '/users/callback',
            defaultRedirect: '/dashboard'
        }
    }
});

app.use(session({
    secret: 'qY57w3R82Co=',
    resave: true,
    saveUninitialized: false
}));

app.use(oidc.router);

app.use((req, res, next) => {
    if (!req.userinfo) {
        return next();
    }

    client.getUser(req.userinfo.sub).then(user => {
        req.user = user;
        res.locals.user = user;
        next();
    });
});

// Routes
app.use('/', blogRouter);
app.use('/users', usersRouter);

// Error handlers
app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

