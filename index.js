require("dotenv").config();

import express from "express";
import { urlencoded, json } from "body-parser";
//Database
import { books as _books, author as _author, publication } from "./database";
import { mongoose } from "mongoose";

//Initialize express

const booky = express();



booky.use(urlencoded({ extended: true }));
booky.use(json());

mongoose.connect(process.env.MONGO_URL,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true
    }
    ).then(() => console.log("Connection Established"));
    

/*
Route           /
Description    Get specific all the books
Access          PUBLIC
Parameter       NONE
Methods         GET
*/

booky.get("/", (req, res) => {
    return res.json({
        books: _books
    });
});

/*
Route           /is
Description    Get specific book on ISBN
Access          PUBLIC
Parameter       isbn
Methods         GET
*/

booky.get("/is/:isbn", (req, res) => {
    const getSpecificBook = _books.filter(
        (book) => book.ISBN === req.params.isbn
    );
    if (getSpecificBook.length === 0) {
        return res.json({ error: 'No book found for the ISBN of ${req.params.isbn}' });

    }

    return res.json({ book: getSpecificBook });

});

/*
Route           /c
Description    Get specific book on ISBN
Access          PUBLIC
Parameter       category
Methods         GET
*/

booky.get("/c/:category", (req, res) => {
    const getSpecificBook = _books.filter(
        (book) => book.category.includes(req.params.category)
    )

    if (getSpecificBook.length === 0) {
        return res.json({ error: 'No book found for the category of ${req.params.category}' })
    }

    return res.json({ book: getSpecificBook });
});
/*
Route           /c
Description    Get specific book on category
Access          PUBLIC
Parameter       NONE
Methods         GET
*/

booky.get("/author", (req, res) => {
    return res.json({ authors: _author });
});

/*
Route           /author/book
Description    Get all authors based on books
Access          PUBLIC
Parameter       isbn
Methods         GET
*/

booky.get("/author/book/:isbn", (req, res) => {
    const getSpecificAuthor = _author.filter(
        (author) => author.books.includes(req.params.isbn)
    );

    if (getSpecificAuthor.length === 0) {
        return res.json({
            error: 'No author found for the book of ${req.params.isbn}'

        });
    }
    return res.json({ authors: getSpecificAuthor });
});

/*
Route           publications
Description    Get all publications
Access          PUBLIC
Parameter       NONE
Methods         GET
*/

booky.get("/publications", (req, res) => {
    return res.json({ publications: publication })
})

//POST

/*
Route           /book/new
Description    Add new books
Access          PUBLIC
Parameter       NONE
Methods         POST
*/

booky.post("/book/new", (req, res) => {
    const newBook = req.body;
    _books.push(newBook);
    return res.json({ updatedBooks: _books });
});

//POST

/*
Route           /author/new
Description    Add new authors
Access          PUBLIC
Parameter       NONE
Methods         POST
*/

booky.post("/author/new", (req, res) => {
    const newAuthor = req.body;
    _author.push(newAuthor);
    return res.json(_author);
});

/*
Route           /publication/new
Description    Add new publication
Access          PUBLIC
Parameter       NONE
Methods         POST
*/

booky.post("/publication/new", (req, res) => {
    const newPublication = req.body;
    publication.push(newPublication);
    return res.json(publication);
});

/**************PUT***************/
/*
Route            /book/update
Description      Update book on isbn
Access           PUBLIC
Parameter        isbn
Methods          PUT
*/

booky.put("/book/update/:isbn", async (req, res) => {
    const updatedBook = await BookModel.findOneAndUpdate(
        {
            ISBN: req.params.isbn
        },
        {
            title: req.body.bookTitle
        },
        {
            new: true
        }
    );

    return res.json({
        books: updatedBook
    });
});

/*********Updating new author**********/
/*
Route            /book/author/update
Description      Update /add new author
Access           PUBLIC
Parameter        isbn
Methods          PUT
*/

booky.put("/book/author/update/:isbn", async (req, res) => {
    //Update book database
    const updatedBook = await BookModel.findOneAndUpdate(
        {
            ISBN: req.params.isbn
        },
        {
            $addToSet: {
                authors: req.body.newAuthor
            }
        },
        {
            new: true
        }
    );

    //Update the author database
    const updatedAuthor = await AuthorModel.findOneAndUpdate(
        {
            id: req.body.newAuthor
        },
        {
            $addToSet: {
                books: req.params.isbn
            }
        },
        {
            new: true
        }
    );

    return res.json(
        {
            bookss: updatedBook,
            authors: updatedAuthor,
            message: "New author was added"
        }
    );
});

/*
Route            /publication/update/book
Description      Update /add new publication
Access           PUBLIC
Parameter        isbn
Methods          PUT
*/

booky.put("/publication/update/book/:isbn", (req, res) => {
    //Update the publication database
    publication.forEach((pub) => {
        if (pub.id === req.body.pubId) {
            return pub.books.push(req.params.isbn);
        }
    });

    //Update the book database
    _books.forEach((book) => {
        if (book.ISBN === req.params.isbn) {
            book.publications = req.body.pubId;
            return;
        }
    });

    return res.json(
        {
            books: _books,
            publications: publication,
            message: "Successfully updated publications"
        }
    );
});

/****DELETE*****/
/*
Route            /book/delete
Description      Delete a book
Access           PUBLIC
Parameter        isbn
Methods          DELETE
*/

booky.delete("/book/delete/:isbn", async (req, res) => {
    //Whichever book that does not match with the isbn , just send it to an updatedBookDatabase array
    //and rest will be filtered out

    const updatedBookDatabase = await BookModel.findOneAndDelete(
        {
            ISBN: req.params.isbn
        }
    );

    return res.json({
        books: updatedBookDatabase
    });
});

/*
Route            /book/delete/author
Description      Delete an author from a book and vice versa
Access           PUBLIC
Parameter        isbn, authorId
Methods          DELETE
*/

booky.delete("/book/delete/author/:isbn/:authorId", (req, res) => {
    //Update the book database
    _books.forEach((book) => {
        if (book.ISBN === req.params.isbn) {
            const newAuthorList = book.author.filter(
                (eachAuthor) => eachAuthor !== parseInt(req.params.authorId)
            );
            book.author = newAuthorList;
            return;
        }
    });


    //Update the author database
    _author.forEach((eachAuthor) => {
        if (eachAuthor.id === parseInt(req.params.authorId)) {
            const newBookList = eachAuthor.books.filter(
                (book) => book !== req.params.isbn
            );
            eachAuthor.books = newBookList;
            return;
        }
    });

    return res.json({
        book: _books,
        author: _author,
        message: "Author was deleted!!!!"
    });
});

booky.listen(3000, () => {
    console.log("Server is up and running");
});