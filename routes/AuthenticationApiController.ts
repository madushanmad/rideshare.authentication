﻿import express = require('express');
import guid = require('guid');
import nodemailer = require('nodemailer');
import IUserDAO = require("../common/IUserDAO");
import User = require("../models/User");
import IUser = require("../models/common/IUser");
import UserResponse = require("../models/UserResponse"); 
import TokenPayload = require("../models/TokenPayload");
import AccessToken = require("../models/AccessToken");
import Config = require("../config");
import ApplicationContext = require("../ApplicationContext");
import jwt = require('jsonwebtoken'); 

class AuthhenticationAPIController{

    constructor() {
       
    }

    // /useraccount
    useraccount(req: express.Request, res: express.Response) {

        var user = new User();
        user.gender = req.body.gender;
        user.email = req.body.email;
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.password = req.body.password;
        user.userName = req.body.userName;
        user.profileImage = req.body.profileImage;
        user.resetPasswordGuid = req.body.resetPasswordGuid;
        user.registrationCode = req.body.registrationCode;
        user.mobileNumber = req.body.mobileNumber;
        try {
            var dataAccess = ApplicationContext.getDB();
            dataAccess.addUser(user);
            dataAccess.onUserAdded = (error: Error, status: boolean) => {
                if (status) {
                    res.json({ success: true });
                }
                else {
                    res.json({ success: false, message: "Cant Create a User" });
                }
            };
           
        }
        catch (e) {
            res.json({ success: false, message: e.message});
        }
       
    }

    // /accesstoken
    accesstoken(req: express.Request, res: express.Response) {
        var dataAccess = ApplicationContext.getDB();
        dataAccess.getSelectedUser('userName', req.body.userName);
        dataAccess.onSelectedUserDataReceived = (error: Error, user: IUser) => {
                if (error) {
                    res.json({ success: false, message: error.message });
                }
                else if (user.password != req.body.password) {
                    res.json({ success: false, message: 'Incorrect credentials.' });
                }
                else {

                    // if user is found and password is right
                    // create a token
                    var tokenPayload = new TokenPayload();
                    tokenPayload.userName = user.userName;
                    tokenPayload.canAccessUserInfo = true;
                    var secret = process.env.RIDESHARE_SECRET || Config.secret;
                    var token = jwt.sign(tokenPayload,secret, {
                        expiresIn: '24h' // expires in 24 hours
                    });

                    var accessToken = new AccessToken();
                    accessToken.token = token;
                    accessToken.success = true;

                    // return the information including token as JSON
                    res.json(accessToken);
                }
            };

    }

    // /userinfo
    userinfo(req: express.Request, res: express.Response) {       
           
        var dataAccess = ApplicationContext.getDB();
        var user = dataAccess.getSelectedUser('userName', req.body.userName);
        
        dataAccess.onSelectedUserDataReceived = (error: Error, user: IUser) => {

                if (error) {
                    res.json({ success: false, message: error.message });
                }

                else if (req.body.canAccessUserInfo) {

                    var userResponse = new UserResponse();
                    userResponse.gender = user.gender;
                    userResponse.mobileNumber = user.mobileNumber;
                    userResponse.email = user.email;
                    userResponse.firstName = user.firstName;
                    userResponse.lastName = user.lastName;
                    userResponse.userName = user.userName;
                    userResponse.profileImage = user.profileImage;
                    userResponse.resetPasswordGuid = user.resetPasswordGuid;
                    userResponse.registrationCode = user.registrationCode;
                    userResponse.success = true;
                    res.json(userResponse);
                }
                else {
                    res.json({ success: false, message: 'No Permissions to access' });
                }
            };

    }

    //userinfobyguid
    userinfobyguid(req: express.Request, res: express.Response) {
        var dataAccess = ApplicationContext.getDB();
        var user = dataAccess.getSelectedUser('resetPasswordGuid', req.params.resetPasswordGuid);

        dataAccess.onSelectedUserDataReceived = (error: Error, user: IUser) => {

            if (error) {
                res.json({ success: false, message: error.message });
            }

            else if (user) {                

                var tokenPayload = new TokenPayload();
                    tokenPayload.userName = user.userName;
                    tokenPayload.canAccessUserInfo = true;
                    var secret = process.env.RIDESHARE_SECRET || Config.secret;
                    var token = jwt.sign(tokenPayload, secret, {
                        expiresIn: '24h' // expires in 24 hours
                    });

                    var accessToken = new AccessToken();
                    accessToken.token = token;
                    accessToken.success = true;
                    
                    res.json(accessToken);
            }
            else {
                res.json({ success: false, message: 'No user found' });
            }
        };

    }

