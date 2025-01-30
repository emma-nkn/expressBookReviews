const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = []; // Liste des utilisateurs enregistrés
const SECRET_KEY = 'votre_cle_secrete_pour_jwt'; // Clé secrète pour signer les JWT

// Vérifie si le nom d'utilisateur est valide
const isValid = (username) => {
  return users.some((user) => user.username === username); // Retourne true si l'utilisateur existe
};

// Vérifie si le nom d'utilisateur et le mot de passe correspondent
const authenticatedUser = (username, password) => {
  return users.some((user) => user.username === username && user.password === password); // Retourne true si les identifiants correspondent
};

// Se connecter en tant qu'utilisateur enregistré
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Vérifier si l'utilisateur est valide et si les identifiants correspondent
  if (!isValid(username) || !authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
  }

  // Générer un JWT pour l'utilisateur
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });

  // Répondre avec le JWT
  return res.status(200).json({ message: "Connexion réussie", token });
});

// Ajouter ou modifier une critique de livre
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;
  const token = req.header('Authorization'); // Le token JWT envoyé dans l'en-tête
  if (!token) {
    return res.status(401).json({ message: "Token requis pour publier une critique" });
  }

  try {
    // Vérifier et décoder le token JWT
    const decoded = jwt.verify(token, SECRET_KEY);
    const { username } = decoded; // Obtenir le nom d'utilisateur à partir du token

    // Trouver le livre par ISBN
    const book = books.find((book) => book.isbn === isbn);
    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    // Vérifier si l'utilisateur a déjà publié une critique
    const existingReview = book.reviews.find((rev) => rev.username === username);
    if (existingReview) {
      // Si une critique existe déjà, la modifier
      existingReview.review = review;
    } else {
      // Sinon, ajouter une nouvelle critique
      book.reviews.push({ username, review });
    }

    return res.status(200).json({ message: "Critique ajoutée ou modifiée avec succès" });
  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
});

// Supprimer une critique de livre
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const token = req.header('Authorization'); // Le token JWT envoyé dans l'en-tête
  if (!token) {
    return res.status(401).json({ message: "Token requis pour supprimer une critique" });
  }

  try {
    // Vérifier et décoder le token JWT
    const decoded = jwt.verify(token, SECRET_KEY);
    const { username } = decoded; // Obtenir le nom d'utilisateur à partir du token

    // Trouver le livre par ISBN
    const book = books.find((book) => book.isbn === isbn);
    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }


    const initialLength = book.reviews.length;
    book.reviews = book.reviews.filter((rev) => rev.username !== username);

    // Vérifier si la critique a été supprimée
    if (book.reviews.length === initialLength) {
      return res.status(404).json({ message: "Aucune critique trouvée pour cet utilisateur" });
    }

    return res.status(200).json({ message: "Critique supprimée avec succès" });
  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;