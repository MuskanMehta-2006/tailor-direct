
# ✦ TAILOR DIRECT
### Bespoke Menswear. Designed Around You.

A full-stack custom suit configurator that transforms the traditional tailoring experience into a seamless digital journey.

Tailor Direct allows customers to personalize their suits, explore fabric tiers, select jacket styles, add custom monograms, and submit measurements. Every order is validated on the backend and converted into a factory-ready production ticket.

<p align="center">
  <a href="https://tailor-direct.vercel.app">🌐 Live Demo</a> •
  <a href="https://github.com/MuskanMehta-2006/tailor-direct">💻 GitHub Repository</a> •
  <a href="https://tailor-direct-api.onrender.com">⚙️ Backend API</a>
</p>

---

## ✨ Project Highlights

- Interactive custom suit configurator.
- Real-time order price calculation.
- Three fabric quality tiers.
- Classic and Slim Fit jacket options.
- Custom monogram personalization.
- Chest measurement validation.
- Server-side business rule enforcement.
- UUID-based idempotent order processing.
- PostgreSQL order persistence.
- Automated factory production ticket generation.
- Responsive and premium user interface.

## 🧵 Product Customization

| Fabric Tier | Base Price |
|---|---:|
| Standard | $169 |
| Premium | $219 |
| Luxury | $299 |

### Jacket Styles

- Classic Fit
- Slim Fit

**Business Rule:** Slim Fit is available only with Premium and Luxury fabric tiers.

### Personalization

| Option | Rule |
|---|---|
| Custom Monogram | Optional |
| Maximum Characters | 10 |
| Monogram Charge | +$15 |
| Chest Measurement | 34–54 inches |

The order summary updates dynamically as the customer changes their selections.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Build Tool | Vite |
| Styling | CSS |
| Backend | Node.js |
| API Framework | Express.js |
| Database | PostgreSQL |
| Database Hosting | Neon |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| API Communication | REST |

---

## ⚙️ System Architecture

```text
              CUSTOMER
                  |
                  v
        REACT SUIT CONFIGURATOR
                  |
                  | Order Configuration
                  | Idempotency UUID
                  v
          EXPRESS REST API
                  |
                  v
        SERVER-SIDE VALIDATION
                  |
          +-------+-------+
          |               |
          v               v
     Price Check     Rule Validation
          |               |
          +-------+-------+
                  |
                  v
          IDEMPOTENCY CHECK
                  |
                  v
          POSTGRESQL DATABASE
                  |
                  v
       FACTORY PRODUCTION TICKET
                  |
                  v
          JSON API RESPONSE
```

---

## 🔐 Backend Engineering

### 1. Server-Side Validation

All important business rules are independently validated by the backend.

- Validates fabric tier.
- Validates jacket style compatibility.
- Restricts monogram length to 10 characters.
- Validates chest measurement between 34 and 54 inches.
- Calculates the final price on the server.

The backend never relies on a frontend-calculated price.

### 2. Idempotent Order Processing

Every order request includes a frontend-generated UUID.

The PostgreSQL database enforces a unique constraint on `idempotency_key`.

If the same request is submitted again with the same key, the existing production ticket is returned instead of inserting a duplicate record.

### 3. Factory Production Ticket

Each successfully processed order generates a ticket containing:

- `ticket_id`
- `tier`
- `jacket_style`
- `monogram`
- `chest_inches`
- `verified_total_price`

---

## 📡 API Documentation

### Create Production Order

`POST /api/orders`

**Production URL**

```text
https://tailor-direct-api.onrender.com/api/orders
```

**Request Body**

```json
{
  "idempotency_key": "6f2cf15c-74a5-4ecb-b4e5-5934fb84283a",
  "tier": "PREMIUM",
  "jacket_style": "SLIM",
  "monogram": "MG",
  "chest_inches": 40
}
```

**Example Successful Response**

```json
{
  "ticket_id": "generated-uuid",
  "tier": "PREMIUM",
  "jacket_style": "SLIM",
  "monogram": "MG",
  "chest_inches": 40,
  "verified_total_price": 234
}
```

**Price Calculation**

```text
Premium Fabric       $219
Custom Monogram      $15
-------------------------
Verified Total       $234
```

### HTTP Status Codes

| Status | Meaning |
|---|---|
| 201 | Order created successfully |
| 200 | Existing order returned |
| 400 | Invalid configuration |
| 500 | Internal server error |

---

## 🗄️ Database Design

Orders are stored in the PostgreSQL table:

`public.production_tickets`

| Column | Description |
|---|---|
| ticket_id | Unique production ticket UUID |
| idempotency_key | Unique request identifier |
| tier | Selected fabric tier |
| jacket_style | Selected jacket style |
| monogram | Optional initials |
| chest_inches | Customer chest measurement |
| verified_total_price | Backend-calculated price |
| created_at | Order creation timestamp |

---

## 📁 Project Structure

```text
tailor-direct/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── SuitViewer.jsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── routes/
│   │   └── orders.js
│   ├── db.js
│   ├── server.js
│   └── package.json
│
├── package.json
└── README.md
```

---

## 🚀 Run Locally

### Prerequisites

- Node.js
- npm
- PostgreSQL database

### 1. Clone Repository

```bash
git clone https://github.com/MuskanMehta-2006/tailor-direct.git

cd tailor-direct
```

### 2. Configure Backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=development
PORT=5000
```

Start the backend:

```bash
node server.js
```

Backend:

`http://localhost:5000`

### 3. Configure Frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

Open the local Vite URL displayed in your terminal.

Configure the frontend API endpoint:

```text
http://localhost:5000/api/orders
```

For production:

```text
https://tailor-direct-api.onrender.com/api/orders
```

---

## ☁️ Deployment

| Component | Platform |
|---|---|
| React Frontend | Vercel |
| Express Backend | Render |
| PostgreSQL Database | Neon |

Environment variables are configured through deployment settings. Database credentials and `.env` files must never be committed to the repository.

---

## 🎯 Engineering Goals

The project demonstrates practical full-stack engineering concepts:

- Component-based frontend development.
- REST API design.
- Business logic enforcement.
- Server-side price verification.
- Database constraints and persistence.
- Idempotent request handling.
- Production ticket generation.
- Cloud deployment and environment configuration.

---

## 👩‍💻 Author

**Muskan**

Full-Stack Developer | Software Engineering

Built with React, Node.js, Express.js and PostgreSQL.

---

<p align="center">
  <strong>TAILOR DIRECT</strong><br/>
  Crafted for Individuality. Engineered for Precision.
</p>
