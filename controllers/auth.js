const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const fileHelper = require("../util/file");
const User = require("../models/user");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: process.env.SENDGRID,
    },
  })
);

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: "",
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: "",
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },

    validationErrors: [],
  });
};

exports.getProfile = (req, res, next) => {
  const email = res.locals.isAuthenticated.email;

  User.findOne({ email: email })
    .then((users) => {
      res.render("auth/profile", {
        user: users,
        pageTitle: "My Profile",
        path: "/profile",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProfile = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const userId = req.params.userId;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.redirect("/");
      }
      res.render("auth/edit-profile", {
        pageTitle: "Edit User",
        path: "/edit-user",
        editing: editMode,
        profile: user,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postUpdateProfile = async (req, res, next) => {
  const userId = req.body.userId;
  const updatedUsername = req.body.username;
  const updatedFirstName = req.body.firstname;
  const updatedLastName = req.body.lastname;
  const updatedEmail = req.body.email;
  const image = req.file;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/edit-profile", {
      pageTitle: "Edit User",
      path: "/edit-user",
      editing: false,
      hasError: true,
      profile: {
        username: updatedUsername,
        firstname: updatedFirstName,
        lastname: updatedLastName,
        email: updatedEmail,
        _id: userId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.redirect("/");
      }
      user.username = updatedUsername;
      user.firstname = updatedFirstName;
      user.lastname = updatedLastName;
      user.email = updatedEmail;

      if (user.imageUrl) {
        fileHelper.deleteFile(user.imageUrl);
        user.imageUrl = image.path;
      } else {
        user.imageUrl = image.path;
      }

      return user.save();
    })
    .then((result) => {
      console.log("USER UPDATED!");
      res.redirect("/profile");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      path: "/login",
      editing: false,
      hasError: true,
      oldInput: {
        email: email,
        password: password,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or password",
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
        const error = new Error("A user with this email could not be found.");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or password",
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
        const error = new Error("Wrong password!");
        error.statusCode = 401;
        throw error;
      }
      const accessToken = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        "somesupersecret",
        { expiresIn: "10min" }
      );
      res.cookie("access-token", accessToken, {
        maxAge: 600000,
        httpOnly: true,
      });

      res.redirect("/");
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const username = req.body.username;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        username: username,
        confirmPassword: req.body.confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        username: username,
        email: email,
        password: hashedPassword,
      });
      return user.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteProfile = (req, res, next) => {
  const userId = req.body.userId;

  User.findById(userId)
    .then((user) => {
      if (user.imageUrl) {
        fileHelper.deleteFile(user.imageUrl);
      }

      return User.deleteOne({ _id: userId });
    })
    .then(() => {
      console.log("USER DELETED!");
      res.clearCookie("access-token");
      res.redirect("/");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  // res.cookie('access-token', '', {maxAge: 1}) other  logout method
  res.clearCookie("access-token");
  res.redirect("/");
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: "",
  });
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/reset", {
      pageTitle: "Reset",
      path: "/reset",
      editing: false,
      hasError: true,
      oldInput: {
        email: email,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          return res.status(422).render("auth/reset", {
            path: "/reset",
            pageTitle: "Reset Password",
            errorMessage: "No account with that email found",
          });
        }
        if (user.passwordResetChance <= 0) {
          return res.status(422).render("auth/reset", {
            path: "/reset",
            pageTitle: "Reset Password",
            errorMessage: "Password Reset Chances has been reached",
          });
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        user.passwordResetChance = user.passwordResetChance - 1;
        return user.save();
      })
      .then((result) => {
        transporter.sendMail({
          to: req.body.email,
          from: "justinroy.jurolan@stratpoint.com",
          subject: "Password Reset",
          html: `<p>Click the Link for password reset</p>
                  <a href="http://localhost:3000/reset/${token}"> LINK </a>`,
        });
        res.redirect("/");
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: "",
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/new-password", {
      pageTitle: "New Password",
      path: "/new-password",
      editing: false,
      hasError: true,
      oldInput: {
        password: newPassword,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
