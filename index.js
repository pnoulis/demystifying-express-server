import { app } from './server.js';

const PORT = process.env.PORT || 8080;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const api = new app();

api.use(({ req, res } = {}, next) => {
  let t_start = Date.now();
  const url = req.url;
  console.log(`>>>>>>>>>>>>>>>[${t_start}] ${req.method} ${url}`);
  res.on("finish", () => {
    let t_end = Date.now();
    console.log(
      `<<<<<<<<<<<<<<<[${t_end}->${t_end - t_start}] ${req.method} ${url}`,
    );
  });

  return next();
});

api.get(
  "/login",
  async (ctx, next) => {
    ctx.res.locals.body.name = "pnoul";
    console.log("#1st middleware");
    if (ctx.req.headers["x-throw"]) {
      console.log("should throw");
      throw new Error("yolo");
    }
    if (ctx.req.headers["x-delay"]) {
      console.log(`Should delay for: ${ctx.req.headers["x-delay"] || 0}ms`);
      await delay(ctx.req.headers["x-delay"] || 0);
    }
    next();
  },
  (err, ctx, next) => {
    if (err) {
      console.log("error handler #1");
      ctx.res.locals.body.errorCaught ||= ["error handler #1"];
      // Do something to error and rethrow
      err.code = 400;
      throw err;
    } else {
      console.log("calling next");
    }
    next();
  },
  (err, ctx, next) => {
    if (err) {
      console.log("error handler #2");
      ctx.res.locals.body.errorCaught.push("error handler #2");
      ctx.res.locals.body.error = { message: err.message, code: err.code };
    } else {
      console.log("calling next");
    }
    next();
  },

  (ctx, next) => {
    console.log("calling next");
    ctx.res.locals.body.done = true;
    next();
  },
);

api.start(PORT, () => {
  console.log(`Server listening at: '${PORT}'`);
});