    //userinfobyregistrationcode
    userinfobyregistrationcode(req: express.Request, res: express.Response) {
        var dataAccess = ApplicationContext.getDB();
        var user = dataAccess.getSelectedUser('registrationCode', req.params.registrationCode);

        dataAccess.onSelectedUserDataReceived = (error: Error, user: IUser) => {

            if (error) {
                res.json({ success: false, message: error.message });
            }

            else if (user) {

                var userResponse = new UserResponse();
                userResponse.gender = user.gender;
                userResponse.mobileNumber = user.mobileNumber;
                userResponse.email = user.email;
                userResponse.firstName = user.firstName;
                userResponse.lastName = user.lastName;
                userResponse.userName = user.userName;
                userResponse.profileImage = user.profileImage;
                userResponse.resetPasswordGuid = user.resetPasswordGuid;
                userResponse.registrationCode = user.registrationCode;
                userResponse.success = true;
                res.json(userResponse);
            }
            else {
                res.json({ success: false, message: 'No user found' });
            }
        };
    }

    //userinfosendemailwithguid
    userinfosendemailwithguid(req: express.Request, res: express.Response) {
        var dataAccess = ApplicationContext.getDB();
        var user = dataAccess.getSelectedUser('userName', req.params.userName);

        dataAccess.onSelectedUserDataReceived = (error: Error, user: IUser) => {

            if (error) {
                res.json({ success: false, message: error.message });
            }

            else if (user) {

                var smtpConfig = {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false, // use SSL
                    auth: {
                        user: 'virtusamicros@gmail.com',
                        pass: '1qaz2wsx@W'
                    }
                };

                var newguid = guid.create();
                
                var transporter = nodemailer.createTransport(smtpConfig);
            
                // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: '"RideShare" <virtusamicros@gmail.com>', // sender address
                    to: user.email, // list of receivers
                    subject: 'Reset Password', // Subject line
                    html: '<p>Please click on the following link to reset your password: </p> <a href="http://rideshareresetpassword?id=' + newguid + '">' + newguid + '</a>' +
                    '</br></br> <p>Best Regards,</p> </br> <p>RideShare Team</p>' // html body
                };
            
                 //send mail with defined transport object
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        return console.log(error);

                    }

                    user.resetPasswordGuid = newguid;

                    dataAccess.updateUser(user);
                    dataAccess.onUserUpdated = (error: Error, status: boolean) => {

                        if (error) {
                            res.json({ success: false, message: error.message });                            
                        }

                        else if (status) {
                            res.json({ success: true });                            
                        }
                        else {
                            res.json({ success: false, message: "Cant update the User" });                            
                        }
                    };                    
                });
                
            }
            else {
                res.json({ success: false, message: 'No user found' });
            }
        };

    }

    //userinfosendemailwithcode
    userinfosendemailwithcode(req: express.Request, res: express.Response) {
        var dataAccess = ApplicationContext.getDB();
        var user = dataAccess.getSelectedUser('userName', req.params.userName);
        
        dataAccess.onSelectedUserDataReceived = (error: Error, user: IUser) => {

            if (error) {
                res.json({ success: false, message: error.message });
            }

            else if (user) {

                var smtpConfig = {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false, // use SSL
                    auth: {
                        user: 'virtusamicros@gmail.com',
                        pass: '1qaz2wsx@W'
                    }
                };

                
                var subject = 'Registration Completion';
                if (req.params.flag == 'FPWD') {
                    subject = 'Reset Password';
                }

                var transporter = nodemailer.createTransport(smtpConfig);
                
                var mailOptions = {
                    from: '"RideShare" <virtusamicros@gmail.com>', // sender address
                    to: user.email, // list of receivers
                    subject: subject, // Subject line
                    html: '<p>Welcome,</p> Please enter the following code to complete the registration: <b>' + req.params.code +
                    '</b></br> You must enter this code, once you have logged in with the username and password entered at the registration.' +
                    '</br></br> Best Regards,</br> RideShare Team' // html body
                };
            
                if (req.params.flag == 'FPWD') {                    
                    // setup e-mail data with unicode symbols
                    mailOptions = {
                        from: '"RideShare" <virtusamicros@gmail.com>', // sender address
                        to: user.email, // list of receivers
                        subject: subject, // Subject line
                        html: '<p>Hello,</p> Please enter the following code as your password when login in:  <b>' + req.params.code +
                        '</b></br> You can reset your password in Edit Profile, once you are logged in.' +
                        '</br></br> Best Regards,</br> RideShare Team' // html body
                    };
                }
            
                // send mail with defined transport object
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        return console.log(error);
                    }
                
                    if (req.params.flag == 'FPWD') {
                        user.password = req.params.code;
                    }
                    else {
                        user.registrationCode = req.params.code;
                    }

                    dataAccess.updateUser(user);
                    dataAccess.onUserUpdated = (error: Error, status: boolean) => {

                        if (error) {
                            res.json({ success: false, message: error.message });
                        }

                        else if (status) {
                            res.json({ success: true });
                        }
                        else {
                            res.json({ success: false, message: "Cant update the User" });
                        }
                    };
                });

            }
            else {
                res.json({ success: false, message: 'No user found' });
            }
        };

    }

    // /account
    account(req: express.Request, res: express.Response) {

        var user = new User();
        user.gender = req.body.gender;
        user.mobileNumber = req.body.mobileNumber;
        user.email = req.body.email;
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.password = req.body.password;
        user.userName = req.body.userName;
        user.profileImage = req.body.profileImage;
        user.resetPasswordGuid = req.body.resetPasswordGuid;
        user.registrationCode = req.body.registrationCode;
        var dataAccess = ApplicationContext.getDB();
        dataAccess.updateUser(user);
        dataAccess.onUserUpdated = (error: Error, status: boolean) => {

                if (error) {
                    res.json({ success: false, message: error.message });
                }

                else if (status) {
                    res.json({ success: true });
                }
                else {
                    res.json({ success: false, message: "Cant update the User" });
                }
            };

       
    }

    //deleteaccount
    deleteaccount(req: express.Request, res: express.Response) {
        var user = new User();
        user.userName = req.body.userName;
        var dataAccess = ApplicationContext.getDB();
        dataAccess.deleteUser(user);
        dataAccess.onUserDeleted = (error: Error, status: boolean) => {

            if (error) {
                res.json({ success: false, message: error.message });
            }

            else if (status) {
                res.json({ success: true });
            }
            else {
                res.json({ success: false, message: "Can't delete the User" });
            }
        };


    }

    //updateregistrationcode
    updateregistrationcode(req: express.Request, res: express.Response) {
        var dataAccess = ApplicationContext.getDB();
        var user = dataAccess.getSelectedUser('userName', req.params.userName);

        dataAccess.onSelectedUserDataReceived = (error: Error, user: IUser) => {

            if (error) {
                res.json({ success: false, message: error.message });
            }

            else if (user) {
                
                if (req.params.code == "empty")
                user.registrationCode = null;                

                dataAccess.updateUser(user);
                dataAccess.onUserUpdated = (error: Error, status: boolean) => {

                    if (error) {
                        res.json({ success: false, message: error.message });
                    }

                    else if (status) {
                        res.json({ success: true });
                    }
                    else {
                        res.json({ success: false, message: "User update failed" });
                    }
                };               

            }
            else {
                res.json({ success: false, message: 'User does not exist' });
            }
        };

    }

    token(req: express.Request, res: express.Response, next: express.NextFunction) {

        var token = req.body.token || req.query.token || req.headers['x-access-token'];
        var self = this;
        // decode token
        if (token) {
            var secret = process.env.RIDESHARE_SECRET || Config.secret;
            jwt.verify(token, secret, function (err, decoded) {
                if (err) {
                    res.json({ success: false, message: 'Failed to authenticate token.' });
                }

                else if (decoded) {

                    if (decoded.userName) {
                        req.body.userName = decoded.userName;
                        req.body.canAccessUserInfo = decoded.canAccessUserInfo;
                        next();
                    }
                    else res.json({ success: false, message: 'No user found' });
                }
                else {
                    res.json({ success: false, message: 'Cant decode user data' });
                }
            });
        }
        else
            return res.json({ success: false, message: 'Token not found.' });
    }

}

export = AuthhenticationAPIController