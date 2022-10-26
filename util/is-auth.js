const { verify } = require("jsonwebtoken");
const User = require("../models/user");

const validateToken = (req, res, next) => {
  const accessToken = req.cookies["access-token"];

  if (!accessToken) {
    return res.status(400).json({
      error: "User not authenticated",
    });
  }

  try {
    const validToken = verify(accessToken, "somesupersecret");
    if (validToken) {
      req.isAuthenticated = true;
      return next();
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

const checkUser = (req, res, next) => {
  const token = req.cookies["access-token"];

  if (token) {
    verify(token, "somesupersecret", async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.locals.isAuthenticated = null;
        next();
      } else {
        let user = await User.findById(decodedToken.userId);
        res.locals.isAuthenticated = user;
        next();
      }
    });
  } else {
    res.locals.isAuthenticated = null;
    next();
  }
};

// check current user

module.exports = { validateToken, checkUser };
