const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const dataFilePath = path.join(__dirname, "studentdata.json");
const noticesFilePath = path.join(__dirname, "notices.json");

if (!fs.existsSync(noticesFilePath)) {
    fs.writeFileSync(noticesFilePath, JSON.stringify([]));
}

// get student data 
app.get("/api/students", (req, res) => {
    fs.readFile(dataFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading student data:", err);
            return res.status(500).json({ error: "Failed to read data" });
        }

        let students = JSON.parse(data);

        // subject filter
        const subjectFilter = req.query.subject;
        if (subjectFilter) {
            students = students.map(student => ({
                ...student,
                marks: student.marks.filter(mark => mark.subject === subjectFilter)
            })).filter(student => student.marks.length > 0);
        }

        // term filter
        const termFilter = req.query.term;
        if (termFilter) {
            students = students.map(student => ({
                ...student,
                marks: student.marks.filter(mark => mark.term === termFilter)
            })).filter(student => student.marks.length > 0);
        }

        res.json(students);
    });
});

// get all notices
app.get("/api/notices", (req, res) => {
    fs.readFile(noticesFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading notices data:", err);
            return res.status(500).json({ error: "Failed to read data" });
        }

        const notices = JSON.parse(data);
        res.json(notices);
    });
});

// add a new notice
app.post("/api/addNotice", (req, res) => {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
        return res.status(400).json({ error: "Title, description, and category are required" });
    }

    const newNotice = { id: Date.now(), title, description, category, date: new Date().toISOString() };

    fs.readFile(noticesFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading notices data:", err);
            return res.status(500).json({ error: "Failed to read data" });
        }

        let notices = JSON.parse(data);
        notices.push(newNotice);

        fs.writeFile(noticesFilePath, JSON.stringify(notices, null, 2), (err) => {
            if (err) {
                console.error("Error saving notice data:", err);
                return res.status(500).json({ error: "Failed to save data" });
            }
            res.status(201).json({ message: "Notice added successfully", notice: newNotice });
        });
    });
});

// API to delete a notice
app.delete("/api/deleteNotice/:id", (req, res) => {
    const noticeId = parseInt(req.params.id);

    fs.readFile(noticesFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading notices data:", err);
            return res.status(500).json({ error: "Failed to read data" });
        }

        let notices = JSON.parse(data);
        const filteredNotices = notices.filter(notice => notice.id !== noticeId);

        if (notices.length === filteredNotices.length) {
            return res.status(404).json({ message: "Notice not found" });
        }

        fs.writeFile(noticesFilePath, JSON.stringify(filteredNotices, null, 2), (err) => {
            if (err) {
                console.error("Error saving notices data:", err);
                return res.status(500).json({ error: "Failed to save data" });
            }
            res.json({ message: "Notice deleted successfully" });
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
