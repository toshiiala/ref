import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import axios from 'axios';

// Gebruik het VPS IP-adres of domeinnaam
const API_BASE_URL = 'https://ref.toshilabs.io/api';  // Gebruik HTTPS en je domeinnaam

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

// Add request interceptor
axios.interceptors.request.use(function (config) {
  console.log('Request:', config);
  return config;
}, function (error) {
  console.log('Request error:', error);
  return Promise.reject(error);
});

// Add response interceptor
axios.interceptors.response.use(function (response) {
  console.log('Response:', response);
  return response;
}, function (error) {
  console.log('Response error:', error);
  return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
