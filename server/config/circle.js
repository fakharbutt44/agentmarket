const axios = require('axios');

const circleClient = axios.create({
  baseURL: process.env.CIRCLE_BASE_URL || 'https://api-sandbox.circle.com',
  headers: {
    Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

circleClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Circle API error';
    const err = new Error(message);
    err.statusCode = error.response?.status || 500;
    err.circleError = error.response?.data;
    return Promise.reject(err);
  }
);

module.exports = circleClient;
