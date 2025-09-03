# 🚀 **SETUP INSTRUCTIONS FOR FREELANCER TESTING**

## **Quick Start Guide**

### **1. Repository Setup**
```bash
# Clone this repository
git clone <your-repo-url>
cd freelancer-testing

# Install dependencies (if needed)
npm install
```

### **2. Environment Setup**
```bash
# Create a .env.local file with test environment variables
NEXT_PUBLIC_SUPABASE_URL=your-test-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-supabase-anon-key
```

### **3. Database Setup**
```sql
-- Run these SQL commands in your test Supabase project
-- This creates the necessary tables for testing

-- Create customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create communications table
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    sender_id UUID,
    recipient_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_data table (for Challenge 4)
CREATE TABLE user_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **4. Sample Data**
```sql
-- Insert sample data for testing
INSERT INTO customers (name, email, company) VALUES
('John Doe', 'john@example.com', 'Acme Corp'),
('Jane Smith', 'jane@example.com', 'Tech Solutions'),
('Bob Johnson', 'bob@example.com', 'Design Studio');

INSERT INTO users (name, email) VALUES
('Admin User', 'admin@example.com'),
('Manager User', 'manager@example.com'),
('Staff User', 'staff@example.com');

INSERT INTO communications (message, sender_id, recipient_id) VALUES
('Hello, how are you?', (SELECT id FROM users LIMIT 1), (SELECT id FROM users OFFSET 1 LIMIT 1)),
('Meeting at 3 PM', (SELECT id FROM users OFFSET 1 LIMIT 1), (SELECT id FROM users LIMIT 1));

INSERT INTO orders (customer_id, total_amount, status) VALUES
((SELECT id FROM customers LIMIT 1), 150.00, 'pending'),
((SELECT id FROM customers OFFSET 1 LIMIT 1), 275.50, 'completed'),
((SELECT id FROM customers OFFSET 2 LIMIT 1), 89.99, 'in_progress');

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
((SELECT id FROM orders LIMIT 1), 'product-1', 2, 75.00),
((SELECT id FROM orders OFFSET 1 LIMIT 1), 'product-2', 1, 275.50),
((SELECT id FROM orders OFFSET 2 LIMIT 1), 'product-3', 3, 29.99);
```

---

## **Challenge-Specific Setup**

### **Challenge 1: Database Function**
- **No additional setup required**
- **Test with the sample data provided**

### **Challenge 2: API Relationships**
- **No additional setup required**
- **Test with the sample data provided**

### **Challenge 3: Service Layer**
- **No additional setup required**
- **Test with the sample data provided**

### **Challenge 4: Authentication**
- **Set up Supabase Auth** in your test project
- **Create test users** for authentication testing
- **Configure RLS policies** if needed

### **Challenge 5: Data Transformation**
- **No additional setup required**
- **Test with the sample data provided**

---

## **Testing Tools**

### **1. API Testing**
```bash
# Use curl or Postman to test API endpoints
curl -X GET http://localhost:3000/api/communications
curl -X GET http://localhost:3000/api/customers
```

### **2. Database Testing**
```sql
-- Test database functions
SELECT update_customer_company('New Company', 'customer-id');

-- Test queries
SELECT * FROM communications;
SELECT * FROM customers;
```

### **3. TypeScript Testing**
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Run type checking
npx tsc --strict
```

---

## **Submission Process**

### **1. Create Your Branch**
```bash
git checkout -b your-name-solutions
```

### **2. Complete Each Challenge**
- **Work on challenges in order** (1-5)
- **Complete all required files** for each challenge
- **Test your solutions** thoroughly

### **3. Submit Your Work**
```bash
# Add your changes
git add .

# Commit your work
git commit -m "Complete all 5 challenges"

# Push your branch
git push origin your-name-solutions

# Create a pull request
```

### **4. Include in Your Submission**
- **Working code solutions**
- **Test cases and results**
- **Explanation documents**
- **Time taken for each challenge**
- **Any questions or clarifications**

---

## **Common Issues and Solutions**

### **Issue 1: Supabase Connection**
```bash
# Check your environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### **Issue 2: TypeScript Errors**
```bash
# Install TypeScript if needed
npm install -D typescript @types/node

# Check for type errors
npx tsc --noEmit
```

### **Issue 3: Database Permissions**
```sql
-- Check if you have the right permissions
SELECT current_user;
SELECT current_database();
```

### **Issue 4: API Route Issues**
```bash
# Make sure you're using the correct Next.js API route structure
# Files should be in app/api/ directory
# Export functions with correct names (GET, POST, etc.)
```

---

## **Help and Support**

### **If You Get Stuck:**
1. **Read the challenge requirements** carefully
2. **Check the error messages** and debug step by step
3. **Look at the sample data** to understand the structure
4. **Test your solutions** with the provided test cases
5. **Ask questions** if you need clarification

### **Contact Information:**
- **Upwork Message**: Send questions through Upwork
- **Response Time**: We'll respond within 24 hours
- **Office Hours**: 9 AM - 5 PM EST, Monday-Friday

---

## **Success Tips**

### **1. Read Carefully**
- **Read each challenge** completely before starting
- **Understand the requirements** and success criteria
- **Check the test cases** to understand expected behavior

### **2. Plan Your Approach**
- **Think through the problem** before coding
- **Consider edge cases** and error scenarios
- **Plan your TypeScript types** first

### **3. Test Thoroughly**
- **Test with valid data**
- **Test with invalid data**
- **Test with edge cases** (empty arrays, undefined values)
- **Test error scenarios**

### **4. Document Your Work**
- **Explain your approach** in the explanation files
- **Document any assumptions** you made
- **Include time estimates** and actual completion time
- **Ask questions** if anything is unclear

---

**Good luck with the challenges! We're looking forward to seeing your solutions. 🍀**
