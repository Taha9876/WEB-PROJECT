# Doctor Module

Doctor module extracted from the Smart Fitness Website project.

## Structure

```
client/src/pages/doctor/
  ├── DoctorDashboard.jsx
  ├── DoctorAppointments.jsx
  ├── DoctorChat.jsx
  ├── DoctorPatients.jsx
  └── DoctorRecommendations.jsx

server/routes/
  └── consultations.js   # Backend API supporting the doctor module
```

## Frontend Pages

- **DoctorDashboard.jsx** — Overview dashboard for doctors.
- **DoctorAppointments.jsx** — Manage and view scheduled appointments.
- **DoctorChat.jsx** — Real-time chat with patients.
- **DoctorPatients.jsx** — Patient list and profiles.
- **DoctorRecommendations.jsx** — Send/manage recommendations to patients.

## Backend API (`/api/consultations`)

| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| GET    | `/doctors`                      | List available doctors       |
| POST   | `/book`                         | Book an appointment          |
| GET    | `/messages/:appointmentId`      | Get chat messages            |
| POST   | `/messages`                     | Send a chat message          |
| GET    | `/recommendations/:userId`      | Get user recommendations     |

## Usage

Drop the `client/src/pages/doctor/` folder into your React app's pages directory and mount the routes. Mount the backend route in your Express server:

```js
app.use('/api/consultations', require('./routes/consultations'));
```
