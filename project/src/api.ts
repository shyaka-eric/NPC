import axios from "axios";

export const API_URL = "http://localhost:8000/api/";

export const api = axios.create({
  baseURL: API_URL,
  // You can add headers here if you use authentication
}); 