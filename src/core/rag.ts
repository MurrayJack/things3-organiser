import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import { embeddingCall } from "./LmStudio";
import * as fs from "fs";
import * as path from "path";

// ----- Types -----
type RagPayload = {
  doc_id: string;
  source: string;
  chunk_index: number;
  text: string;
  tags: string[];
};

type QdrantPoint = {
  id: string | number;
  vector: number[];
  payload: RagPayload;
};

type QdrantSearchResult = {
  id: string | number;
  score: number;
  payload: RagPayload;
};

// ----- Env -----
const {
  QDRANT_URL = "http://localhost:6333",
  QDRANT_API_KEY,
  QDRANT_COLLECTION = "rag_docs",
  LMSTUDIO_BASEURL = "http://localhost:1234/v1",
  LMSTUDIO_API_KEY = "lm-studio",
  EMBEDDING_MODEL = "bge-base-en-v1.5",
} = process.env;

const qdrant = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

// ----- Utilities -----
function chunkText(text: string, chunkSize = 900, overlap = 150): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
  }
  return chunks;
}

function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

// Recursively find all markdown files
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          // Skip hidden directories (starting with .)
          if (!entry.name.startsWith(".")) {
            traverse(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Cannot read directory ${currentDir}:`, error);
    }
  }

  traverse(dir);
  return files;
}

// Read and parse a markdown file
function readMarkdownFile(
  filePath: string
): { content: string; relativePath: string } | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative("/Users/mjack/Obsidian", filePath);
    return { content, relativePath };
  } catch (error) {
    console.warn(`Cannot read file ${filePath}:`, error);
    return null;
  }
}

// ----- Embeddings via LM Studio -----
async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await embeddingCall(texts);

  // Ensure order by index
  //   const ordered = [...res]
  //     .sort((a, b) => a. .index - b.index)
  //     .map((d) => d.embedding as number[]);
  //   return ordered;
  return res;
}

// ----- Qdrant helpers -----
async function ensureCollection(dim: number): Promise<void> {
  try {
    const collection = await qdrant.getCollection(QDRANT_COLLECTION);
    console.log(`Collection "${QDRANT_COLLECTION}" already exists`);
    return;
  } catch (error: any) {
    // Collection not found, create it
    if (error?.status === 404 || error?.message?.includes("not found")) {
      console.log(`Creating collection "${QDRANT_COLLECTION}"`);
      await qdrant.createCollection(QDRANT_COLLECTION, {
        vectors: { size: dim, distance: "Cosine" },
        hnsw_config: { m: 16, ef_construct: 128 },
      });
      return;
    }
    // Re-throw other errors
    throw error;
  }
}

async function upsertBatch(points: QdrantPoint[]): Promise<void> {
  await qdrant.upsert(QDRANT_COLLECTION, { wait: true, points });
}

async function search(
  vector: number[],
  k = 5,
  filter?: Record<string, any>
): Promise<QdrantSearchResult[]> {
  const results = await qdrant.search(QDRANT_COLLECTION, {
    vector,
    limit: k,
    filter,
  });
  // Cast to a minimal shape we actually use
  return results as unknown as QdrantSearchResult[];
}

// ----- Demo ingest + search -----
async function main(): Promise<void> {
  const obsidianPath = "/Users/mjack/Obsidian";

  // 1) Find all markdown files in Obsidian folder
  console.log(`Finding markdown files in ${obsidianPath}...`);
  const markdownFiles = findMarkdownFiles(obsidianPath);
  console.log(`Found ${markdownFiles.length} markdown files`);

  if (markdownFiles.length === 0) {
    console.log("No markdown files found. Exiting.");
    return;
  }

  // 2) Process each file
  const allPoints: QdrantPoint[] = [];
  let pointId = 0;
  let totalChunks = 0;

  for (const filePath of markdownFiles) {
    const fileData = readMarkdownFile(filePath);
    if (!fileData) continue;

    const { content, relativePath } = fileData;

    // Skip empty files
    if (content.trim().length === 0) continue;

    console.log(`Processing: ${relativePath}`);

    // 3) Chunk the content
    const chunks = chunkText(content, 500, 100); // Smaller chunks for better retrieval
    if (chunks.length === 0) continue;

    // 4) Embed all chunks for this file
    const vectors = await embedTexts(chunks);
    if (vectors.length === 0) continue;

    const normalizedVectors = vectors.map(l2Normalize);

    // 5) Create points for this file
    for (let i = 0; i < chunks.length; i++) {
      allPoints.push({
        id: pointId++,
        vector: normalizedVectors[i],
        payload: {
          doc_id: `file-${pointId}`,
          source: relativePath,
          chunk_index: i,
          text: chunks[i],
          tags: ["obsidian", "markdown", "knowledge"],
        },
      });
    }

    totalChunks += chunks.length;

    // Process in batches to avoid overwhelming the embedding API
    if (allPoints.length >= 100) {
      console.log(`Processing batch of ${allPoints.length} chunks...`);
      await processBatch(allPoints);
      allPoints.length = 0; // Clear the array
    }
  }

  // Process remaining points
  if (allPoints.length > 0) {
    console.log(`Processing final batch of ${allPoints.length} chunks...`);
    await processBatch(allPoints);
  }

  console.log(
    `\nProcessed ${markdownFiles.length} files with ${totalChunks} total chunks.`
  );

  // 6) Query - keeping this part the same as requested
  const query = "how do I use qdrant for rag?";
  const [queryVec] = await embedTexts([query]);
  const queryVecNorm = l2Normalize(queryVec);

  const results = await search(queryVecNorm, 5, {
    must: [
      { key: "tags", match: { any: ["obsidian", "markdown", "knowledge"] } },
    ],
  });

  console.log("\nTop results:");
  for (const r of results) {
    const text = r.payload?.text?.slice(0, 140)?.replace(/\s+/g, " ") ?? "";
    const source = r.payload?.source ?? "unknown";
    console.log(
      `- score=${r.score.toFixed(4)} source=${source} text="${text}..."`
    );
  }
}

async function processBatch(points: QdrantPoint[]): Promise<void> {
  if (points.length === 0) return;

  // Ensure collection exists (using dimension from first point)
  const dim = points[0].vector.length;
  await ensureCollection(dim);

  // Upsert batch
  await upsertBatch(points);
  console.log(`  Upserted ${points.length} chunks into "${QDRANT_COLLECTION}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
