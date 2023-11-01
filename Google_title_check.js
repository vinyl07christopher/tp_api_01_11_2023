// const googleIt = require("google-it");

// async function searchGoogleForTitle(title) {
//   try {
//     if (!title || title.trim() === "") {
//       console.log("Please provide a valid title to search.");
//     }

//     const results = await googleIt({ query: title });

//     if (!results || results.length === 0) {
//       console.log("No search results found on Google.");
//       return;
//     }

//     const matchingResult = results.find(
//       (result) =>
//         result.title && result.title.toLowerCase().includes(title.toLowerCase())
//     );

//     if (matchingResult) {
//        console.log(`Found a matching title: ${matchingResult.title}`);
//        console.log(`URL: ${matchingResult.link}`);
//     } else {
//        console.log("No matching title found on Google.");
//     }
//   } catch (error) {
//     console.error("Error searching Google:", error.message);
//   }
// }

// module.exports = searchGoogleForTitle;
