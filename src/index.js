const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const costumers = [];

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
        id: uuidv4(),
        statement: [],
    });

    return response.status(201).send();
});

/**
 * Get Statement Costumer
 */
app.get("/statement", (request, response) => {
    const { cpf } = request.headers;

    const costumer = costumers.find((costumer) => costumer.cpf === cpf);

    if (!costumer) {
        return response.status(400).json({
            error: "Costumer not found!",
        });
    }

    return response.json(costumer.statement);
});

app.listen(3333);
