import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

const containerID = 'tampermonkey_vue_app'.toUpperCase()

createApp(App).mount((() => {
  const app = document.createElement('div')
  app.id = containerID
  app.style.cssText = 'position: fixed;top: 10px;left:50%;z-index:1000;transform: translateX(-50%);pointer-events: none;'
  document.body.append(app)
  return app
})())
