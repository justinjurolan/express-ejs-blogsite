const express = require("express");
const { check, body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const { validateToken } = require("../util/is-auth");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.get("/profile", authController.getProfile);

router.get("/edit-user/:userId", validateToken, authController.getEditProfile);

router.post(
  "/edit-user",
  [
    body("username").isLength({ min: 2 }).trim(),
    body("firstname").isLength({ min: 2 }).trim(),
    body("lastname").isLength({ min: 2 }).trim(),
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail()
      .trim(),
  ],
  validateToken,
  authController.postUpdateProfile
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    body("password", "Password has to be valid")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

router.post(
  "/signup",
  [
    body("username", "Please add more character in your username")
      .isLength({ min: 2 })
      .trim(),
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "Email already exist, please try another one"
            );
          }
        });
      })
      .normalizeEmail(),
    body(
      "password",
      "Please enter a password with only numbers and text and atleast 5 characters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Password need to match!");
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.post("/delete-user", validateToken, authController.postDeleteProfile);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post(
  "/reset",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
  ],
  authController.postReset
);

router.get("/reset/:token", authController.getNewPassword);

router.post(
  "/new-password",
  [
    body(
      "password",
      "Please enter a password with only numbers and text and atleast 5 characters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postNewPassword
);

module.exports = router;
