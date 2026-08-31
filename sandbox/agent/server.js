import app from "./src/app.js";


const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Agent server is running on port ${PORT}`);
});