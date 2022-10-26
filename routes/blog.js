const express = require("express");

const blogController = require("../controllers/blog");

const { validateToken } = require("../util/is-auth");

const router = express.Router();

router.get("/", blogController.getIndex);

router.get("/blog/:blogId", blogController.getBlog);

router.get("/blogs", validateToken, blogController.getBlogs);

router.post("/blogs/search", blogController.searchBlog);

module.exports = router;
