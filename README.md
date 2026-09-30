# Emergency Vehicle Dispatch System

**Emergency Vehicle Dispatch System** is a real-time web-based emergency response platform designed to improve the communication and coordination between people requesting emergency assistance, administrators, and emergency vehicle drivers.

The system allows users to send emergency requests along with their location, while administrators can monitor emergency vehicle drivers and their availability. Drivers receive emergency notifications in real time and can view their location through an integrated Google Maps interface.

## Features

* User login and authentication
* Separate dashboards for users, administrators, and drivers
* Emergency request submission
* Real-time user location detection using browser geolocation
* Google Maps integration for displaying locations
* Admin dashboard for monitoring emergency vehicle drivers
* Driver information and vehicle type management
* Driver availability status management
* Real-time emergency notifications using Socket.IO
* Backend communication using REST APIs and Axios
* Support for different emergency vehicles such as ambulances, police vehicles, and fire vehicles
* Centralized emergency response coordination
* Real-time communication between users and emergency responders

## Technology Stack

* **JavaScript**
* **React.js**
* **Node.js**
* **Express.js**
* **Axios**
* **Socket.IO**
* **Google Maps JavaScript API**
* **Browser Geolocation API**
* **JSON**
* **HTML**
* **CSS**

## How It Works

1. The user signs into the system.
2. The system identifies the user as a normal user, administrator, or emergency vehicle driver.
3. A user can open the User Dashboard and allow access to their current location.
4. Google Maps displays the user's current location.
5. The user clicks **Send Emergency Request** to request emergency assistance.
6. The request is sent to the backend server.
7. The system communicates the emergency request to the appropriate emergency response personnel.
8. Connected drivers receive the emergency notification through Socket.IO.
9. The driver can view their location and respond to the emergency.
10. Administrators can monitor driver information and update vehicle availability.

The project is designed to reduce communication delays and improve coordination during emergency situations.

## User Dashboard

The User Dashboard provides the interface for people who require emergency assistance.

Features include:

* Current location detection
* Google Maps display
* Interactive location marker
* Emergency request button
* Emergency request confirmation
* Communication with the backend server

When the user selects **Send Emergency Request**, the application sends the request to the backend and displays a confirmation message.

## Admin Dashboard

The Admin Dashboard allows administrators to monitor emergency vehicle drivers.

Administrators can:

* View driver information
* View vehicle types
* Check driver availability
* Change driver status
* Monitor available and busy vehicles

Driver information is retrieved from the backend and displayed in a dashboard table. Changes to driver status are sent back to the backend using a PATCH request.

## Driver Dashboard

The Driver Dashboard is designed for emergency vehicle drivers such as ambulance, police, and fire-service drivers.

Features include:

* Driver information
* Vehicle type information
* Current driver location
* Google Maps integration
* Real-time emergency notifications
* Socket.IO communication

When a user sends an emergency request, the backend emits an emergency event through Socket.IO. The driver's dashboard receives the event and displays an emergency notification.

## Location Tracking

The system uses the browser's built-in Geolocation API to obtain the user's or driver's current position.

The latitude and longitude coordinates are then used with the **Google Maps JavaScript API** to display the current location on an interactive map.

```javascript
navigator.geolocation.getCurrentPosition()
```

The system displays a marker representing the current location of the user or driver.

## Real-Time Emergency Communication

Emergency notifications are handled using **Socket.IO**.

The communication flow is:

```text
User
  │
  │ Emergency Request
  ▼
Backend Server
  │
  │ Socket.IO Event
  ▼
Driver Dashboard
  │
  ▼
Emergency Notification
```

This allows connected drivers to receive emergency requests without requiring the dashboard to be manually refreshed.

## API Communication

The frontend communicates with the backend using **Axios**.

Some of the main operations include:

```text
GET    /drivers
PATCH  /drivers/:id
POST   /request
```

These operations are used to retrieve driver information, update driver status, and submit emergency requests.

## Project Structure

```text
Emergency-Vehicle-Dispatch-System/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── UserDashboard.jsx
│   │       ├── AdminDashboard.jsx
│   │       └── DriverDashboard.jsx
│   │
│   └── package.json
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── README.md
└── .gitignore
```

> The exact folder structure may vary depending on how the project files are organized in the repository.

## Development

To run the project from source, install the required dependencies for both the frontend and backend.

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Start the Backend

```bash
npm start
```

or, depending on the backend configuration:

```bash
node server.js
```

### Start the Frontend

```bash
npm start
```

The frontend and backend should be running simultaneously for the complete system to function.

## Google Maps API

The project uses the **Google Maps JavaScript API** for displaying user and driver locations.

The application requires a Google Maps API key.

Example:

```javascript
https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY
```

Replace `YOUR_API_KEY` with your own API key.

**Important:** Do not upload your actual API key to a public GitHub repository. Store sensitive keys using environment variables.

## System Requirements

### Hardware

* Computer or laptop
* Intel Core i5/i7 or Apple M1 equivalent
* 16 GB RAM recommended
* 512 GB SSD recommended
* Full HD display
* Internet connection
* Location-enabled browser

### Software

* Windows, macOS, or Linux
* Node.js
* npm
* Modern web browser
* Visual Studio Code
* Google Maps API key

The hardware and software requirements are based on the requirements specified in the project report.

## Emergency Vehicle Types

The system is designed to support different types of emergency vehicles:

```text
Ambulance
    │
    ├── Medical emergencies
    │
    ▼

Police Vehicle
    │
    ├── Public safety emergencies
    │
    ▼

Fire Vehicle
    │
    └── Fire and disaster emergencies
```

The proposed system is intended to coordinate ambulances, police vehicles, and fire vehicles through a common platform.

## Project Goal

The goal of the Emergency Vehicle Dispatch System is to provide a faster and more coordinated emergency response mechanism.

The system aims to reduce delays caused by manual vehicle assignment, improve communication between users and emergency responders, provide location information, and enable real-time emergency notifications.

The project is intended as a technology-based solution that can contribute to safer and more responsive emergency services.


## License

This project is developed as an academic project.


