const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

// Configuration des sessions
app.use(
  "/customer",
  session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false } // Assurez-vous de définir secure: true en production si vous utilisez HTTPS
  })
);

// Middleware d'authentification
app.use("/customer/auth/*", function auth(req, res, next) {
  // Vérifie si une session utilisateur existe
  if (!req.session || !req.session.token) {
    return res.status(401).json({ message: "Accès refusé. Aucun token trouvé." });
  }

  try {
    // Vérifie la validité du token
    const decoded = jwt.verify(req.session.token, "fingerprint_customer");
    req.user = decoded; // Ajoute les données utilisateur décodées à l'objet req
    next(); // Passe à la route suivante si l'authentification réussit
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
});

// Route de connexion pour générer un token
app.post("/login", (req, res) => {
  const user = req.body.username;

  // Exemple : Vérification basique de l'utilisateur
  if (user) {
    const token = jwt.sign({ username: user }, "fingerprint_customer", { expiresIn: "1h" });
    req.session.token = token;
    return res.status(200).json({ message: "Connexion réussie", token });
  } else {
    return res.status(400).json({ message: "Nom d'utilisateur requis" });
  }
});

const PORT = 5000;

app.use("/customer", customer_routes);  // Routes pour les utilisateurs
app.use("/", genl_routes);  // Routes générales

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));