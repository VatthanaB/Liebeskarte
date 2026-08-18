import { saveMemory } from "./db";
import { DEMO_MEMORIES } from "./sample-data";

export async function seedDemoMemories(): Promise<void> {
  for (const memory of DEMO_MEMORIES) {
    await saveMemory(memory);
  }
}
