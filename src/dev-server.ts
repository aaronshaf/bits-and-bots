import { serve } from "bun";
import { join } from "path";

const port = 3000;

function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return 'text/html';
    case 'css': return 'text/css';
    case 'js': return 'application/javascript';
    case 'json': return 'application/json';
    case 'mid':
    case 'midi': return 'audio/midi';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    
    console.log(`Request for: ${path}`);

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

    // Special handling for MIDI files
    if (path.endsWith('.mid') || path.endsWith('.midi')) {
      // Try multiple locations
      const locations = [
        join("dist", path),
        join("src", path),
        join(".", path),
      ];
      
      for (const location of locations) {
        const file = Bun.file(location);
        if (await file.exists()) {
          console.log(`Serving MIDI file from: ${location}`);
          return new Response(file, {
            headers: { 
              "Content-Type": "audio/midi",
              "Access-Control-Allow-Origin": "*"
            },
          });
        }
      }
      console.log(`MIDI file not found in any location: ${path}`);
    }
    
    // Try to serve static files from dist first
    const distPath = join("dist", path);
    const distFile = Bun.file(distPath);
    
    if (await distFile.exists()) {
      const contentType = getContentType(path);
      return new Response(distFile, {
        headers: { "Content-Type": contentType },
      });
    }
    
    // Then try src directory
    const srcPath = join("src", path);
    const srcFile = Bun.file(srcPath);
    
    if (await srcFile.exists()) {
      const contentType = getContentType(path);
      return new Response(srcFile, {
        headers: { "Content-Type": contentType },
      });
    }

    console.log(`File not found: ${path}`);
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Game running at http://localhost:${port}`);
console.log("Connect your gamepads and open the URL!");