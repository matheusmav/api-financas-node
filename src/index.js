const express = require("express");
const { v4: uuid_v4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

// Middleware
function verifyExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if (!customer) {
        return response.status(400).json({
            error: "customer not found!",
        });
    }

    request.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === "credit") {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

/**
 * Create customer
 */
app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customerAlreadyExists) {
        return response.status(400).json({
            error: "customer already exists!",
        });
    }

    customers.push({
        cpf,
        name,
        id: uuid_v4(),
        statement: [],
    });

    return response.status(201).send();
});

/**
 * Get Statement
 */
app.get("/statement", verifyExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
});

/**
 * Deposit
 */
app.post("/deposit", verifyExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit",
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

/**
 * Whit Draw
 */
app.post("/with-draw", verifyExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({
            error: "Insufficient funds!",
        });
    }

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "debit",
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

/**
 * Statements per date
 */
app.get("/statement/date", verifyExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00:00");

    const statement = customer.statement.filter(
        (statement) =>
            statement.created_at.toDateString() === dateFormat.toDateString()
    );

    return response.json(statement);
});

/**
 * Update Account
 */
app.put("/account", verifyExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
});

/**
 * Get Account
 */
app.get("/account", verifyExistsAccountCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer);
});

/**
 * Delete Account
 */
app.delete("/account", verifyExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { cpf } = customer;

    const customerIndex = customers.findIndex(
        (customer) => customer.cpf === cpf
    );

    customers.splice(customerIndex, 1);

    return response.status(200).json(customers);
});

/**
 * Get Balance
 */
app.get("/balance", verifyExistsAccountCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);
});

app.listen(3333);
