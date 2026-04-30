# 🌐 SAMVAAD – Full-Stack Social Media Platform

Samvaad is a modern, full-stack social media application built with **React**, **Node.js**, **Socket.IO**, **PostgreSQL**, **Redis**, and **Docker**.  
It supports **real-time messaging**, **AI chatbot**, **media uploads**, **notifications**, **analytics**, and **background processing** using Celery.  
Designed for performance, scalability, and a smooth user experience.

---

## 🚀 Live Status
📌 *Self-hosted development project (no public deployment yet)*

---

## 🏗️ Tech Stack

### **Frontend**
- React 19 (Vite)
- Tailwind CSS
- React Router
- Socket.IO Client
- Axios
- Emoji Picker

### **Backend**
- Node.js + Express
- Sequelize ORM (PostgreSQL)
- Socket.IO server
- Multer + Cloudinary (media uploads)
- JWT Authentication
- Winston Logging (ELK optional)
- Bull/BullMQ message queues

### **Database & Cache**
- PostgreSQL  
- Redis (cache, queues, socket adapter)  
- Elasticsearch (log indexing)

### **DevOps / Monitoring**
- Docker & Docker Compose  
- Prometheus + Grafana  
- ELK Stack (Elasticsearch, Logstash, Kibana)  
- Python Celery Worker  

---

## ✨ Features

### 🧑‍🤝‍🧑 **User Management**
- JWT authentication (signup/login)
- Profile with bio, avatar, followers & following
- Update profile, view stats

### 📝 **Content Creation**
- Create posts (Images, Videos, Blogs, Music)
- Capture photos directly using camera (getUserMedia)
- Cloudinary-based media storage
- Category-wise feed: *For You, Music, Videos, Blogs, Tech, Sports*

### ❤️ **Social Features**
- Like / Unlike posts
- Comment & reply
- Save posts
- Share functionality
- Real-time updates using Socket.IO

### 💬 **Real-Time Messaging**
- One-on-one chat
- Group messaging
- Typing indicators
- Read receipts
- Online/offline status
- Emoji support
- Persistent chat history

### 🤖 **AI Chatbot (Mistral API)**
- Context-aware (remembers last 8 messages)
- Date-aware responses
- Friendly conversational personality
- Fallback responses when API unavailable

### 🔔 **Notifications**
- New likes, comments, followers, messages
- Real-time via Socket.IO
- Unread counters

### 📊 **Monitoring & Analytics**
- Prometheus metrics
- Grafana dashboards
- ELK log collection
- API rate limiting:
  - API: 2000 req / 15 min  
  - Auth: 100 req / 15 min  
  - Bot: 60 messages/min  
  - Upload: 100 uploads/hour  

---


