# HashChat

**A secure and robust real-time messaging platform featuring a public Global Stage and secure Private Rooms.**

---

## 📖 Overview

HashChat is a full-stack real-time chat application designed for scalability and user experience. It offers a unique dual-mode experience:
1.  **The Global Stage:** An open, public channel where authenticated users and guests (with auto-generated avatars/names) can interact instantly.
2.  **Private Rooms:** Secure, ID-based rooms for persistent group conversations with message history.

The system utilizes a **Hybrid Database Architecture**, leveraging **PostgreSQL** for relational data (Users, Rooms, Memberships) and **MongoDB** for high-volume message storage.

## Key Features

### 🚀 Real-Time Communication
* **Low Latency:** Powered by **WebSocket (STOMP/SockJS)** for instant message delivery.
* **Live Presence:** Real-time tracking of online users within private rooms.
* **Typing Indicators & Updates:** Instant feedback on user actions.

### 🛡️ Authentication & Security
* **Secure Access:** JWT (JSON Web Token) authentication with HttpOnly cookies.
* **Email Verification:** OTP-based email verification using SMTP (Gmail).
* **Guest Mode:** Anonymous access to the Global Stage with fun, auto-generated identities (e.g., `Happy_Panda_42`) and UI Avatars.

### 💾 Hybrid Data Storage
* **PostgreSQL:** Handles strict schema data like User Profiles and Room Memberships.
* **MongoDB:** Handles the heavy lifting of storing chat history and message logs for speed and scalability.
* **Cloudinary:** Handles image storage.

### 🎨 User Experience
* **Clean UI/UX:** Easy to understand and interact ui design.
* **Responsive Design:** Mobile-first UI with swipe gestures for sidebar navigation.
* **Profile Management:** Custom avatars, bio updates, and account management.
* **Message History:** Automatic pagination and history loading for private rooms.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS
* **State Management:** Context API
* **Networking:** Axios, SockJS, StompJS
* **Routing:** React Router DOM
* **UI Components:** React Hot Toast, React Icons

### Backend
* **Framework:** Java Spring Boot 3
* **Security:** Spring Security, JWT
* **Real-time:** Spring WebSocket
* **ORM:** Hibernate (JPA) for SQL, Spring Data MongoDB for NoSQL

### Infrastructure & Tools
* **Databases:** PostgreSQL & MongoDB
* **Storage:** Cloudinary (Image CDN)
* **Build Tools:** Maven (Backend), NPM (Frontend)

---

## 📸 Screenshots

| **Global Stage (Mobile)** | **Private Room (Desktop)** |
|:---:|:---:|
| ![Global Chat](https://placehold.co/300x600?text=Screenshot+Mobile) | ![Private Room](https://placehold.co/600x400?text=Screenshot+Desktop) |

| **Login / Auth** | **Profile Settings** |
|:---:|:---:|
| ![Login](https://placehold.co/400x300?text=Login+Screen) | ![Profile](https://placehold.co/400x300?text=Profile+Screen) |

---

## ⚙️ Installation & Setup

### Prerequisites
* Java JDK 17+
* Node.js & npm
* PostgreSQL
* MongoDB
* A Cloudinary Account
* A Gmail Account (for App Password SMTP)

### 1. Backend Setup (Spring Boot)

1.  Clone the repository:
    ```bash
    git clone [https://github.com/realHKV/HashChat.git](https://github.com/realHKV/HashChat.git)
    cd HashChat/backend
    ```
2.  Configure `src/main/resources/application.properties`:
    ```properties
    # Database Configuration
    spring.datasource.url=jdbc:postgresql://localhost:5432/hashchat_db
    spring.datasource.username=your_postgres_user
    spring.datasource.password=your_postgres_password
    
    spring.data.mongodb.uri=mongodb://localhost:27017/hashchat_mongo

    # Email (SMTP)
    spring.mail.username=your_email@gmail.com
    spring.mail.password=your_app_password

    # Cloudinary
    cloudinary.cloud_name=your_cloud_name
    cloudinary.api_key=your_api_key
    cloudinary.api_secret=your_api_secret

    # JWT Secret
    jwt.secret=your_very_long_secret_key
    ```
3.  Run the application:
    ```bash
    mvn spring-boot:run
    ```

### 2. Frontend Setup (React)

1.  Navigate to the frontend folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root of the frontend:
    ```env
    VITE_BACKEND_API_BASE_URL=http://localhost:8080
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

---

## 🔌 API Endpoints (Snapshot)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/v1/auth/signup` | Register a new user |
| **POST** | `/api/v1/auth/login` | Authenticate and get JWT |
| **GET** | `/api/v1/rooms/{roomId}` | Join or get room details |
| **GET** | `/api/v1/rooms/{roomId}/messages` | Get chat history |
| **WS** | `/chat` | WebSocket connection endpoint |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 reakHKV

**Harsh Kumar Verma**
* LinkedIn: [Your LinkedIn Profile](https://linkedin.com/in/yourprofile)
* GitHub: [imnotharsh](https://github.com/imnotharsh)
