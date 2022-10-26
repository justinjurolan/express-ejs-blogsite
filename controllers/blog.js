// const fs = require("fs");
// const path = require("path");
const Blog = require("../models/blogList");

/** Pagination Content */
const ITEMS_PER_PAGE = 2;

exports.getBlogs = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Blog.find()
    .countDocuments()
    .then((numUsers) => {
      totalItems = numUsers;
      return Blog.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((blogs) => {
      res.render("blog/blog-list", {
        blog: blogs,
        pageTitle: "Active Blogs",
        path: "/blogs",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getBlog = (req, res, next) => {
  const blogId = req.params.blogId;

  Blog.findById(blogId)
    .then((blogs) => {
      res.render("blog/blog-details", {
        blogs: blogs,
        pageTitle: blogs.title,
        path: "/blog",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Blog.find()
    .countDocuments()
    .then((numUsers) => {
      totalItems = numUsers;
      return Blog.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((blogs) => {
      res.render("blog/index", {
        blog: blogs,
        pageTitle: "Blog List",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.searchBlog = async (req, res, next) => {
  try {
    const searchBlog = req.body.searchBlog;

    const blog = await Blog.find({
      $text: { $search: searchBlog, $diacriticSensitive: true },
    });

    res.render("blog/search-blog", {
      pageTitle: "Search Blog",
      blogs: blog,
      path: "/blogs/search",
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
