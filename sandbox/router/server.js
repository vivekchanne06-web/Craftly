
import server from "./src/app.js";



server.listen(3000, "0.0.0.0", () => {
    console.log(
        `Sandbox router server is running on port 3000`
    );
});