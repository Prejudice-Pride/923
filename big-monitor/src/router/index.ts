import { createRouter, createWebHistory } from "vue-router";

import Monitor1 from "../views/Monitor1.vue";
import Monitor2 from "../views/Monitor2.vue";
import Monitor3 from "../views/Monitor3.vue";
import Monitor4 from "../views/Monitor4.vue";

const routes = [
  { path: "/", redirect: "/monitor1" },
  { path: "/monitor1", name: "Monitor1", component: Monitor1 },
  { path: "/monitor2", name: "Monitor2", component: Monitor2 },
  { path: "/monitor3", name: "Monitor3", component: Monitor3 },
  { path: "/monitor4", name: "Monitor4", component: Monitor4 },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
