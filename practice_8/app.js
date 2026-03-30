const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = Number(process.env.PORT) || 3001;

const JWT_SECRET = process.env.JWT_SECRET || "access_secret";
const ACCESS_EXPIRES_IN = "15m";

const users = [];
const products = [];

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Practice 8 API",
      version: "1.0.0",
      description: "JWT auth + protected products routes",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    paths: {
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "first_name", "last_name", "password"],
                  properties: {
                    email: { type: "string", example: "user@example.com" },
                    first_name: { type: "string", example: "Ivan" },
                    last_name: { type: "string", example: "Petrov" },
                    password: { type: "string", example: "qwerty123" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User created" },
            400: { description: "Validation error" },
            409: { description: "User already exists" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login and get access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", example: "user@example.com" },
                    password: { type: "string", example: "qwerty123" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Access token created" },
            400: { description: "Validation error" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current authorized user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Current user data" },
            401: { description: "Unauthorized" },
            404: { description: "User not found" },
          },
        },
      },
      "/api/products": {
        post: {
          tags: ["Products"],
          summary: "Create product",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "category", "description", "price"],
                  properties: {
                    title: { type: "string", example: "Phone" },
                    category: { type: "string", example: "Electronics" },
                    description: { type: "string", example: "Smartphone" },
                    price: { type: "number", example: 19999 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Product created" },
            400: { description: "Validation error" },
          },
        },
        get: {
          tags: ["Products"],
          summary: "List products",
          responses: {
            200: { description: "Products list" },
          },
        },
      },
      "/api/products/{id}": {
        get: {
          tags: ["Products"],
          summary: "Get product by id",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Product found" },
            401: { description: "Unauthorized" },
            404: { description: "Product not found" },
          },
        },
        put: {
          tags: ["Products"],
          summary: "Update product by id",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "category", "description", "price"],
                  properties: {
                    title: { type: "string" },
                    category: { type: "string" },
                    description: { type: "string" },
                    price: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Product updated" },
            400: { description: "Validation error" },
            401: { description: "Unauthorized" },
            404: { description: "Product not found" },
          },
        },
        delete: {
          tags: ["Products"],
          summary: "Delete product by id",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            204: { description: "Product deleted" },
            401: { description: "Unauthorized" },
            404: { description: "Product not found" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

function findProductById(id) {
  return products.find((product) => product.id === id);
}

function parsePrice(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({
      error: "email, first_name, last_name and password are required",
    });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({
      error: "user with this email already exists",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: nanoid(10),
    email,
    first_name,
    last_name,
    passwordHash,
  };

  users.push(user);

  return res.status(201).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "email and password are required",
    });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN },
  );

  return res.status(200).json({ accessToken });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((item) => item.id === req.user.sub);
  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  return res.status(200).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
  });
});

app.post("/api/products", (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({
      error: "title, category, description and price are required",
    });
  }

  const parsedPrice = parsePrice(price);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({
      error: "price must be a non-negative number",
    });
  }

  const product = {
    id: nanoid(10),
    title,
    category,
    description,
    price: parsedPrice,
  };

  products.push(product);

  return res.status(201).json(product);
});

app.get("/api/products", (req, res) => {
  return res.status(200).json(products);
});

app.get("/api/products/:id", authMiddleware, (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({
      error: "product not found",
    });
  }

  return res.status(200).json(product);
});

app.put("/api/products/:id", authMiddleware, (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({
      error: "product not found",
    });
  }

  const { title, category, description, price } = req.body;
  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({
      error: "title, category, description and price are required",
    });
  }

  const parsedPrice = parsePrice(price);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({
      error: "price must be a non-negative number",
    });
  }

  product.title = title;
  product.category = category;
  product.description = description;
  product.price = parsedPrice;

  return res.status(200).json(product);
});

app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const productIndex = products.findIndex((product) => product.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({
      error: "product not found",
    });
  }

  products.splice(productIndex, 1);
  return res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server started: http://localhost:${port}`);
});
