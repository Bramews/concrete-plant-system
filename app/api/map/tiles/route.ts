import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { NetworkEngine } from "@/lib/network/NetworkEngine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const x = searchParams.get("x");
  const y = searchParams.get("y");
  const z = searchParams.get("z");
  const lyrs = searchParams.get("lyrs") || "m"; // m = road, y = satellite/hybrid

  if (!x || !y || !z) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  // Define local cache file path
  const cacheDir = path.join(process.cwd(), ".map-cache", lyrs, z, x);
  const cacheFilePath = path.join(cacheDir, `${y}.png`);

  // Check if tile is already cached locally
  if (fs.existsSync(cacheFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(cacheFilePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (readErr) {
      console.error(
        "Failed to read cached tile, falling back to network:",
        readErr,
      );
    }
  }

  // Load balance across Google Maps tile servers
  const subdomain = `mt${Math.floor(Math.random() * 4)}`;
  const tileUrl = `https://${subdomain}.google.com/vt/lyrs=${lyrs}&x=${x}&y=${y}&z=${z}`;

  try {
    const res = await NetworkEngine.fetch(tileUrl, {
      timeout: 5000,
      maxRetries: 2,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to local cache asynchronously
    try {
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(cacheFilePath, buffer);
    } catch (writeErr) {
      console.error("Failed to write tile cache:", writeErr);
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error(
      "Error proxying map tile, returning OpenStreetMap fallback:",
      err,
    );
    // Return redirect to OSM tile
    const osmUrl = `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;
    return NextResponse.redirect(osmUrl);
  }
}
