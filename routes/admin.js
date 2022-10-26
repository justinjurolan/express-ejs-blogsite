const path = require("path");

const express = require("express");
const { body } = require("express-validator");

const adminController = require("../controllers/admin");
const { validateToken } = require("../util/is-auth");

const router = express.Router();

router.get("/add-blogs", validateToken, adminController.getAddBlog);

router.get("/blogs", validateToken, adminController.getBlogs);

router.post(
  "/add-blogs",
  [
    body("title", "Title must not be empty")
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("description", "Description must not be empty")
      .isLength({ min: 5, max: 800 })
      .trim(),
  ],
  validateToken,
  adminController.postAddBlog
);

router.get("/edit-blog/:blogId", validateToken, adminController.getEditBlog);

router.post(
  "/edit-blog",
  [
    body("title").isString().isLength({ min: 3 }).trim(),
    body("description").isLength({ min: 5, max: 800 }).trim(),
  ],
  validateToken,
  adminController.postEditBlog
);

router.post("/delete-blog", validateToken, adminController.postDeleteBlog);

module.exports = router;
