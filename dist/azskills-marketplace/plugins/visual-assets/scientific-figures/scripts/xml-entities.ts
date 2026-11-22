const ENTITY = /&(?:amp|lt|gt|apos|quot|#\d+|#x[\da-fA-F]+);/g;
const NAMED: Readonly<Record<string, string>> = { amp: "&", lt: "<", gt: ">", apos: "'", quot: '"' };

function isXmlCharacter(code: number): boolean {
  return code === 9 || code === 10 || code === 13 ||
    (code >= 0x20 && code <= 0xd7ff) || (code >= 0xe000 && code <= 0xfffd) ||
    (code >= 0x10000 && code <= 0x10ffff);
}

export function validateXmlCharacters(source: string): void {
  for (const character of source) {
    if (!isXmlCharacter(character.codePointAt(0) ?? 0)) throw new SyntaxError("invalid XML character");
  }
}

function entityCharacter(reference: string): string {
  const name = reference.slice(1, -1);
  if (Object.hasOwn(NAMED, name)) return NAMED[name] ?? "";
  const code = name.startsWith("#x") ? parseInt(name.slice(2), 16) : Number(name.slice(1));
  if (!isXmlCharacter(code)) throw new SyntaxError("invalid XML character reference: " + reference);
  return String.fromCodePoint(code);
}

export function decodeXmlEntities(raw: string): string {
  if (raw.replace(ENTITY, "").includes("&")) throw new SyntaxError("invalid XML entity reference");
  return raw.replace(ENTITY, entityCharacter);
}
