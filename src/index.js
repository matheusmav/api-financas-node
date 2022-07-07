const express = require("express");
const { v4: uuid_v4 } = require("uuid");

const app = express();

app.use(express.json());

const costumers = [];

// Middleware
function verifyExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const costumer = costumers.find((costumer) => costumer.cpf === cpf);

    if (!costumer) {
        return response.status(400).json({
            error: "Costumer not found!",
        });
    }

    request.costumer = costumer;

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
 * Create Costumer
 */
app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    const costumerAlreadyExists = costumers.some(
        (costumer) => costumer.cpf === cpf
    );

    if (costumerAlreadyExists) {
        return response.status(400).json({
            error: "Costumer already exists!",
        });
    }

    costumers.push({
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
    const { costumer } = request;
    return response.json(costumer.statement);
});

/**
 * Deposit
 */
app.post("/deposit", verifyExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;
    const { costumer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit",
    };

    costumer.statement.push(statementOperation);

    return response.status(201).send();
});

/**
 * Whit Draw
 */
app.post("/with-draw", verifyExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;
    const { costumer } = request;

    const balance = getBalance(costumer.statement);

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

    costumer.statement.push(statementOperation);

    return response.status(201).send();
});

app.listen(3333);
