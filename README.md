# SplitWise - Expense Sharing Application

A full-stack expense sharing app with proper SQLite persistence, JWT authentication, and multi-user support.

## 📋 Prerequisites

- **Node.js** v22.12.0 or higher
- **npm** 10.0.0 or higher
- Windows PowerShell (for scripts) or bash (Linux/macOS)

## 🚀 Quick Start

### Option 1: Full Stack (Recommended)

Run both server and client together:

```bash
cd splitwise
PowerShell -NoProfile ./start-dev.ps1
```

This will:
- Start the backend server on `http://localhost:3000`
- Start the frontend dev server on `http://localhost:5173`
- Automatically open the frontend in your browser

### Option 2: Run Individually

**Terminal 1 - Server:**
```bash
cd splitwise/server
npm install
npm start
```

Server will be available at `http://localhost:3000`

**Terminal 2 - Client:**
```bash
cd splitwise/client
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 🔐 Authentication

The app uses JWT-based authentication:

1. Users **register** with name, email, and password
2. Server returns a JWT token
3. Token is stored in localStorage
4. Token is included in `Authorization: Bearer <token>` header for all protected endpoints
5. Users can switch between accounts via the header dropdown

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "2025-12-23T..."
  }
}
```

## ✨ Features

### Group Management
- Create groups for different purposes (trips, apartments, projects)
- Add members to groups
- View group details and member list
- Auto-add creator as first member

### Expense Tracking
- Record expenses with three split methods:
  - **EQUAL**: Splits evenly among participants
  - **EXACT**: Specify exact amounts for each person
  - **PERCENTAGE**: Distribute by percentage
- Automatically updates all member balances
- View expense history
- Delete expenses and recalculate balances

### Balance Tracking
- Track who owes whom in each group
- View simplified settlements (minimal payment plan)
- See net balance across all groups
- Real-time balance updates

### Settlement
- Record payments to settle up
- Automatically reduces corresponding balances
- View settlement history
- Prevent overpayment

## 🛣️ API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user  
- `GET /api/auth/me` - Get current user (requires token)

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - List all groups
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/members` - Add member to group
- `GET /api/groups/:id/expenses` - List group expenses
- `GET /api/groups/:id/balances` - Get all balances in group
- `GET /api/groups/:id/balances/simplified` - Get simplified settlements

### Expenses
- `POST /api/expenses` - Create expense with splits
- `GET /api/expenses/:id` - Get expense details
- `DELETE /api/expenses/:id` - Delete expense

### Settlements
- `POST /api/settlements` - Record a settlement payment
- `GET /api/settlements/:id` - Get settlement details
- `GET /api/settlements/groups/:groupId` - Get group settlements

## 🧪 Testing

Run the automated test suite:

```bash
cd splitwise/server
PowerShell -NoProfile ./run-tests.ps1
```

This will:
1. Clear the database
2. Start the server
3. Run comprehensive E2E tests
4. Verify all endpoints work correctly

## 🔧 Technology Stack

**Backend:**
- Node.js + Express.js
- SQLite (sql.js) - pure JS, file-persisted
- JWT (jsonwebtoken)
- bcryptjs for password hashing
- UUID for IDs

**Frontend:**
- React 19 with Hooks
- TypeScript
- Vite (fast dev server & build)
- React Router v7
- Tailwind CSS v4 (styling)
        │   ├── groupRoutes.js
        │   ├── expenseRoutes.js
        │   └── settlementRoutes.js
        └── test-scenarios.js # Test scenarios
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000`

### Running Tests

Execute the test scenarios:
```bash
node src/test-scenarios.js
```

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/balances` - Get user's balances across all groups

### Groups
- `POST /api/groups` - Create a new group
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get group by ID
- `POST /api/groups/:id/members` - Add member to group
- `GET /api/groups/:id/expenses` - Get group expenses
- `GET /api/groups/:id/balances` - Get group balances
- `GET /api/groups/:id/balances/simplified` - Get simplified balances

### Expenses
- `POST /api/expenses` - Add a new expense
- `GET /api/expenses/:id` - Get expense details
- `DELETE /api/expenses/:id` - Delete expense

### Settlements
- `POST /api/settlements` - Record a settlement
- `GET /api/settlements/:id` - Get settlement details
- `GET /api/settlements/groups/:groupId` - Get group settlements

## Quick Example

```javascript
// 1. Create users
const alice = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' })
}).then(r => r.json());

