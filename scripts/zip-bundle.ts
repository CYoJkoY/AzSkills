import { deflateRawSync } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { filesUnder } from "./link-bundle.ts";

function crc32(buffer: Buffer): number {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
  }
  return (value ^ 0xffffffff) >>> 0;
}

// Sorted entries with fixed timestamps make repeated archives byte-identical.
export async function writeZip(directory: string, archive: string): Promise<{ archive: string; files: number }> {
  const normalized = path.resolve(archive);
  const packaged = path.resolve(directory);
  const entries = (await filesUnder(packaged))
    .map((file) => ({ name: path.relative(packaged, file).split(path.sep).join("/"), source: file }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  if (entries.length > 0xffff) throw new Error("Bundle has too many files for a zip archive: " + entries.length);
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const text = await readFile(entry.source);
    const name = Buffer.from(entry.name, "utf8");
    const data = deflateRawSync(text, { level: 6 });
    const crc = crc32(text);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(0x21, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(text.length, 22);
    header.writeUInt16LE(name.length, 26);
    local.push(header, name, data);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(8, 10);
    record.writeUInt16LE(0x21, 14);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(data.length, 20);
    record.writeUInt32LE(text.length, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE(offset, 42);
    central.push(record, name);
    offset += header.length + name.length + data.length;
    if (text.length > 0xffffffff || data.length > 0xffffffff || offset > 0xffffffff) throw new Error("Bundle is too large for a zip archive: " + entry.name);
  }
  const centralSize = central.reduce((size: number, part: Buffer) => size + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  await mkdir(path.dirname(normalized), { recursive: true });
  await writeFile(normalized, Buffer.concat([...local, ...central, end]));
  return { archive: normalized, files: entries.length };
}
