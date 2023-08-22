const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 5504;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("Oya oo dupa dupa", PORT);
});
