import { serve } from "bun";
import { join } from "path";

const port = 3000;

serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    // Serve index.html for root
    if (path === "/") {
      path = "/index.html";
    }

    // Handle JavaScript imports
    if (path === "/main.js") {
      const result = await Bun.build({
        entrypoints: ["./src/main.ts"],
        target: "browser",
      });
      
      if (result.success && result.outputs[0]) {
        return new Response(result.outputs[0], {
          headers: { "Content-Type": "application/javascript" },
        });
      }
    }

    // Serve static files
    const filePath = join("src", path);
    const file = Bun.file(filePath);
    
    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Game running at http://localhost:${port}`);
console.log("Connect your gamepads and open the URL!");