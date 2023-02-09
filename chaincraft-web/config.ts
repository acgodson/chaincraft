import { initializeApp } from 'firebase/app';
import 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAI5xQNW0EIAmZXlPwI6plHkONRd0JF7uA',
  authDomain: 'chaincraft-algo.firebaseapp.com',
  projectId: 'chaincraft-algo',
  storageBucket: 'chaincraft-algo.appspot.com',
  messagingSenderId: '947381692146',
  appId: '1:947381692146:web:b7c1e2ac2970fc1531126b',
  measurementId: 'G-1VDXRQ5JD6',
};

export const WEB3AUTH_CLIENT_ID =
  'BCnTmYDhRJFuNemzqEyUR73THkOy2S6Hdz7Jhk9HE9QK3RyWQ_svaQBNnyJCE2wO6u0AR0cSlxIQWHeDUr7k5Xk';

export function initFirebase() {
  initializeApp(firebaseConfig);
}

export const ALGO_API_KEY = 'c8sJuxFbqE8a7xOTWM4ZC3PpoILhc2qk1sSVm6Vh';
