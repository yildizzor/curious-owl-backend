const { UnauthorizedError } = require("express-jwt");

module.exports = (app) => {
  app.use((req, res, next) => {
    // this middleware runs whenever requested page is not available
    res.status(404).json({ message: "This route does not exist" });
  });

  app.use((err, req, res, next) => {
    // whenever you call next(err), this middleware will handle the error
    // always logs the error
    console.error("ERROR", req.method, req.path, err);

    // only render if the error ocurred before sending the response
    if (!res.headersSent) {
      console.log(err);

      if (err instanceof UnauthorizedError) {
        // If JWT is null(this throw unauthorizedError), JWT middelware returns null.
        res.status(err.status).json(err.inner);
      }
      if (err.message) {
        res.status(500).json({
          message: err.message,
        });
      }
      res.status(500).json({
        message: "Internal server error. Check the server console",
      });
    }
  });
};
