import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import DataVVue3 from '@kjgl77/datav-vue3'
const app = createApp(App)

app.use(router)
app.use(DataVVue3)
app.mount('#app')
