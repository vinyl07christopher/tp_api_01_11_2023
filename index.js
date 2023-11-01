const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const otpGenerator = require("otp-generator");
const sendSms = require("./twilio");
require("dotenv").config();
const { addSeconds, isAfter } = require("date-fns");
const app = express();
const multer = require("multer");
const WordExtractor = require("word-extractor");
const fs = require("fs");
const { text } = require("body-parser");
const { log } = require("console");
const jwt = require("jsonwebtoken");
const path = require("path");
const { Extractor } = require("mammoth");
const cors = require("cors");
const textract = require("textract");
const { createWorker } = require("tesseract.js");
const secretKey = "tp tool";
const Docxtemplater = require("docxtemplater");
var wordcount = require("wordcount.js");
const replaceSpecialCharacters = require("replace-special-characters");
const googleIt = require("google-it");
const nodemailer = require("nodemailer");
const { abbreviation } = require('./abbreviation'); 

app.use(cors());

mongoose
  .connect("mongodb://localhost:27017/tpdatabase", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  otp: String,
});
const User = mongoose.model("User", userSchema);
app.use(express.json());
const bcrypt = require("bcrypt");
const { setTimeout } = require("timers");
const { title, exit } = require("process");
const { default: it } = require("date-fns/locale/it/index");
app.post("/api/create-user", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  jwt.verify(token, "secret_key", async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    let decodedEmail = decoded.email;
    try {
      const user = await User.findOne({ email: decodedEmail }).select(
        "-password"
      );
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.role.toLowerCase() !== "admin") {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { name, email, password, role } = req.body;
      if (!name || !email || !password || !role) {
        return res
          .status(400)
          .json({ success: false, error: "All fields are required" });
      }

      // Hash the password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error("Error hashing password:", err);
          return res
            .status(500)
            .json({ success: false, error: "Error creating user" });
        }

        // Create a new User instance
        const user = new User({
          name,
          email,
          password: hashedPassword, // Store the hashed password
          role,
        });

        // Save the user to the database
        user
          .save()
          .then(() => {
            return res
              .status(200)
              .json({ success: true, message: "User created successfully" });
          })
          .catch((error) => {
            console.error("Error creating user:", error);
            return res
              .status(500)
              .json({ success: false, error: "Error creating user" });
          });
      });
    } catch (error) {
      console.log(error);
    }
  });
});

//send mail in create new user

app.post("/api/signup", async (req, res) => {
  try {
    const formData = req.body;

    const recipient = formData.email;

    console.log(recipient);

    // Send email with the submitted data
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "jeevanantham.iro@gmail.com",
        pass: "jltllwuzvwypcbqu",
      },
    });

    const mailOptions = {
      from: "TP Tool <jeevanantham.iro@gmail.com>",
      to: recipient,
      subject: "TP Tool - New Registration",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h3 style="color: #007bff; margin-bottom: 20px;">New Sign Up Submission</h3>
      <p style="margin-bottom: 5px;"><strong>Firstname:</strong> ${formData.firstName}</p>
      <p style="margin-bottom: 5px;"><strong>Lastname:</strong> ${formData.lastName}</p>
      <p style="margin-bottom: 5px;"><strong>Email:</strong> ${formData.email}</p>
      <p style="margin-bottom: 5px;"><strong>Password:</strong> ${formData.password}</p>
    </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Send a response back to the frontend
    res.status(200).json({ message: "Form submitted successfully!" });
  } catch (error) {
    console.error("Error submitting form:", error.message);
    res
      .status(500)
      .json({ error: "An error occurred while processing the form." });
  }
});

// Protected route example

app.get("/api/user", (req, res) => {
  // Verify the token in the Authorization header
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Verify the token
  jwt.verify(token, "secret_key",{ expiresIn: "1m" }, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    let decodedEmail = decoded.email;
    // console.log(decodedEmail);
    try {
      const user = await User.findOne({ email: decodedEmail }).select(
        "-password"
      );
      // const users = await User.find().select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      res.status(200).json({ data: user });
    } catch (error) {
      console.log(error);
    }
  });
});

app.get("/api/users", (req, res) => {
  // Verify the token in the Authorization header
  const token = req.headers.authorization?.split(" ")[1];
  // console.log(token);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Verify the token
  jwt.verify(token, "secret_key", async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    let decodedEmail = decoded.email;
    // console.log(decodedEmail);
    try {
      const user = await User.findOne({ email: decodedEmail }).select(
        "-password"
      );

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.role.toLowerCase() !== "admin") {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const users = await User.find().select("-password");
      if (!users) {
        return res.status(401).json({ message: "User not found" });
      }
      res.status(200).json({ data: users });
    } catch (error) {
      console.log(error);
    }
  });
});

