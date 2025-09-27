import { Router } from "./Scripts/router";

let router: Router;
addEventListener('DOMContentLoaded', () => {
  router = new Router();
  globalThis.debug = {
    router
  }
});
