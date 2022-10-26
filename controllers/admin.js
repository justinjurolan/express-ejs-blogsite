const { validationResult } = require("express-validator");

const Blog = require("../models/blogList");
const fileHelper = require("../util/file");

exports.getAddBlog = (req, res, next) => {
  res.render("admin/edit-blog", {
    pageTitle: "Add Blog",
    path: "/dashboard/add-blogs",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.postAddBlog = (req, res, next) => {
  const title = req.body.title;
  const description = req.body.description;
  const image = req.file;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-blog", {
      pageTitle: "Add Blog",
      path: "/dashboard/add-blogs",
      editing: false,
      hasError: true,
      blog: {
        title: title,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  if (!image) {
    return res.status(422).render("admin/edit-blog", {
      pageTitle: "Add Blog",
      path: "/dashboard/add-blogs",
      editing: false,
      hasError: true,
      blog: {
        title: title,
        description: description,
      },
      errorMessage: "Attached file is not an image.",
      validationErrors: [],
    });
  }

  const imageUrl = image.path;

  const blog = new Blog({
    title: title,
    description: description,
    imageUrl: imageUrl,
    createdBy: res.locals.isAuthenticated.username,
    userId: res.locals.isAuthenticated._id,
  });

  blog
    .save()
    .then((result) => {
      console.log("Created Blog");
      res.redirect("/dashboard/blogs");
    })

    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditBlog = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const blogId = req.params.blogId;

  Blog.findById(blogId)
    .then((blogs) => {
      if (!blogs) {
        return res.redirect("/");
      }
      res.render("admin/edit-blog", {
        pageTitle: "Edit Blog",
        path: "/dashboard/edit-blog",
        editing: editMode,
        blog: blogs,
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

exports.postEditBlog = (req, res, next) => {
  const blogId = req.body.blogId;
  const updatedTitle = req.body.title;
  const updatedDescription = req.body.description;
  const image = req.file;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-blog", {
      pageTitle: "Edit Blog",
      path: "/dashboard/edit-blog",
      editing: false,
      hasError: true,
      blog: {
        title: updatedTitle,
        description: updatedDescription,
        _id: blogId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  Blog.findById(blogId)
    .then((blogs) => {
      if (!blogs) {
        return res.redirect("/");
      }

      if (
        blogs.userId.toString() !== res.locals.isAuthenticated._id.toString()
      ) {
        return res.redirect("/");
      }

      blogs.title = updatedTitle;
      blogs.description = updatedDescription;
      if (image) {
        fileHelper.deleteFile(blogs.imageUrl);
        blogs.imageUrl = image.path;
      }
      return blogs.save().then((result) => {
        console.log("BLOG UPDATED!");
        res.redirect("/dashboard/blogs");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getBlogs = (req, res, next) => {
  Blog.find({ userId: res.locals.isAuthenticated._id })
    .then((blogs) => {
      res.render("admin/blogs", {
        blog: blogs,
        pageTitle: "Admin",
        path: "/dashboard/blogs",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteBlog = (req, res, next) => {
  const blogId = req.body.blogId;

  Blog.findById(blogId)
    .then((blog) => {
      if (!blog) {
        return next(new Error("Blog not found!"));
      }
      fileHelper.deleteFile(blog.imageUrl);
      return Blog.deleteOne({
        _id: blogId,
        userId: res.locals.isAuthenticated._id,
      });
    })
    .then(() => {
      console.log("BLOG REMOVED!");
      res.redirect("/dashboard/blogs");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