app.put("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const updatedUserData = req.body;

  User.findByIdAndUpdate(userId, updatedUserData, { new: true })
    .then((updatedUser) => {
      // Send the updated user data in the response
      res.json(updatedUser);
    })
    .catch((error) => {
      // Handle error
      console.error(error);
      res.sendStatus(500);
    });
});

//delete on the user account api
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(id);
    // console.log(user.name);

    res.status(200).json({ message: "User data deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, error: "Error deleting user" });
  }
});

// CLIENT Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  // console.log(email, password);
  try {
    // Find the user in the database by email
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare the provided password with the stored hashed password
    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate a token
    const token = jwt.sign({ email }, "secret_key", { expiresIn: "30d" });

    // Return the token and a success message
    return res.status(200).json({ token, message: "Logged in successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ADMIN Login
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  // console.log(email, password);
  try {
    // Find the user in the database by email
    const user = await User.findOne({ email });

    // console.log(user);

    // Check if the user exists
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // Check if user in admin
    if (user.role.toLowerCase() !== "admin") {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare the provided password with the stored hashed password
    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    const welcomeMessage = `Tp Tool Your verification code ${otp}`;
    const phone = process.env.To_PHONE_NUMBER;
    sendSms(phone, welcomeMessage);
    user.otp = otp;

    console.log(welcomeMessage);
    await user.save();

    return res.status(200).json({ message: "OTP sent for verification" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/admin/otp-verify", async (req, res) => {
  const { email, otp } = req.query;

  try {
    const user = await User.findOne({ email, otp }).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    user.otp = null;
    await user.save();

    const token = jwt.sign({ email, role: user.role }, "secret_key", {
      expiresIn: "1d",
    });

    return res
      .status(200)
      .json({ token, user, message: "Logged in successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/logout", (req, res) => {});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

//google title checks
async function searchGoogleForTitle(title) {
  let results = [];
  let matchingResult = null;
  console.log("Searching for", title);
  try {
    if (!title || title.trim() === "") {
      console.log("Please provide a valid title to search.");
    }

    results = await googleIt({ query: title });

    if (!results || results.length === 0) {
      console.log("No search results found on Google.");
    }

    matchingResult = results.find(
      (result) =>
        result.snippet &&
        result.snippet.toLowerCase().includes(title.toLowerCase())
    );
    console.log(results);

    if (matchingResult) {
      console.log(`Found a matching title: ${matchingResult.title}`);
      console.log(`URL: ${matchingResult.link}`);
      // return  matchingResult;
    } else {
      console.log("No matching title found on Google.");
      return "Not found";
    }
  } catch (error) {
    console.error("Error searching Google:", error.message);
  }

  return matchingResult;

  // console.log("Searching",results);
  // console.log("matching",matchingResult);
  // return  matchingResult;
}

//self citation count
function countSelfCitations(text, authorName) {
  var regex="";
  try {
     regex = new RegExp(`\\b${authorName}\\b`, "gi");
  } catch (error) {
  }
  const matches = text.match(regex) || [];
  return matches.length;
}

var authorsName = "";
var matchingResult = "";
async function processWordFile(content) {
  const nameCountInReferenceSection = [];
  var referenceSectionFound = false;
  var totalNumberOfSelfCitationsFound = 0;

  try {
    const paragraphs = content.split("\n");

    var title1 = paragraphs[0].trim();
    var it = 1;
    while (title1 == "") {
      title1 = paragraphs[it].trim();
      it++;
    }

    const cleanedTitle = title1.replace(
      /\b(?:Dr.|Mr.|PhD.|Professor|Mrs.|Prof.|MPhil|Ms|@gmail.com)\b\s*/g,
      ""
    );

    console.log("cleaned title: " + cleanedTitle);

    console.log("___________________________");

    matchingResult = await searchGoogleForTitle(cleanedTitle);

    matchingResult = matchingResult;
    console.log(
      "matching on the title________________________",
      matchingResult
    );

    // console.log("results: ", op);

    var output = "";

    const authorName = extractname(content.split("Abstract")[0]);

    authorsName = authorName;

    for (let i = 0; i < paragraphs.length; i++) {
      var paragraph = paragraphs[i];

      referenceSectionFound = paragraph.toLowerCase().includes("reference");

      if (referenceSectionFound) {
        const citationCountPromises =
          authorName.map((author) => {
            return countSelfCitations(paragraph, author);
          }) || [];

        var selfCitationsFoundInParagraph = false;

        // Citation count promise for multiple authors
        for (j = 0; j < citationCountPromises.length; j++) {
          if (!nameCountInReferenceSection.hasOwnProperty(j)) {
            nameCountInReferenceSection[j] = 0;
          }

          const citationCountPromises__ = citationCountPromises[j];

          if (citationCountPromises__ < 1) {
            continue;
          }

          selfCitationsFoundInParagraph = true;

          if (nameCountInReferenceSection[j] > 0) {
            nameCountInReferenceSection[j] += citationCountPromises__;
          } else {
            nameCountInReferenceSection[j] = citationCountPromises__;
          }

          totalNumberOfSelfCitationsFound += citationCountPromises__;
        }

        if (selfCitationsFoundInParagraph) {
          var highlightedParagraph = paragraph;

          authorName.map((author) => {
            highlightedParagraph = highlightedParagraph.replace(
              new RegExp(`\\b(${author})\\b`, "gi"),
              (match) => match.yellow
            );
          });

          output += highlightedParagraph + "\n\n";
        } else {
          output += paragraph + "\n\n";
        }
      } else {
        output += paragraph + "\n\n";
      }
    }
    output =
      "\nTotal self-citations found in Reference: " +
      totalNumberOfSelfCitationsFound +
      "\n\n" +
      output;

    const selfCitationData = [];

    for (k = 0; k < authorName.length; k++) {
      selfCitationData.push({
        name: authorName[k],
        count: nameCountInReferenceSection[k],
      });
    }

    console.log("Self", authorName);

    return {
      output,
      selfCitationData,
      totalNumberOfSelfCitationsFound,
      matchingResult,
    };
  } catch (error) {
    throw error;
  }
}

function extractname(text) {
  const nameRegex =
    /(Dr.|Mr.|PhD|Professor|[A-Z]+\...)\s?[A-Za-z]+(\.[A-Za-z]+)?/g;
  const nameRegex2 = /[A-Z][a-z]+(\.[A-Z])+/g;

  const names = text.match(nameRegex) || [];
  const names2 = text.match(nameRegex2) || [];

  const combinedNames = [...names, ...names2];

  return combinedNames;
}

async function NumberselfWordFile(content) {
  var abstractSection =
    (keywordSection =
    keyword_2_Section =
    keyword_3_Section =
    keyword_4_Section =
    introductionSection =
    conclusionSection =
    referenceSection =
      false);
  var check_paragraph = false;
  try {
    const paragraphs = content.split("\n\n");
    var output = "";
    var matches = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];



      if (!abstractSection) {
        abstractSection = paragraph.toLowerCase().startsWith("abstract");
      }

      if (abstractSection) {
        if (check_paragraph && !keywordSection) {
          keywordSection = paragraph.toLowerCase().startsWith("keyword");
        }
        if (check_paragraph && !keyword_2_Section) {
          keyword_2_Section = paragraph.toLowerCase().startsWith("key word");
        }
        if (check_paragraph && !keyword_3_Section) {
          keyword_3_Section = paragraph.toLowerCase().startsWith("index");
        }
        if (check_paragraph && !keyword_4_Section) {
          keyword_4_Section = paragraph.toLowerCase().startsWith("indices");
        }
        if (check_paragraph && !introductionSection) {
          introductionSection = paragraph
            .toLowerCase()
            .includes("introduction");
        }
        if (!check_paragraph && !conclusionSection) {
          conclusionSection = paragraph.toLowerCase().includes("conclusion");
        }
        if (check_paragraph && conclusionSection && !referenceSection) {
          referenceSection = paragraph.toLowerCase().includes("reference");
        }

        check_paragraph = true;

        if (
          keyword_2_Section ||
          keyword_3_Section ||
          keyword_4_Section ||
          introductionSection
        ) {
          check_paragraph = false;
        }
        if (conclusionSection) {
          check_paragraph = true;
        }
        if (referenceSection) {
          check_paragraph = false;
        }
        if (check_paragraph) {
          const combinedPattern = /\[\d+\]|\b(?:et|al)\b/g;
          // const combinedPattern = /\\d+\|\b(?:et|al)\b/g;

          match = paragraph.match(combinedPattern || []);
          if (match) {
            matches = [...matches, ...match];
          }
          const highlightedParagraph = paragraph.replace(
            combinedPattern,
            '<span style="background-color: yellow;">$&</span>'
          );
          output += highlightedParagraph + "\n\n";
        }
      } else {
        output += paragraph + "\n\n";
      }
    }
    output =
      "************* REFERENCE CITATIONS in ABSTRACT & CONCLUSION **************" +
      "\n\n" +
      output;

    return { output, matches };
  } catch (error) {
    throw error;
  }
}

const upload = multer({ storage });
const colors = [
  "#FF0000",
  "#0000FF",
  "#FF00FF",
  "#808000",
  "#FFA500",
  "#000000",
  "#808080",
  "#3CB371",
  "#57E964",
  "#FDBD01",
  "#D4A017",
  "#513B1C",
  "#EB5406",
  "#F62217",
  "#810541",
  "#F8B88B",
  "#FF00FF",
  "#BA55D3",
  "#800080",
];
const wordMatchColor = {};
let nextMatchColor = 0;
// Read the patterns file
const patterns = JSON.parse(fs.readFileSync("patterns.json", "utf8"));
const author = {};
const highlightAndCountMatches = (
  text,
  patterns,
  selfcitationdata,
  refCitationData,
  matchingResult
) => {
  // const highlightAndCountMatches = (text, patterns) => {
  const wordCounts = {};
  if (patterns && Array.isArray(patterns)) {
    patterns.forEach((patterns) => {
      let pattern_ = patterns.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

      // let pattern_ =/\[1\]|et al/g;

      const regex = new RegExp(`\\b${pattern_}\\b`, "gi");

      text = text.replace(regex, (match) => {
        wordCounts[match] = (wordCounts[match] || 0) + 1;

        if (!wordMatchColor[match]) {
          wordMatchColor[match] = colors[nextMatchColor];

          nextMatchColor++;

          if (nextMatchColor === colors.length) {
            nextMatchColor = 0;
          }
        }
        return ` <span style='background-color:${wordMatchColor[match]}; color: white; display:table;'>&nbsp;${match}&nbsp;</span> `;
      });
    });
  }

  // // Explode text - abstract conclusion reference
  var [finalText, ...rest] = text.split("Abstract");

  var temp1 = rest.join("Abstract");
  // console.log("temp1: " + temp1);

  var [partText_abstract, ...temp2] = temp1.split("INTRODUCTION");
  var temp2 = temp2.join("INTRODUCTION");
  // console.log("temp2: " + temp2);
     
  var temp3 = temp2.split("References");
  // console.log("temp3: " + temp3);

  var partText_reference = temp3.pop();

  var temp4 = temp3.join("References").split("conclusion");
  // console.log("temp4: " + temp4);

  var partText_conclusion = temp4.pop();

  // console.log("partText_abstract: __________" + partText_abstract);

  // console.log("partText_reference: __________" + partText_reference);

  // console.log("partText_conclusion: __________" + partText_conclusion);

  // Reference Citation in Abstract & Conclusion - Highlight
  refCitationData.map((refData) => {
    const regex = new RegExp(`\\b${refData}\\b`, "gi");

    partText_abstract = partText_abstract.replace(regex, (match) => {
      return ` <span style='background-color:yellow; color: black; display:table;'>&nbsp;${match}&nbsp;</span> `;
    });
    partText_conclusion = partText_conclusion.replace(regex, (match) => {
      return ` <span style='background-color:yellow; color: black; display:table;'>&nbsp;${match}&nbsp;</span> `;
    });
  });

  // Self Citation - Highlight
  authorsName.map((author) => {
    const regex = new RegExp(`\\b${author}\\b`, "gi");

    partText_reference = partText_reference.replace(regex, (match) => {
      return ` <span style='background-color:yellow; color: black; display:table;'>&nbsp;${match}&nbsp;</span> `;
    });
  });

  finalText += "<h5>Abstract</h5>";
  finalText += partText_abstract;
  finalText += temp4;
  finalText += "<h5>Conclusion</h5>";
  finalText += partText_conclusion;
  finalText += "<h5>References</h5>";
  finalText += partText_reference;
  
  var highlightedText = `<html>
  <head>
  <title>Highlighted Text and Word Counts</title>
  </head>

  <body>

  <div style= " display: table;  justify-content: center;">
  <h4 style="text-align:center;text-shadow: 0.5px 0.5px;">TP Tool Report</h4>
  <div style="display: flex; flex-direction:row">
      <div style=" width: 50%; border: 0.7px solid #000c; padding: 5px;">
      <h4>Torture Phrases Word Counts:</h4>
      </div>
      <div style=" width: 50%; border: 0.7px solid #000c; padding: 5px;">
      ${Object.keys(wordCounts)
        .map((key) => {
          const count = wordCounts[key];
          return `<div style='color: ${wordMatchColor[key]}; '>${key}: ${count}</div>`;
        })
        .join("")}
      </div>
      
  </div>

  <div style="display: flex; flex-direction: row;">
      <div style=" width: 50%; border: 0.7px solid #000c; padding: 5px;">
      <h4>Self citation </h4>
      </div>
      <div style=" width: 50%; border: 0.7px solid #000c; padding: 5px;">
     ${
      selfcitationdata.selfCitationData
      .map((data) => {
        if (data.count > 0) {
          return `<div>${data.name} - ${data.count}</div>`;
        } else {
          return "";
        }
      })
      .join("")
     }
      </div>
      
  </div>
  <div style="display: flex; flex-direction: row;">
      <div style=" width: 50%; border: 0.7px solid #000c; padding: 5px;">
      <h4>Found in Abstract/Conclusion Section:</h4>
      </div>
      <div style=" width: 50%; border: 0.7px solid #000c; padding: 5px;">
      
      ${
        refCitationData
  .map((data) => {
    return `<div>${data}</div>`;
  })
  .join("")
      }
      </div>
  
  </div>
</div>

  <div style="display:table; margin-top:20px;">
  ${finalText}
  </div><br/><br/>
  <div>
  
 
  <h3>Torture Phrases Word Counts:</h3>
  <ul>
  ${Object.keys(wordCounts)
    .map((key) => {
      const count = wordCounts[key];
      return `<div style='color: ${wordMatchColor[key]}; '>${key}: ${count}</div>`;
    })
    .join("")}
    </ul>
    </div>
    <br/>
    <h3>Self citation </h3>
    <ul>`;
  highlightedText += selfcitationdata.selfCitationData
  .map((data) => {
    if (data.count > 0) {
      return `<div>${data.name} - ${data.count}</div>`;
    } else {
      return "";
    }
  })
  .join("");
  
  highlightedText += `</ul>
  <h3>Found in Abstract/Conclusion Section:</h3>
   <ul>`;
  
  highlightedText += refCitationData
  .map((data) => {
    return `<div>${data}</div>`;
  })
  .join("");
  
  highlightedText += `</ul>`;
  
  
  if (matchingResult != "Not found") {
    highlightedText += `
  <h3>Similet Title:</h3>
  
  
  <a target="_blank" href="${matchingResult.link}">${matchingResult.link}</a>`;
  }
  else{
    `<p>"Not found"</p>`
  }
  
  highlightedText += `<ul>
  </ul>
  
  </body></html>`;

  return { highlightedText, wordCounts };
};

app.post("/api/upload", upload.single("file"), (req, res) => {
  const uploadedFile = req.file;
  // const title = req.body.title;

  if (!uploadedFile) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const docPath = uploadedFile.path;

  const extractor = new WordExtractor();

  const extracted = extractor.extract(docPath);

  function countWords(text) {
    const trimmedText = text.trim();

    const wordsArray = trimmedText.split(/\s+/);

    const filteredWords = wordsArray.filter((word) => word !== "");

    return filteredWords.length;
  }

  extracted
    .then(async function (doc) {
      const extractedText = doc.getBody();
      const wordCount = countWords(extractedText);
      console.log(`Word Count: ${wordCount}`);

      // var copyextract = extractedText;
      // copyextract = copyextract.replace('/',' ').replace('-','');
      // const count = wordcount(copyextract);
      // // console.log(copyextract);
      // console.log(`Number of words: ${count}`);

      //self citation
      const selfcitationdata = await processWordFile(extractedText);

      // console.log("***********self citation");
      // console.log(selfcitationdata.selfCitationData);

      //  Reference Citation in Abstract & Conclusion
      const referenceCitationInAbstractandConclusion = await NumberselfWordFile(
        extractedText
      );

      // console.log("***********reference citation");
      // console.log(referenceCitationInAbstractandConclusion.matches);

      const { highlightedText, wordCounts } = highlightAndCountMatches(
        abbreviation(extractedText),
        patterns,
        selfcitationdata,
        referenceCitationInAbstractandConclusion.matches,
        selfcitationdata.matchingResult
      );

      const outputPath = "output.html";
      fs.writeFileSync(outputPath, highlightedText);
      fs.unlink(docPath, (err) => {});

      res.json({
        message: "File uploaded, extracted, and highlighted successfully",
        filename: uploadedFile.originalname,
        size: uploadedFile.size,
        path: uploadedFile.path,
        extractedText,
        highlightedText,
        outputPath,
        wordCounts,
        selfcitationdata,
        referenceCitationInAbstractandConclusion,
      });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).json({ error: "An error occurred during extraction" });
    });
});

app.listen(4000, () => {
  console.log("Server Running on port 4000");
});
