import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from './views/DashboardView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/admin/events', redirect: '/' },
    { path: '/archive', redirect: '/' },
    { path: '/leaderboard', redirect: '/' },
    { path: '/play', redirect: '/' },
  ],
});
