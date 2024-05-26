import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();
const API_URL = "https://covers.openlibrary.org/b/isbn/"

const db = new pg.Client({
    user : process.env.PG_USER,
    host : process.env.PG_HOST,
    database : process.env.PG_DATABASE,
    password : process.env.PG_PASSWORD,
    port : process.env.PG_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static("./public"));

// Set up my initial route to display all the items in my database and display them by the id's ascending order.
// I looped through each individual row in my data to find the isbn number, search the bookcover api, and add the corresponding
// link in order to display the book cover image in the app.

app.get("/", async (req,res) => {

    try {
        const result = await db.query("SELECT * from books ORDER BY id ASC");
        const rows = result.rows;
        let books = rows;

        for (var x = 0; x < books.length; x++) {
            let result = await axios.get(API_URL + books[x].isbn + "-M.jpg");
            books[x].isbn = result.config.url
            books = books;
        }

        res.render("index.ejs", {
        books : books
        });
    } catch(err) {
        console.log(err);
    }
});

// Moved over to a new page use the /new route in order to get a new form to submit a new book.

app.get("/new", (req,res) => {
    res.render("new.ejs")
});

// Created a post request that grabs the information submitted in the form using body parser.
// I used that information to do another db.query that adds the new book into the database and then routes back to the homepage.

app.post("/new", async (req,res) =>{
    const title = req.body.title;
    const author = req.body.author;
    const isbn = req.body.isbn;
    const rating = req.body.rating;

    await db.query("INSERT INTO books (title,author,isbn,rating) VALUES ($1,$2,$3,$4)",
    [title,author,isbn,rating]);

    res.redirect("/");
});

// I added an edit field that will take the form data and update the information entered in the database.

app.post("/edit", async (req,res) => {
    const id = req.body.updateItemId;
    const title = req.body.updateTitle;
    const author = req.body.updateAuthor;
    const rating = req.body.updateRating;

    try {
        await db.query("UPDATE books SET title = $1, author = $2, rating = $3 WHERE id = $4",
        [title,author,rating,id]);
        res.redirect("/");
    } catch(err) {
        console.log(err);
    }
});

// Post request that allows you to delete a book complete from the app and database.

app.post("/delete", (req,res) => {
    const id = req.body.deleteItemId
    db.query("DELETE FROM books WHERE id = $1",[id]);

    res.redirect("/");
});



app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});