const bob = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Bob', email: 'bob@example.com' })
}).then(r => r.json());

// 2. Create group
const group = await fetch('http://localhost:3000/api/groups', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Friends',
    description: 'Friend expenses',
    createdBy: alice.id
  })
}).then(r => r.json());

// 3. Add Bob to group
await fetch(`http://localhost:3000/api/groups/${group.id}/members`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: bob.id })
});

// 4. Add expense (Alice pays for dinner)
const expense = await fetch('http://localhost:3000/api/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    groupId: group.id,
    description: 'Dinner',
    totalAmount: 100,
    paidBy: alice.id,
    splitType: 'EQUAL',
    splits: [
      { userId: alice.id },
      { userId: bob.id }
    ]
  })
}).then(r => r.json());

// 5. Check balances
const balances = await fetch(`http://localhost:3000/api/groups/${group.id}/balances`)
  .then(r => r.json());
console.log(balances); // Bob owes Alice $50
```

## Design Decisions

### 1. Split Type Implementation
- **Equal**: Simple division, handles rounding
- **Exact**: Validates sum equals total amount
- **Percentage**: Converts percentages to amounts, validates sum is 100%

### 2. Balance Tracking
- Direct balance updates when expenses are added
- Bidirectional balance consolidation (A owes B $50 + B owes A $30 = A owes B $20)
- Net balance calculation for users across all groups

### 3. Balance Simplification Algorithm
Uses a greedy algorithm:
1. Calculate net balance for each user
2. Separate into debtors (negative) and creditors (positive)
3. Match largest debtor with largest creditor
4. Minimize total number of transactions

**Example**:
```
Before: A→B: $20, A→C: $30, B→C: $10 (3 transactions)
After: A→C: $50 (1 transaction)
```

### 4. Data Storage
- In-memory storage using Maps for O(1) lookups
- Easily extensible to database (MongoDB, PostgreSQL)
- Service layer separates business logic from storage

### 5. Error Handling
- Comprehensive validation at multiple levels
- Descriptive error messages
- Consistent error response format

## Architecture Highlights

### Service Layer Architecture
- **UserService**: User management and validation
- **GroupService**: Group operations and member management
- **BalanceService**: Balance calculations and simplification
- **ExpenseService**: Expense management and balance updates
- **SettlementService**: Settlement recording and validation

### Model Validation
- Models contain their own validation logic
- Services perform business rule validation
- Routes handle HTTP-specific validation

### Balance Consistency
- All balance updates go through BalanceService
- Balances automatically recalculated when expenses are deleted
- Settlement validation prevents invalid state

## Future Enhancements

### Phase 2
- [ ] Database persistence (MongoDB/PostgreSQL)
- [ ] User authentication (JWT)
- [ ] Currency support and conversion
- [ ] Receipt/image upload
- [ ] Email notifications
- [ ] Export functionality (CSV, PDF)

### Phase 3
- [ ] Mobile app integration
- [ ] Real-time updates (WebSocket)
- [ ] Payment gateway integration
- [ ] Advanced analytics and reports
- [ ] Recurring expenses
- [ ] Budget tracking

## Documentation

- **[DESIGN.md](../DESIGN.md)**: Comprehensive design documentation including architecture, algorithms, and data models
- **[API_EXAMPLES.md](../API_EXAMPLES.md)**: Detailed API usage examples with curl commands and scenarios

## Testing

The application includes comprehensive test scenarios covering:
- Equal split calculations
- Exact amount split validation
- Percentage split validation
- Settlement workflows
- Complex balance simplification
- Error handling and edge cases

## Performance

- **Add Expense**: O(n) where n = number of participants
- **Simplify Balances**: O(n log n) where n = number of users
- **Get Balances**: O(1) with proper indexing

## License

ISC

## Author

Rachit

---

**Note**: This is a demonstration/assignment project. For production use, add proper database, authentication, and security measures.
