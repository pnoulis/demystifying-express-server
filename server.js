import { createServer } from "node:http";

export { app };

function app() {
  this.routes = {};
  const _app = handleRequest.bind(this);
  _app.use = use.bind(this);
  _app.get = get.bind(this);
  _app.start = start.bind(this, _app);
  return _app;
}
function start(app, port, cb) {
  const server = createServer(app);
  server.listen(port, cb);
}
function use(...middleware) {
  this.routes["*"] = {
    middleware: (this.routes["*"]?.middleware || []).concat(...middleware),
  };
}
function get(path, ...middleware) {
  this.routes[path] = {
    pre: [...this.routes["*"].middleware],
    middleware: (this.routes[path]?.middleware || []).concat(...middleware),
  };
}
function handleRequest(req, res) {
  let middleware = [
    ...this.routes[req.url].pre,
    ...this.routes[req.url].middleware,
  ];
  res.locals = { i: 0, body: {} };
  run(compose(middleware));
  async function run(route, err) {
    try {
      await route(err, { req, res }, (ctx, next) => {
        res.end(JSON.stringify(ctx.res.locals.body) + "\n");
      });
    } catch (err) {
      middleware = middleware.slice(res.locals.i + 1);
      run(compose(middleware), err);
    }
  }
}
function compose(middleware) {
  return (err, context, next) => {
    let current;
    return dispatch(0);
    function dispatch(i) {
      current = i === middleware.length ? next : middleware[i];
      context.res.locals.i = i;
      if (!current) return err ? Promise.reject(err) : Promise.resolve(context);
      else if (current.length < 3)
        return err
          ? dispatch(i + 1)
          : Promise.resolve().then(() =>
              current(context, dispatch.bind(null, i + 1)),
            );

      const _err = err;
      err = null;
      return Promise.resolve().then(() =>
        current(_err, context, dispatch.bind(null, i + 1)),
      );
    }
  };
}
